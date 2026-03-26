import type { Json } from '../models/database.types';

/** Type-safe cast for writing typed arrays/objects to Supabase JSONB columns. */
export function asJson<T>(value: T): Json {
  return value as unknown as Json;
}
