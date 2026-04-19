import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TeamsService } from '../teams.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html'
})
export class HomeComponent implements OnInit {
  teams: any[] = [];
  loading = true;

  constructor(
    private teamsService: TeamsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.teamsService.getTeams().subscribe((data: any) => {
      console.log('teams data:', data);
      this.teams = data.results || data;
      this.loading = false;
      this.cdr.detectChanges();
    });
  }
}