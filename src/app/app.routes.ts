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

  {
    path: 'profile',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./profile/components/profile-view/profile-view').then(m => m.ProfileViewComponent)
      },
      {
        path: 'edit',
        loadComponent: () => import('./profile/components/profile-edit/profile-edit').then(m => m.ProfileEditComponent)
      },
      {
        path: 'delete',
        loadComponent: () => import('./profile/components/profile-delete/profile-delete').then(m => m.ProfileDeleteComponent)
      }
    ]
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
