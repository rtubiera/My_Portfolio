import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/**
 * `null` when the env vars are absent. Every caller must handle that:
 * the public site falls back to the bundled seed content, and /admin shows a
 * setup screen instead of a login form. This is what lets the project build
 * and run before Supabase has been wired up.
 */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: 'portfolio-cms-auth',
        },
      })
    : null

export const isSupabaseConfigured = supabase !== null

/** Public URL for a file in the `media` storage bucket. */
export function mediaUrl(path: string): string {
  if (!supabase || !path) return path
  if (/^https?:\/\//i.test(path)) return path
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}
