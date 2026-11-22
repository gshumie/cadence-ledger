import { createClient } from '@supabase/supabase-js';

const sanitizeEnv = (val?: string): string => {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
};

const supabaseUrl =
  sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) || 'https://placeholder-project.supabase.co';
const supabaseAnonKey =
  sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 'placeholder-anon-key';

export const isSupabaseConfigured = (): boolean => {
  const url = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return Boolean(
    url &&
    key &&
    !url.includes('placeholder') &&
    key !== 'placeholder-anon-key' &&
    key.startsWith('eyJ')
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
