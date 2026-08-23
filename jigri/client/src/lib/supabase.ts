/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};

const supabaseUrl =
  env.VITE_SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_URL ||
  env.SUPABASE_URL ||
  'https://tsiidmrzypuadcrqjtzk.supabase.co';

const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  env.SUPABASE_ANON_KEY ||
  env.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_XG2pbfxfvdTfED1NIX0UrQ_N4EFlTbs';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('demo-project')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
