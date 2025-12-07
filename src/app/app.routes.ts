import { Routes } from '@angular/router';
import { Signup } from './auth/components/signup/signup';
import { Login } from './auth/components/login/login';
import { Auth } from './auth/auth';
import { AuthGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  { path: 'signup', component: Signup },
  { path: 'login', component: Login },

  {
    path: 'auth',
    component: Auth,
  },

  {
    path: 'home',
    canActivate: [AuthGuard],
    loadComponent: () => import('./home/home').then(m => m.Home)
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
