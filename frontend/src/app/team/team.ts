import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  loading = true;
  public teamId: string = '';

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
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.teamId = this.route.snapshot.paramMap.get('id') || '';

    this.http.get(`/api/games/teams/${this.teamId}/`).subscribe((data: any) => {
      this.team = data;
      this.cdr.detectChanges();
    });

    forkJoin({
      home: this.http.get(`/api/games/games/?home_team=${this.teamId}&season=2024-25`),
      away: this.http.get(`/api/games/games/?away_team=${this.teamId}&season=2024-25`),
      roster: this.http.get(`/api/stats/player-season-stats/?team=${this.teamId}&season=2024-25&limit=50`)
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
}