import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { Team } from './team/team';
import { Player } from './player/player';
import { LoginComponent } from './login/login';
import { AccountComponent } from './account/account';
import { CvComponent } from './cv/cv';
import { ThesisComponent } from './cv/thesis/thesis';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'team/:id', component: Team },
  { path: 'team/:id/:season', component: Team },
  { path: 'player/:id', component: Player },
  { path: 'player/:id/:season', component: Player },
  { path: 'account', component: AccountComponent, canActivate: [authGuard] },
  { path: 'cv', component: CvComponent },
  { path: 'cv/thesis', component: ThesisComponent },
  { path: '**', redirectTo: '' },
];