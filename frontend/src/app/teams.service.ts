import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TeamsService {
  private apiUrl = '/api/games/teams/';

  constructor(private http: HttpClient) {}

  getTeams(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}