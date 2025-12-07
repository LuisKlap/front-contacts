import { Routes } from '@angular/router';
import { Signup } from './auth/components/signup/signup';
import { Auth } from './auth/auth';
import { Login } from './auth/components/login/login';

export const routes: Routes = [
  { path: 'signup', component: Signup },
  { path: 'login', component: Login },
  { path: 'auth', component: Auth },
  { path: '', redirectTo: 'signup', pathMatch: 'full' },
  { path: '**', redirectTo: 'signup' }
];
