import { Routes } from '@angular/router';
import { Signup } from './auth/components/signup/signup';
import { Auth } from './auth/auth';
import { Login } from './auth/components/login/login';

export const routes: Routes = [
  { path: 'signup', component: Signup },
  { path: 'login', component: Login },

  {
    path: 'auth',
    component: Auth,
  },

  {
    path: 'home',
    loadComponent: () => import('./home/home').then(m => m.Home)
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];

