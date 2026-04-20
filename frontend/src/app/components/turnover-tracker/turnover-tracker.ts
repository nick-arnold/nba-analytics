import { Component, OnInit, OnChanges, Input, SimpleChanges, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-turnover-tracker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './turnover-tracker.html',
  styleUrl: './turnover-tracker.scss'
})
export class TurnoverTrackerComponent implements OnInit, OnChanges {
  @Input() teamId: string = '';
  @Input() season: string = '';
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  loading = true;
  players: any[] = [];
  games: any[] = [];
  activePlayerIds: Set<number> = new Set();
  showTeamTotal = true;
  showLeagueAvg = true;
  leagueTovPct = 0;
  sortCol = 'ballSecurity';
  sortDir = -1;
  rollingWindow = 5;
  minMinutes = 10;
  minUsageGames = 5;
  showDefinitions = false;

  private colorPalette = [
    '#E03A3E', '#6C8EBF', '#4AADAC', '#E8A838',
    '#9B59B6', '#2ECC71', '#E67E22', '#1ABC9C',
    '#F1948A', '#7FB3D3'
  ];
  private playerColors: Map<number, string> = new Map();

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (this.teamId && this.season) this.loadData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['teamId'] || changes['season']) && this.teamId && this.season) this.loadData();
  }

  parseMinutes(min: string | null): number {
    if (!min) return 0;
    const parts = String(min).split(':');
    return parseInt(parts[0], 10) || 0;
  }

  tovPct(tov: number, fga: number, fta: number, ast: number): number {
    const denom = fga + 0.44 * fta + ast + tov;
    if (denom === 0) return 0;
    return +(tov / denom * 100).toFixed(1);
  }

  ballSecurityRating(pts: number, ast: number, tov: number): number | null {
    if (tov === 0) return null;
    return +((pts + ast * 2) / tov).toFixed(1);
  }

  usageProxy(fga: number, fta: number, ast: number, tov: number, gp: number): number {
    return +((fga + 0.44 * fta + ast + tov) / gp).toFixed(1);
  }

  rollingAvg(values: number[], window: number): number[] {
    return values.map((_, i) => {
      const start = Math.max(0, i - window + 1);
      const slice = values.slice(start, i + 1);
      return +(slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(1);
    });
  }

  loadData() {
    this.loading = true;
    forkJoin({
      log: this.http.get(`/api/stats/player-game-log/?team=${this.teamId}&season=${this.season}&limit=2000`),
      league: this.http.get(`/api/stats/league-tov-avg/?season=${this.season}`)
    }).subscribe((results: any) => {
      const rows: any[] = results.log.results || results.log;
      this.leagueTovPct = results.league.league_tov_pct;

      const gameMap = new Map<number, any>();
      const playerMap = new Map<number, any>();

      rows.forEach(r => {
        const mins = this.parseMinutes(r.minutes);

        if (!gameMap.has(r.game)) {
          gameMap.set(r.game, { id: r.game, date: r.game_date, tov: 0, fga: 0, fta: 0, ast: 0 });
        }
        const g = gameMap.get(r.game);
        g.tov += r.turnover || 0;
        g.fga += r.fga || 0;
        g.fta += r.fta || 0;
        g.ast += r.ast || 0;

        if (!playerMap.has(r.player)) {
          playerMap.set(r.player, {
            id: r.player, name: r.player_name,
            games: [], gp: 0,
            totalTov: 0, totalPts: 0, totalAst: 0,
            totalFga: 0, totalFta: 0
          });
        }
        const p = playerMap.get(r.player);

        if (mins >= this.minMinutes) {
          p.games.push({
            gameId: r.game, date: r.game_date,
            tov: r.turnover || 0, fga: r.fga || 0,
            fta: r.fta || 0, ast: r.ast || 0,
            pts: r.pts || 0, mins,
          });
          p.gp++;
          p.totalTov += r.turnover || 0;
          p.totalPts += r.pts || 0;
          p.totalAst += r.ast || 0;
          p.totalFga += r.fga || 0;
          p.totalFta += r.fta || 0;
        }
      });

      this.games = Array.from(gameMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(g => ({ ...g, tovPct: this.tovPct(g.tov, g.fga, g.fta, g.ast) }));

      const teamRolling = this.rollingAvg(this.games.map(g => g.tovPct), this.rollingWindow);
      this.games = this.games.map((g, i) => ({ ...g, rolling: teamRolling[i] }));

      this.players = Array.from(playerMap.values())
        .filter(p => p.gp >= this.minUsageGames)
        .map(p => {
          const sorted = p.games.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
          const tovPcts = sorted.map((g: any) => this.tovPct(g.tov, g.fga, g.fta, g.ast));
          const rolling = this.rollingAvg(tovPcts, this.rollingWindow);
          const avgTovPct = +(tovPcts.reduce((a: number, b: number) => a + b, 0) / tovPcts.length).toFixed(1);
          const usage = this.usageProxy(p.totalFga, p.totalFta, p.totalAst, p.totalTov, p.gp);
          const bsr = this.ballSecurityRating(p.totalPts, p.totalAst, p.totalTov);
          return {
            ...p,
            games: sorted.map((g: any, i: number) => ({ ...g, tovPct: tovPcts[i], rolling: rolling[i] })),
            avgTovPct,
            usage,
            ballSecurity: bsr,
          };
        })
        .filter(p => p.usage >= 3)
        .sort((a, b) => (b.ballSecurity || 0) - (a.ballSecurity || 0));

      this.players.forEach((p, i) => {
        this.playerColors.set(p.id, this.colorPalette[i % this.colorPalette.length]);
      });

      this.activePlayerIds = new Set(this.players.slice(0, 4).map(p => p.id));

      this.loading = false;
      this.cdr.detectChanges();
      setTimeout(() => this.drawChart(), 50);
    });
  }

  getColor(playerId: number): string {
    return this.playerColors.get(playerId) || '#888';
  }

  togglePlayer(playerId: number) {
    if (this.activePlayerIds.has(playerId)) {
      this.activePlayerIds.delete(playerId);
    } else {
      this.activePlayerIds.add(playerId);
    }
    this.drawChart();
    this.cdr.detectChanges();
  }

  toggleTeamTotal() {
    this.showTeamTotal = !this.showTeamTotal;
    this.drawChart();
  }

  toggleLeagueAvg() {
    this.showLeagueAvg = !this.showLeagueAvg;
    this.drawChart();
  }

  sortBy(col: string) {
    if (this.sortCol === col) {
      this.sortDir *= -1;
    } else {
      this.sortCol = col;
      this.sortDir = col === 'name' ? 1 : -1;
    }
  }

  get sortedPlayers(): any[] {
    return [...this.players].sort((a, b) => {
      const va = a[this.sortCol];
      const vb = b[this.sortCol];
      if (va === null) return 1;
      if (vb === null) return -1;
      if (typeof va === 'string') return this.sortDir * va.localeCompare(vb);
      return this.sortDir * (vb - va);
    });
  }

  drawChart() {
    if (!this.chartCanvas) return;
    const canvas = this.chartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const margin = { top: 20, right: 80, bottom: 60, left: 40 };
    const iw = w - margin.left - margin.right;
    const ih = h - margin.top - margin.bottom;

    ctx.clearRect(0, 0, w, h);
    if (this.games.length === 0) return;

    const activePlayers = this.players.filter(p => this.activePlayerIds.has(p.id));
    const allValues = [
      ...(this.showTeamTotal ? this.games.map(g => g.rolling) : []),
      ...activePlayers.flatMap(p => p.games.map((g: any) => g.rolling)),
      this.leagueTovPct
    ];
    const maxY = Math.max(...allValues, 20) + 5;

    const xScale = (i: number) => margin.left + (i / Math.max(this.games.length - 1, 1)) * iw;
    const yScale = (v: number) => margin.top + ih - (v / maxY) * ih;

    ctx.strokeStyle = 'rgba(0,0,0,0.07)';
    ctx.lineWidth = 1;
    for (let t = 0; t <= maxY; t += 5) {
      const y = yScale(t);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + iw, y);
      ctx.stroke();
      ctx.fillStyle = '#adb5bd';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(t + '%', margin.left - 6, y + 4);
    }

    const step = Math.ceil(this.games.length / 12);
    this.games.forEach((g, i) => {
      if (i % step !== 0) return;
      ctx.fillStyle = '#adb5bd';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(g.date.slice(5), xScale(i), h - margin.bottom + 14);
    });

    const drawLine = (points: number[], color: string, dashed = false, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = dashed ? 1.5 : 2;
      ctx.setLineDash(dashed ? [6, 4] : []);
      ctx.beginPath();
      points.forEach((v, i) => {
        const x = xScale(i);
        const y = yScale(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    };

    // league average horizontal line
    if (this.showLeagueAvg && this.leagueTovPct > 0) {
      const y = yScale(this.leagueTovPct);
      ctx.save();
      ctx.strokeStyle = '#0d6efd';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + iw, y);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#0d6efd';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'left';
      ctx.globalAlpha = 0.8;
      ctx.fillText(`Lg avg ${this.leagueTovPct}%`, margin.left + iw + 4, y + 4);
      ctx.globalAlpha = 1;
    }

    if (this.showTeamTotal) {
      drawLine(this.games.map(g => g.rolling), '#555', true, 0.6);
    }

    activePlayers.forEach(player => {
      const color = this.getColor(player.id);
      const gameIdToIndex = new Map(this.games.map((g, i) => [g.id, i]));
      const values: (number | null)[] = new Array(this.games.length).fill(null);
      player.games.forEach((g: any) => {
        const idx = gameIdToIndex.get(g.gameId);
        if (idx !== undefined) values[idx] = g.rolling;
      });
      const validPoints = values.filter(v => v !== null) as number[];
      if (validPoints.length > 0) drawLine(validPoints, color);
    });
  }
}