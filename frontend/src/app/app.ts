import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamsService } from './teams.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html'
})
export class AppComponent implements OnInit {
  teams: any[] = [];
  loading = true;

  constructor(
    private teamsService: TeamsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.teamsService.getTeams().subscribe(data => {
      this.teams = data;
      this.loading = false;
      this.cdr.detectChanges();
    });
  }
}