import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '@shared/services/supabase.service';

export const authGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
