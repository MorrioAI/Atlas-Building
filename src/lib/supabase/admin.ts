import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Service-role client. Bypasses RLS entirely.
 *
 * NOTE: use it only *after* the app has made an explicit access decision — never
 * as a way to avoid making one. The signing step in the media route is the
 * shape to copy: decide first, then sign.
 *
 * Server-only. Importing this from a client component leaks the key.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
