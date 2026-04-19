import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './player.html',
  styleUrl: './player.scss',
})
export class Player implements OnInit {
  player: any = null;
  stats: any[] = [];
  loading = true;
  public playerId: string = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.playerId = this.route.snapshot.paramMap.get('id') || '';

    this.http.get(`/api/players/players/${this.playerId}/`).subscribe((data: any) => {
      this.player = data;
      this.cdr.detectChanges();
    });

    this.http.get(`/api/stats/playerstats/?player=${this.playerId}`).subscribe((data: any) => {
      this.stats = data.results || data;
      this.loading = false;
      this.cdr.detectChanges();
    });
  }
}