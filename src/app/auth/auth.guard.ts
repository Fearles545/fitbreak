import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { SettingsService } from '../settings/settings.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const settings = inject(SettingsService);

  await auth.waitForInitialAuth();

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  await settings.ensureLoaded();
  return true;
};

/** Reverse guard: redirects authenticated users away from login */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.waitForInitialAuth();

  if (auth.isAuthenticated()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
