import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TeamsService } from '../teams.service';
import { forkJoin } from 'rxjs';

const TEAM_COLORS: Record<string, { primary: string; secondary: string }> = {
  ATL: { primary: '#C8102E', secondary: '#FDB827' },
  BOS: { primary: '#007A33', secondary: '#BA9653' },
  BKN: { primary: '#000000', secondary: '#FFFFFF' },
  CHA: { primary: '#1D1160', secondary: '#00788C' },
  CHI: { primary: '#CE1141', secondary: '#000000' },
  CLE: { primary: '#860038', secondary: '#FDBB30' },
  DAL: { primary: '#00538C', secondary: '#002B5E' },
  DEN: { primary: '#0E2240', secondary: '#FEC524' },
  DET: { primary: '#C8102E', secondary: '#1D42BA' },
  GSW: { primary: '#1D428A', secondary: '#FFC72C' },
  HOU: { primary: '#CE1141', secondary: '#000000' },
  IND: { primary: '#002D62', secondary: '#FDBB30' },
  LAC: { primary: '#C8102E', secondary: '#1D428A' },
  LAL: { primary: '#552583', secondary: '#FDB927' },
  MEM: { primary: '#5D76A9', secondary: '#12173F' },
  MIA: { primary: '#98002E', secondary: '#F9A01B' },
  MIL: { primary: '#00471B', secondary: '#EEE1C6' },
  MIN: { primary: '#0C2340', secondary: '#236192' },
  NOP: { primary: '#0C2340', secondary: '#C8102E' },
  NYK: { primary: '#006BB6', secondary: '#F58426' },
  OKC: { primary: '#007AC1', secondary: '#EF3B24' },
  ORL: { primary: '#0077C0', secondary: '#C4CED4' },
  PHI: { primary: '#006BB6', secondary: '#ED174C' },
  PHX: { primary: '#1D1160', secondary: '#E56020' },
  POR: { primary: '#E03A3E', secondary: '#000000' },
  SAC: { primary: '#5A2D81', secondary: '#63727A' },
  SAS: { primary: '#C4CED4', secondary: '#000000' },
  TOR: { primary: '#CE1141', secondary: '#000000' },
  UTA: { primary: '#002B5C', secondary: '#00471B' },
  WAS: { primary: '#002B5C', secondary: '#E31837' },
};

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
    const today = this.getLocalDate(0);
    const yesterday = this.getLocalDate(-1);

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
        .sort((a: any, b: any) => {
          // Sort by tip-off time, then alphabetically
          if (a.game_datetime && b.game_datetime) {
            return new Date(a.game_datetime).getTime() - new Date(b.game_datetime).getTime();
          }
          return a.away_team.city.localeCompare(b.away_team.city);
        });
      this.scoresLoading = false;
      this.cdr.detectChanges();
    });
  }

  getLocalDate(offsetDays: number = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatTipoff(datetime: string | null): string {
    if (!datetime) return '';
    const d = new Date(datetime);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
      hour12: true,
    });
  }

  teamColor(abbr: string): string {
    return TEAM_COLORS[abbr]?.primary ?? '#adb5bd';
  }

  teamSecondary(abbr: string): string {
    return TEAM_COLORS[abbr]?.secondary ?? '#dee2e6';
  }
}