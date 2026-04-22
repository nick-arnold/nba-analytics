import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TeamsService } from '../teams.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  east: any[] = [];
  west: any[] = [];
  yesterdayGames: any[] = [];
  todayGames: any[] = [];
  loading = true;
  scoresLoading = true;

  constructor(
    private teamsService: TeamsService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const today = this.formatDate(new Date());
    const yesterday = this.formatDate(new Date(Date.now() - 86400000));

    this.teamsService.getTeams().subscribe((data: any) => {
      const teams = data.results || data;
      this.east = teams
        .filter((t: any) => t.conference === 'East')
        .sort((a: any, b: any) => a.city.localeCompare(b.city));
      this.west = teams
        .filter((t: any) => t.conference === 'West')
        .sort((a: any, b: any) => a.city.localeCompare(b.city));
      this.loading = false;
      this.cdr.detectChanges();
    });

    forkJoin({
      yesterday: this.http.get(`/api/games/games/?game_date=${yesterday}&limit=20`),
      today: this.http.get(`/api/games/games/?game_date=${today}&limit=20`),
    }).subscribe((results: any) => {
      this.yesterdayGames = (results.yesterday.results || results.yesterday)
        .sort((a: any, b: any) => a.away_team.city.localeCompare(b.away_team.city));
      this.todayGames = (results.today.results || results.today)
        .sort((a: any, b: any) => a.away_team.city.localeCompare(b.away_team.city));
      this.scoresLoading = false;
      this.cdr.detectChanges();
    });
  }

  formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}