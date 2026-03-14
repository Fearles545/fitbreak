import { Injectable, computed, inject, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from '@shared/services/supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);

  private _user = signal<User | null>(null);
  private _initialAuthResolved = false;
  private _initialAuthPromise: Promise<void>;

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  constructor() {
    this._initialAuthPromise = new Promise<void>((resolve) => {
      this.supabase.auth.onAuthStateChange((_event, session) => {
        this._user.set(session?.user ?? null);
        if (!this._initialAuthResolved) {
          this._initialAuthResolved = true;
          resolve();
        }
      });
    });
  }

  /** Waits for the initial session check to complete. Used by auth guard. */
  waitForInitialAuth(): Promise<void> {
    return this._initialAuthPromise;
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + (document.baseURI.replace(window.location.origin, '') || '/') },
    });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }
}
