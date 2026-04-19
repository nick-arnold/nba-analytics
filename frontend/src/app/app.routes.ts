import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { Team } from './team/team';
import { Player } from './player/player';
import { LoginComponent } from './login/login';
import { AccountComponent } from './account/account';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'team/:id', component: Team },
  { path: 'player/:id', component: Player },
  { path: 'account', component: AccountComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];