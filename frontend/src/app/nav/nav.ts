import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationStart } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';
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

    // Clear search on any navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => {
      this.searchQuery = '';
      this.searchResults = [];
      this.showResults = false;
    });
  }

  onSearch() { this.searchSubject.next(this.searchQuery); }

  goToPlayer(slug: string) {
    this.showResults = false;
    this.searchQuery = '';
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/player', slug]);
    });
  }

  hideResults() { setTimeout(() => this.showResults = false, 200); }

  goToAccount() {
    sessionStorage.setItem('preAccountUrl', this.router.url);
    this.router.navigate(['/account']);
  }
}