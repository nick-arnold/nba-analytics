import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class GameComponent implements OnInit {
  @ViewChild('scoreChart') scoreChartRef!: ElementRef;

  game: any = null;
  scoringPlays: any[] = [];
  loading = true;
  error = false;
  chart: any = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const nbaGameId = this.route.snapshot.paramMap.get('nbaGameId');

    forkJoin({
      game: this.http.get(`/api/games/games/by-nba-id/${nbaGameId}/`),
      plays: this.http.get(`/api/stats/scoring-plays/?game_id=${nbaGameId}`),
    }).subscribe({
      next: (results: any) => {
        this.game = results.game;
        this.scoringPlays = results.plays.plays || [];
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.buildChart(), 50);
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get isLive(): boolean {
    if (!this.game?.status) return false;
    if (this.game.status === 'Final') return false;
    if (this.game.status.startsWith('20')) return false;
    return true;
  }

  formatTipoff(datetime: string | null): string {
    if (!datetime) return 'Upcoming';
    const d = new Date(datetime);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
      hour12: true,
    });
  }

  formatClock(clock: string | null): string {
    if (!clock) return '';
    if (clock.includes(':')) return clock;
    const secs = Math.floor(parseFloat(clock));
    const m = Math.floor(secs / 60);
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  buildChart() {
    if (!this.scoreChartRef || !this.scoringPlays.length) return;

    const plays = this.scoringPlays;
    const homeAbbr = this.game.home_team.abbreviation;
    const awayAbbr = this.game.away_team.abbreviation;
    const isLive = this.isLive;

    const homePoints = [0, ...plays.map((p: any) => p.home_score)];
    const awayPoints = [0, ...plays.map((p: any) => p.away_score)];

    const quarterLines: number[] = [];
    let lastPeriod = 1;
    plays.forEach((p: any, i: number) => {
      if (p.period !== lastPeriod) {
        quarterLines.push(i + 1);
        lastPeriod = p.period;
      }
    });

    const periodsPresent = [...new Set(plays.map((p: any) => p.period))].sort();

    const quarterPlugin = {
      id: 'quarterLines',
      afterDraw: (chart: any) => {
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;

        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        quarterLines.forEach((idx: number) => {
          const x = xAxis.getPixelForValue(idx);
          ctx.beginPath();
          ctx.moveTo(x, yAxis.top);
          ctx.lineTo(x, yAxis.bottom);
          ctx.stroke();
        });
        ctx.restore();

        ctx.save();
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        const boundaries = [0, ...quarterLines, plays.length + 1];
        periodsPresent.forEach((period: number, i: number) => {
          const label = period <= 4 ? `Q${period}` : `OT${period - 4}`;
          const displayLabel = isLive && i === periodsPresent.length - 1 ? `${label} ●` : label;
          const midX = (xAxis.getPixelForValue(boundaries[i]) + xAxis.getPixelForValue(boundaries[i + 1])) / 2;
          ctx.fillStyle = isLive && i === periodsPresent.length - 1 ? 'rgba(34,197,94,0.7)' : 'rgba(0,0,0,0.25)';
          ctx.fillText(displayLabel, midX, yAxis.top - 6);
        });
        ctx.restore();
      }
    };

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(this.scoreChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: homePoints.map((_: any, i: number) => i),
        datasets: [
          {
            label: awayAbbr,
            data: awayPoints,
            borderColor: '#4a90d9',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.1,
          },
          {
            label: homeAbbr,
            data: homePoints,
            borderColor: '#e05a2b',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: { size: 12 },
              usePointStyle: true,
              pointStyle: 'line',
              pointStyleWidth: 20,
            }
          },
          tooltip: {
            callbacks: {
              title: (items: any) => {
                const idx = items[0].dataIndex;
                if (idx === 0) return 'Tip off';
                const play = plays[idx - 1];
                const period = play.period <= 4 ? `Q${play.period}` : `OT${play.period - 4}`;
                return `${period} ${this.formatClock(play.clock)}`;
              },
              afterBody: (items: any) => {
                const idx = items[0].dataIndex;
                if (idx === 0) return [];
                return [plays[idx - 1].description];
              }
            }
          }
        },
        scales: {
          x: { display: false },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { font: { size: 11 } }
          }
        }
      },
      plugins: [quarterPlugin],
    });
  }

  get homeTeamTotals() {
    return this.calcTotals(this.game?.home_box_score);
  }

  get awayTeamTotals() {
    return this.calcTotals(this.game?.away_box_score);
  }

  private calcTotals(boxScore: any[]) {
    if (!boxScore?.length) return null;
    const filtered = boxScore.filter(p => !this.isDnp(p));
    const t = filtered.reduce((acc, p) => ({
      pts:      (acc.pts      ?? 0) + (p.pts      ?? 0),
      reb:      (acc.reb      ?? 0) + (p.reb      ?? 0),
      ast:      (acc.ast      ?? 0) + (p.ast      ?? 0),
      stl:      (acc.stl      ?? 0) + (p.stl      ?? 0),
      blk:      (acc.blk      ?? 0) + (p.blk      ?? 0),
      turnover: (acc.turnover ?? 0) + (p.turnover ?? 0),
      fgm:      (acc.fgm      ?? 0) + (p.fgm      ?? 0),
      fga:      (acc.fga      ?? 0) + (p.fga      ?? 0),
      fg3m:     (acc.fg3m     ?? 0) + (p.fg3m     ?? 0),
      fg3a:     (acc.fg3a     ?? 0) + (p.fg3a     ?? 0),
      ftm:      (acc.ftm      ?? 0) + (p.ftm      ?? 0),
      fta:      (acc.fta      ?? 0) + (p.fta      ?? 0),
    }), {});
    return {
      ...t,
      fg_pct:  t.fga  > 0 ? (t.fgm  / t.fga  * 100).toFixed(1) : '—',
      fg3_pct: t.fg3a > 0 ? (t.fg3m / t.fg3a * 100).toFixed(1) : '—',
      ft_pct:  t.fta  > 0 ? (t.ftm  / t.fta  * 100).toFixed(1) : '—',
    };
  }

  gameTypeLabel(gameType: string): string {
    const map: Record<string, string> = {
      regular_season: 'Regular Season',
      playoff: 'Playoffs',
      play_in: 'Play-In',
      preseason: 'Preseason',
    };
    return map[gameType] ?? gameType;
  }

  formatMinutes(raw: string | null): string {
    if (!raw) return 'DNP';
    if (/^\d+$/.test(raw)) {
      const mins = parseInt(raw, 10);
      if (mins === 0) return 'DNP';
      return `${mins}`;
    }
    const match = raw.match(/PT(\d+)M([\d.]+)S/);
    if (match) {
      const mins = parseInt(match[1], 10);
      if (mins === 0) return 'DNP';
      const secs = String(Math.round(parseFloat(match[2]))).padStart(2, '0');
      return `${mins}:${secs}`;
    }
    return raw;
  }

  isDnp(p: any): boolean {
    if (!p.minutes) return true;
    if (/^\d+$/.test(p.minutes)) return parseInt(p.minutes, 10) === 0;
    const match = p.minutes.match(/PT(\d+)M/);
    if (match) return parseInt(match[1], 10) === 0;
    return false;
  }

  getBarPct(away: number, home: number, max: number): number {
    return Math.min(Math.abs(away - home) / max * 50, 50);
  }

  formatPct(val: number | null): string {
    if (val === null || val === undefined) return '—';
    return (val * 100).toFixed(1);
  }
}