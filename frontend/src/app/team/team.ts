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
      stats: this.http.get(`/api/stats/playerstats/?team=${this.teamId}&game__season=2024-25&limit=2000&page=1`)
    }).subscribe((results: any) => {
      const homeGames = results.home.results || results.home;
      const awayGames = results.away.results || results.away;
      this.games = [...homeGames, ...awayGames]
        .sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime());

      const statsData = results.stats.results || results.stats;
      const totalCount = results.stats.count || statsData.length;
      const pageSize = 2000;

      if (totalCount > pageSize) {
        const pages = Math.ceil(totalCount / pageSize);
        const pageRequests = [];
        for (let i = 2; i <= pages; i++) {
          pageRequests.push(
            this.http.get(`/api/stats/playerstats/?team=${this.teamId}&game__season=2024-25&limit=${pageSize}&page=${i}`)
          );
        }
        forkJoin(pageRequests).subscribe((pageResults: any) => {
          const allStats = [
            ...statsData,
            ...pageResults.flatMap((r: any) => r.results || r)
          ];
          this.buildRoster(allStats);
        });
      } else {
        this.buildRoster(statsData);
      }
    });
  }

  buildRoster(statsData: any[]) {
    const playerMap: any = {};

    statsData.forEach((s: any) => {
      if (!playerMap[s.player]) {
        playerMap[s.player] = {
          id: s.player,
          name: s.player_name,
          gp: 0, pts: 0, reb: 0, ast: 0
        };
      }
      const p = playerMap[s.player];
      const minutes = parseInt(s.minutes, 10);
      if (minutes > 0) {
        p.gp++;
        p.pts += s.pts;
        p.reb += s.reb;
        p.ast += s.ast;
      }
    });

    this.players = Object.values(playerMap)
      .filter((p: any) => p.gp > 0)
      .map((p: any) => ({
        ...p,
        ppg: (p.pts / p.gp).toFixed(1),
        rpg: (p.reb / p.gp).toFixed(1),
        apg: (p.ast / p.gp).toFixed(1),
      }))
      .sort((a: any, b: any) => b.ppg - a.ppg);

    this.loading = false;
    this.cdr.detectChanges();
  }
}