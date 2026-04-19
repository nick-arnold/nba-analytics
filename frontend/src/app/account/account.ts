import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './account.html',
  styleUrl: './account.scss'
})
export class AccountComponent implements OnInit {
  user: any = null;
  profile: any = null;
  loading = true;

  allTeams: any[] = [];
  playerSearchQuery = '';
  playerSearchResults: any[] = [];
  private playerSearch$ = new Subject<string>();

  currentPassword = '';
  newPassword = '';
  passwordMsg = '';
  passwordError = '';

  deleteConfirm = false;

  constructor(
    private http: HttpClient,
    public auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.http.get('/api/auth/me/').subscribe((user: any) => {
      this.user = user;
      this.cdr.detectChanges();
    });

    this.http.get('/api/auth/profile/').subscribe((profile: any) => {
      this.profile = profile;
      this.loading = false;
      this.cdr.detectChanges();
    });

    this.http.get('/api/games/teams/?limit=30').subscribe((data: any) => {
      this.allTeams = (data.results || data).sort((a: any, b: any) =>
        a.city.localeCompare(b.city)
      );
      this.cdr.detectChanges();
    });

    this.playerSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 2) { this.playerSearchResults = []; return []; }
        return this.http.get(`/api/players/players/?search=${query}`);
      })
    ).subscribe((data: any) => {
      this.playerSearchResults = (data.results || data).filter((p: any) =>
        !this.profile?.favorite_players?.find((fp: any) => fp.id === p.id)
      );
      this.cdr.detectChanges();
    });
  }

  isTeamFavorited(teamId: number): boolean {
    return this.profile?.favorite_teams?.some((t: any) => t.id === teamId);
  }

  toggleTeam(team: any) {
    if (!this.profile) return;
    const favorited = this.isTeamFavorited(team.id);
    if (favorited) {
      this.profile.favorite_teams = this.profile.favorite_teams.filter((t: any) => t.id !== team.id);
    } else {
      this.profile.favorite_teams = [...this.profile.favorite_teams, team];
    }
    this.saveTeams();
  }

  saveTeams() {
    const ids = this.profile.favorite_teams.map((t: any) => t.id);
    this.http.patch('/api/auth/profile/', { favorite_team_ids: ids }).subscribe();
  }

  onPlayerSearch() {
    this.playerSearch$.next(this.playerSearchQuery);
  }

  addPlayer(player: any) {
    if (!this.profile) return;
    this.profile.favorite_players = [...this.profile.favorite_players, player];
    this.playerSearchQuery = '';
    this.playerSearchResults = [];
    const ids = this.profile.favorite_players.map((p: any) => p.id);
    this.http.patch('/api/auth/profile/', { favorite_player_ids: ids }).subscribe();
  }

  removePlayer(playerId: number) {
    if (!this.profile) return;
    this.profile.favorite_players = this.profile.favorite_players.filter((p: any) => p.id !== playerId);
    const ids = this.profile.favorite_players.map((p: any) => p.id);
    this.http.patch('/api/auth/profile/', { favorite_player_ids: ids }).subscribe();
  }

  changePassword() {
    this.passwordMsg = '';
    this.passwordError = '';
    this.http.post('/api/auth/change-password/', {
      current_password: this.currentPassword,
      new_password: this.newPassword
    }).subscribe({
      next: () => {
        this.passwordMsg = 'Password updated successfully.';
        this.currentPassword = '';
        this.newPassword = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.passwordError = err.error?.error || 'Something went wrong.';
        this.cdr.detectChanges();
      }
    });
  }

  deleteAccount() {
    this.http.delete('/api/auth/delete-account/').subscribe(() => {
      this.auth.logout();
    });
  }
}