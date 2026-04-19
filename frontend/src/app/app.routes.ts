import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { Team } from './team/team';
import { Player } from './player/player';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'team/:id', component: Team },
  { path: 'player/:id', component: Player },
];