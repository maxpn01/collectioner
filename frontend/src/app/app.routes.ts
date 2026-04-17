import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'profile',
  },
  {
    path: 'signin',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/signin/signin.page').then((page) => page.SigninPage),
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/signup/signup.page').then((page) => page.SignupPage),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./profile/profile.page').then((page) => page.ProfilePage),
  },
  {
    path: '**',
    redirectTo: 'profile',
  },
];
