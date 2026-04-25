import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Subscription } from 'rxjs';
import { TurnoverTrackerComponent } from '../components/turnover-tracker/turnover-tracker';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, RouterLink, TurnoverTrackerComponent],
  templateUrl: './player.html',
  styleUrl: './player.scss',
})
export class Player implements OnInit, OnDestroy {
  player: any = null;
  seasonStats: any[] = [];
  gameLog: any[] = [];
  teams: Map<number, any> = new Map();
  loading = true;
  public playerId: string = '';
  public playerNumericId: string = '';
  selectedSeason: string = '2025-26';

  private routeSub?: Subscription;

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

  getOpponent(game: any): string {
    const isHome = game.home_team_id === game.team;
    const oppId = isHome ? game.away_team_id : game.home_team_id;
    const opp = this.teams.get(oppId);
    return opp ? `${opp.city} ${opp.name}` : 'opp';
  }

  getLocation(game: any): string {
    return game.home_team_id === game.team ? 'vs' : '@';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const newPlayerId = params.get('id') || '';
      const seasonParam = params.get('season');

      // If just the season changed (same player), only update the season selection
      if (newPlayerId === this.playerId && this.player) {
        if (seasonParam && this.seasonStats.find((s: any) => s.season === seasonParam)) {
          this.selectedSeason = seasonParam;
          this.cdr.detectChanges();
        }
        return;
      }

      // Otherwise, it's a new player — reset everything and load fresh
      this.playerId = newPlayerId;
      this.loadPlayer(seasonParam);
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }

  private loadPlayer(seasonParam: string | null) {
    this.loading = true;
    this.player = null;
    this.seasonStats = [];
    this.gameLog = [];
    this.cdr.detectChanges();

    this.http.get(`/api/players/players/${this.playerId}/`).subscribe((player: any) => {
      this.player = player;
      this.playerNumericId = String(player.id);

      forkJoin({
        seasons: this.http.get(`/api/stats/player-season-stats/?player=${this.playerNumericId}&limit=20`),
        log: this.http.get(`/api/stats/player-game-log/?player=${this.playerNumericId}&limit=2000`),
        teams: this.http.get(`/api/games/teams/?limit=30`)
      }).subscribe((results: any) => {
        this.seasonStats = (results.seasons.results || results.seasons)
          .sort((a: any, b: any) => b.season.localeCompare(a.season));
        this.gameLog = (results.log.results || results.log)
          .sort((a: any, b: any) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime());

        const teamList = results.teams.results || results.teams;
        this.teams = new Map();
        teamList.forEach((t: any) => this.teams.set(t.id, t));

        if (seasonParam && this.seasonStats.find((s: any) => s.season === seasonParam)) {
          this.selectedSeason = seasonParam;
        } else if (this.seasonStats.length > 0) {
          this.selectedSeason = this.seasonStats[0].season;
        }

        this.loading = false;
        this.cdr.detectChanges();
      });
    });
  }

  selectSeason(season: string) {
    this.selectedSeason = season;
    this.router.navigate(['/player', this.playerId, season]);
  }
}