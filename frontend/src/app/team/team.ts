import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { TurnoverTrackerComponent } from '../components/turnover-tracker/turnover-tracker';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, RouterLink, TurnoverTrackerComponent],
  templateUrl: './team.html',
  styleUrl: './team.scss',
})
export class Team implements OnInit {
  team: any = null;
  regularGames: any[] = [];
  playoffGames: any[] = [];
  players: any[] = [];
  availableSeasons: string[] = [];
  loading = true;
  public teamId: string = '';
  public teamNumericId: string = '';
  selectedSeason: string = '';
  gameFilter: 'regular' | 'playoffs' | 'all' = 'regular';

  getCurrentSeason(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    if (month >= 10) {
      return `${year}-${String(year + 1).slice(-2)}`;
    } else {
      return `${year - 1}-${String(year).slice(-2)}`;
    }
  }

  get filteredGames(): any[] {
    if (this.gameFilter === 'playoffs') return this.playoffGames;
    if (this.gameFilter === 'all') return [...this.regularGames, ...this.playoffGames]
      .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime());
    return this.regularGames;
  }

  get lastGame(): any | null {
    const played = [...this.regularGames, ...this.playoffGames]
      .filter(g => g.home_score !== null && g.away_score !== null)
      .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime());
    return played[0] ?? null;
  }

  get record(): { wins: number; losses: number } {
    let wins = 0; let losses = 0;
    this.regularGames.forEach(game => {
      const isHome = game.home_team.id === +this.teamNumericId;
      const teamScore = isHome ? game.home_score : game.away_score;
      const oppScore = isHome ? game.away_score : game.home_score;
      if (teamScore !== null && oppScore !== null) {
        if (teamScore > oppScore) wins++; else losses++;
      }
    });
    return { wins, losses };
  }

  get playoffRecord(): { wins: number; losses: number } {
    let wins = 0; let losses = 0;
    this.playoffGames.forEach(game => {
      const isHome = game.home_team.id === +this.teamNumericId;
      const teamScore = isHome ? game.home_score : game.away_score;
      const oppScore = isHome ? game.away_score : game.home_score;
      if (teamScore !== null && oppScore !== null) {
        if (teamScore > oppScore) wins++; else losses++;
      }
    });
    return { wins, losses };
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.teamId = this.route.snapshot.paramMap.get('id') || '';
    const seasonParam = this.route.snapshot.paramMap.get('season');
    this.selectedSeason = seasonParam || this.getCurrentSeason();

    this.http.get(`/api/games/teams/${this.teamId}/`).subscribe((data: any) => {
      this.team = data;
      this.teamNumericId = String(data.id);
      this.cdr.detectChanges();

      this.http.get(`/api/stats/player-season-stats/?team=${this.teamNumericId}&limit=200`)
        .subscribe((statsData: any) => {
          const allSeasons = (statsData.results || statsData).map((s: any) => s.season);
          this.availableSeasons = [...new Set(allSeasons) as Set<string>]
            .sort((a, b) => b.localeCompare(a));
          this.cdr.detectChanges();
        });

      this.loadSeasonData(this.selectedSeason);
    });
  }

  loadSeasonData(season: string) {
    this.selectedSeason = season;
    this.loading = true;

    forkJoin({
      homeReg: this.http.get(`/api/games/games/?home_team=${this.teamNumericId}&season=${season}&game_type=regular_season`),
      awayReg: this.http.get(`/api/games/games/?away_team=${this.teamNumericId}&season=${season}&game_type=regular_season`),
      homePlay: this.http.get(`/api/games/games/?home_team=${this.teamNumericId}&season=${season}&game_type=playoff`),
      awayPlay: this.http.get(`/api/games/games/?away_team=${this.teamNumericId}&season=${season}&game_type=playoff`),
      roster: this.http.get(`/api/stats/player-season-stats/?team=${this.teamNumericId}&season=${season}&limit=50`)
    }).subscribe((results: any) => {
      this.regularGames = [
        ...(results.homeReg.results || results.homeReg),
        ...(results.awayReg.results || results.awayReg)
      ].sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime());

      this.playoffGames = [
        ...(results.homePlay.results || results.homePlay),
        ...(results.awayPlay.results || results.awayPlay)
      ].sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime());

      this.players = (results.roster.results || results.roster)
        .sort((a: any, b: any) => parseFloat(b.ppg) - parseFloat(a.ppg));

      this.gameFilter = this.playoffGames.length > 0 ? 'playoffs' : 'regular';

      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  selectSeason(season: string) {
    this.router.navigate(['/team', this.teamId, season]);
    this.loadSeasonData(season);
  }

  setGameFilter(filter: 'regular' | 'playoffs' | 'all') {
    this.gameFilter = filter;
  }
}