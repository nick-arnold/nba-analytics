import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-thesis',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './thesis.html',
  styleUrl: './thesis.scss'
})
export class ThesisComponent {}