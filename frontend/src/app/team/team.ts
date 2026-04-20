import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './team.html',
  styleUrl: './team.scss',
})
export class Team implements OnInit {
  team: any = null;
  games: any[] = [];
  players: any[] = [];
  availableSeasons: string[] = [];
  loading = true;
  public teamId: string = '';
  selectedSeason: string = '';

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

  get record(): { wins: number; losses: number } {
    let wins = 0;
    let losses = 0;
    this.games.forEach(game => {
      const isHome = game.home_team.id === +this.teamId;
      const teamScore = isHome ? game.home_score : game.away_score;
      const oppScore = isHome ? game.away_score : game.home_score;
      if (teamScore > oppScore) wins++;
      else losses++;
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
      this.cdr.detectChanges();
    });

    this.http.get(`/api/stats/player-season-stats/?team=${this.teamId}&limit=200`)
      .subscribe((data: any) => {
        const allSeasons = (data.results || data).map((s: any) => s.season);
        this.availableSeasons = [...new Set(allSeasons) as Set<string>]
          .sort((a, b) => b.localeCompare(a));
        this.cdr.detectChanges();
      });

    this.loadSeason(this.selectedSeason);
  }

  loadSeason(season: string) {
    this.selectedSeason = season;
    this.loading = true;

    forkJoin({
      home: this.http.get(`/api/games/games/?home_team=${this.teamId}&season=${season}&game_type=regular_season`),
      away: this.http.get(`/api/games/games/?away_team=${this.teamId}&season=${season}&game_type=regular_season`),
      roster: this.http.get(`/api/stats/player-season-stats/?team=${this.teamId}&season=${season}&limit=50`)
    }).subscribe((results: any) => {
      const homeGames = results.home.results || results.home;
      const awayGames = results.away.results || results.away;
      this.games = [...homeGames, ...awayGames]
        .sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime());

      this.players = (results.roster.results || results.roster)
        .sort((a: any, b: any) => parseFloat(b.ppg) - parseFloat(a.ppg));

      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  selectSeason(season: string) {
    this.router.navigate(['/team', this.teamId, season]);
    this.loadSeason(season);
  }
}