import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './nav.html',
  styleUrl: './nav.scss'
})
export class NavComponent {
  searchQuery = '';
  searchResults: any[] = [];
  showResults = false;
  private searchSubject = new Subject<string>();

  constructor(
    private http: HttpClient,
    private router: Router,
    public auth: AuthService
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 2) {
          this.searchResults = [];
          this.showResults = false;
          return [];
        }
        return this.http.get(`/api/players/players/?search=${query}`);
      })
    ).subscribe((data: any) => {
      this.searchResults = data.results || data;
      this.showResults = this.searchResults.length > 0;
    });
  }

  onSearch() { this.searchSubject.next(this.searchQuery); }

  goToPlayer(playerId: number) {
    this.showResults = false;
    this.searchQuery = '';
    this.router.navigate(['/player', playerId]);
  }

  hideResults() { setTimeout(() => this.showResults = false, 200); }

  logout() { this.auth.logout(); }
}