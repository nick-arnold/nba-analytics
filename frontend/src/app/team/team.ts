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
      stats: this.http.get(`/api/stats/playerstats/?team=${this.teamId}&game__season=2024-25`)
    }).subscribe((results: any) => {
      const homeGames = results.home.results || results.home;
      const awayGames = results.away.results || results.away;
      this.games = [...homeGames, ...awayGames];
      this.games.sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime());

      const statsData = results.stats.results || results.stats;
      const playerMap: any = {};
      statsData.forEach((s: any) => {
        if (!playerMap[s.player]) {
          playerMap[s.player] = { id: s.player, name: s.player_name };
        }
      });
      this.players = Object.values(playerMap);

      this.loading = false;
      this.cdr.detectChanges();
    });
  }
}