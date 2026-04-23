import { createClient } from '@supabase/supabase-js';

// These variables are automatically loaded from your environment/secrets
// The VITE_ prefix allows them to be accessed in the browser
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.'
  );
}

/**
 * Standard Supabase client for client-side operations.
 * Respects Row Level Security (RLS) policies.
 */
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
