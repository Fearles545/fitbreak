import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'break',
    canActivate: [authGuard],
    loadComponent: () => import('./break-timer/break-timer.component').then(m => m.BreakTimerComponent),
  },
  {
    path: 'strength',
    canActivate: [authGuard],
    loadComponent: () => import('./strength/strength.component').then(m => m.StrengthComponent),
  },
  {
    path: 'stepper',
    canActivate: [authGuard],
    loadComponent: () => import('./stepper/stepper.component').then(m => m.StepperComponent),
  },
  {
    path: 'progress',
    canActivate: [authGuard],
    loadComponent: () => import('./progress/progress.component').then(m => m.ProgressComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
