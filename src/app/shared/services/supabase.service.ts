import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey,
  );

  get supabase(): SupabaseClient {
    return this.client;
  }

  get auth() {
    return this.client.auth;
  }
}
