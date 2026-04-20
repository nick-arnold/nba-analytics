import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { TurnoverTrackerComponent } from '../components/turnover-tracker/turnover-tracker';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, RouterLink, TurnoverTrackerComponent],
  templateUrl: './player.html',
  styleUrl: './player.scss',
})
export class Player implements OnInit {
  player: any = null;
  seasonStats: any[] = [];
  gameLog: any[] = [];
  loading = true;
  public playerId: string = '';
  selectedSeason: string = '2025-26';

  get currentSeasonStats(): any {
    return this.seasonStats.find(s => s.season === this.selectedSeason) || null;
  }

  get seasons(): string[] {
    return [...new Set(this.seasonStats.map((s: any) => s.season))]
      .sort((a, b) => b.localeCompare(a));
  }

  get filteredGameLog(): any[] {
    return this.gameLog.filter(g => g.season === this.selectedSeason);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.playerId = this.route.snapshot.paramMap.get('id') || '';
    const seasonParam = this.route.snapshot.paramMap.get('season');

    forkJoin({
      player: this.http.get(`/api/players/players/${this.playerId}/`),
      seasons: this.http.get(`/api/stats/player-season-stats/?player=${this.playerId}&limit=20`),
      log: this.http.get(`/api/stats/player-game-log/?player=${this.playerId}&limit=2000`)
    }).subscribe((results: any) => {
      this.player = results.player;
      this.seasonStats = (results.seasons.results || results.seasons)
        .sort((a: any, b: any) => b.season.localeCompare(a.season));
      this.gameLog = (results.log.results || results.log)
        .sort((a: any, b: any) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime());

      if (seasonParam && this.seasonStats.find(s => s.season === seasonParam)) {
        this.selectedSeason = seasonParam;
      } else if (this.seasonStats.length > 0) {
        this.selectedSeason = this.seasonStats[0].season;
      }

      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  selectSeason(season: string) {
    this.selectedSeason = season;
    this.router.navigate(['/player', this.playerId, season]);
  }
}