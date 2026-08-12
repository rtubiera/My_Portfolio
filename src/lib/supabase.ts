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

/**
 * Time-limited URL for a file in the private `documents` bucket.
 *
 * Unlike `media`, that bucket has no public read policy — a permanent public
 * URL for a Certificate of Employment is a leak waiting to happen, and an
 * unguessable path is not a permission. The link is minted per click, signed
 * against the caller's session, and expires.
 *
 * Passing `download` makes the response an attachment under that filename
 * instead of something the browser renders inline.
 */
export async function documentUrl(
  path: string,
  seconds = 60,
  download?: string,
): Promise<string | null> {
  if (!supabase || !path) return null
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(path, seconds, download ? { download } : undefined)
  if (error) return null
  return data?.signedUrl ?? null
}
