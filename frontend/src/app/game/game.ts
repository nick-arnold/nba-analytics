import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class GameComponent implements OnInit {
  game: any = null;
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const nbaGameId = this.route.snapshot.paramMap.get('nbaGameId');
    this.http.get(`/api/games/games/by-nba-id/${nbaGameId}/`).subscribe({
      next: (data: any) => {
        this.game = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
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
    const t = boxScore.reduce((acc, p) => ({
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
    if (!raw) return '—';
    const match = raw.match(/PT(\d+)M([\d.]+)S/);
    if (match) {
      const mins = match[1];
      const secs = String(Math.round(parseFloat(match[2]))).padStart(2, '0');
      return `${mins}:${secs}`;
    }
    return raw;
  }

  formatPct(val: number | null): string {
    if (val === null || val === undefined) return '—';
    return (val * 100).toFixed(1);
  }
}