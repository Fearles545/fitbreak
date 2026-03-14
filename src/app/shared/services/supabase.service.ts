import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment';
import { Database } from '@shared/models/database.types';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient<Database> = createClient<Database>(
    environment.supabaseUrl,
    environment.supabaseKey,
  );

  get supabase(): SupabaseClient<Database> {
    return this.client;
  }

  get auth() {
    return this.client.auth;
  }
}
