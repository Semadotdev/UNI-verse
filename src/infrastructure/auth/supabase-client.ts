import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/lib/env';

let supabaseInstance: ReturnType<typeof createClient> | null = null;
let supabaseServiceInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;
  const env = getEnv();
  supabaseInstance = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  return supabaseInstance;
}

export function getSupabaseServiceClient() {
  if (supabaseServiceInstance) return supabaseServiceInstance;
  const env = getEnv();
  supabaseServiceInstance = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  return supabaseServiceInstance;
}
