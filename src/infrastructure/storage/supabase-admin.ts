import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '@/lib/env';

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (!adminClient) {
    const env = getEnv();
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return adminClient;
}
