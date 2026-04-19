import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private currentUser = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUser.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      this.accessToken = parsed.access;
      this.refreshToken = parsed.refresh;
      this.currentUser.next(parsed.user);
    }
  }

  register(email: string, password: string): Observable<any> {
    return this.http.post('/api/auth/register/', { email, password }).pipe(
      tap((res: any) => this.handleAuth(res))
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post('/api/auth/login/', { username: email, password }).pipe(
      tap((res: any) => this.handleAuth(res))
    );
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    this.currentUser.next(null);
    localStorage.removeItem('auth');
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  private handleAuth(res: any) {
    this.accessToken = res.access;
    this.refreshToken = res.refresh;
    const user = res.user || null;
    this.currentUser.next(user);
    localStorage.setItem('auth', JSON.stringify({
      access: res.access,
      refresh: res.refresh,
      user
    }));
  }
}