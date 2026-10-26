import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Determine if valid Supabase credentials are provided (and not just default template placeholders)
 */
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.trim() !== '' &&
    supabaseAnonKey.trim() !== '' &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-public-key')
);

/**
 * Singleton Supabase client instance (or null in Demo Mode)
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

/**
 * Checks connectivity to the configured Supabase instance
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      message: 'Demo Mode: Supabase credentials are not configured in environment variables.',
    };
  }

  try {
    const { error } = await supabase.from('grounds').select('id').limit(1);
    if (error) {
      return {
        ok: false,
        message: `Database connection error: ${error.message} (Code: ${error.code})`,
      };
    }
    return {
      ok: true,
      message: 'Successfully connected to Supabase PostgreSQL database.',
    };
  } catch (err) {
    return {
      ok: false,
      message: `Network or host failure: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
