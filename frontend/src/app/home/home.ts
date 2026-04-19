import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TeamsService } from '../teams.service';

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
  loading = true;

  constructor(
    private teamsService: TeamsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.teamsService.getTeams().subscribe((data: any) => {
      const teams = data.results || data;
      this.east = teams
        .filter((t: any) => t.conference === 'East')
        .sort((a: any, b: any) => a.city.localeCompare(b.city));
      this.west = teams
        .filter((t: any) => t.conference === 'West')
        .sort((a: any, b: any) => a.city.localeCompare(b.city));
      thi