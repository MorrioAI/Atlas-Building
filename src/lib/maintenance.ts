/**
 * The maintenance switch: a boolean row in this environment's own database.
 *
 * NOTE: imports nothing. This runs in middleware on the edge runtime — the same
 * constraint, and the same reason, as src/lib/observability/report.ts.
 *
 * See docs/adr/0007-maintenance-mode-is-a-database-flag.md.
 */

/**
 * Paths whose failure outlives the maintenance window, so they stay up.
 *
 * - `/admin` holds the off switch. Locking yourself out is the obvious way for
 *   this to go wrong, and the one you discover at the worst moment.
 * - Payment webhooks are retried by the provider for a while, and then not.
 * - Scheduled jobs that skip a run may not catch up on their own.
 * - Error reporting, because an error during maintenance is the one most worth
 *   hearing about.
 */
const EXEMPT_PREFIXES = [
  "/admin",
  "/api/stripe/webhook",
  "/api/cron",
  "/api/internal/report",
  "/maintenance",
]

export function isExemptFromMaintenance(pathname: string): boolean {
  return EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/**
 * Short enough that flipping the switch takes effect while you are still
 * watching; long enough that this is not a database read on every request
 * forever.
 */
const CACHE_MS = 30_000
let cached: { on: boolean; readAt: number } | null = null

type FlagReader = () => Promise<boolean>

async function readFlagFromDatabase(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error("supabase env not configured")

  // Plain fetch, not a client library: see the note at the top of this file.
  const res = await fetch(`${url}/rest/v1/site_flags?select=enabled&key=eq.maintenance`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`site_flags read failed: ${res.status}`)

  const rows: unknown = await res.json()
  if (!Array.isArray(rows) || rows.length === 0) return false
  return (rows[0] as { enabled?: unknown }).enabled === true
}

/**
 * Is maintenance mode on?
 *
 * Fails OPEN. A missing table, an unreachable database or a malformed row
 * leaves the site running: the switch failing must not itself become the
 * outage, and an outage nobody chose is worse than one somebody did.
 */
export async function isMaintenanceOn(read: FlagReader = readFlagFromDatabase): Promise<boolean> {
  if (cached && Date.now() - cached.readAt < CACHE_MS) return cached.on

  try {
    const on = await read()
    cached = { on, readAt: Date.now() }
    return on
  } catch {
    // Deliberately not cached: retry on the next request rather than committing
    // to "up" for the whole window on the strength of one failed read.
    return false
  }
}

/** Test seam. Middleware has no lifecycle hook to clear a module-level cache. */
export function resetMaintenanceCache(): void {
  cached = null
}
