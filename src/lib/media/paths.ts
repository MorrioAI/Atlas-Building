/**
 * Media references are paths into our own routes, never storage URLs.
 * See docs/adr/0005-media-access-decided-by-the-database.md.
 */

export const MEDIA_KINDS = ["video"] as const
export type MediaKind = (typeof MEDIA_KINDS)[number]

/** Private buckets. Nothing here is served by bucket visibility. */
export const MEDIA_BUCKETS: Record<MediaKind, string> = {
  video: "video-intros",
}

const BUCKET_KINDS = new Map<string, MediaKind>(
  MEDIA_KINDS.map((kind) => [MEDIA_BUCKETS[kind], kind]),
)

/** Storage keys are opaque, but they still end up in a URL path. */
function isSafeKey(key: string): boolean {
  if (key.length === 0 || key.length > 512) return false
  if (key.startsWith("/")) return false
  return !key.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
}

/**
 * The value we store on the row. Relative on purpose: the same row then
 * resolves in every environment, and no migration is needed to move host.
 */
export function mediaPath(kind: MediaKind, key: string): string {
  if (!isSafeKey(key)) throw new Error(`unusable storage key: ${key}`)
  return `/api/media/${kind}/${key.split("/").map(encodeURIComponent).join("/")}`
}

/**
 * Read a stored reference back into a kind and a storage key.
 *
 * Accepts the legacy absolute form as well — public and signed storage URLs
 * written before ADR-0005. That makes the backfill a tidy-up rather than a
 * prerequisite: nothing breaks between the deploy and the migration.
 *
 * Returns null for anything it does not recognise. Callers 404 on null; a
 * reference we cannot parse is not a reference we should serve.
 */
export function parseMediaRef(stored: string): { kind: MediaKind; key: string } | null {
  const trimmed = stored.trim()
  if (trimmed === "") return null

  // Current form: /api/media/{kind}/{key}
  const own = /^\/api\/media\/([^/]+)\/(.+)$/.exec(trimmed)
  if (own) {
    const [, kind, rawKey] = own
    if (!isMediaKind(kind)) return null
    return decodeKey(kind, rawKey!)
  }

  // Legacy form: .../storage/v1/object/{public|sign|authenticated}/{bucket}/{key}
  const legacy = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/.exec(trimmed)
  if (legacy) {
    const [, bucket, rawKey] = legacy
    const kind = BUCKET_KINDS.get(bucket!)
    if (!kind) return null
    return decodeKey(kind, rawKey!.split("?")[0]!) // signed URLs carry a token query
  }

  return null
}

function decodeKey(kind: MediaKind, rawKey: string): { kind: MediaKind; key: string } | null {
  let key: string
  try {
    key = rawKey.split("/").map(decodeURIComponent).join("/")
  } catch {
    return null // malformed percent-encoding
  }
  return isSafeKey(key) ? { kind, key } : null
}

function isMediaKind(value: string | undefined): value is MediaKind {
  return MEDIA_KINDS.includes(value as MediaKind)
}

/**
 * Absolute form, for the few places that cannot use a relative path:
 * Open Graph tags and server-side fetches. Convert at the point of use and
 * never store the result — an absolute URL on a row is the bug ADR-0005 fixes.
 */
export function absoluteMediaUrl(path: string, baseUrl = process.env.NEXT_PUBLIC_SITE_URL): string {
  if (!baseUrl) throw new Error("NEXT_PUBLIC_SITE_URL is required to build an absolute media URL")
  return new URL(path, baseUrl).toString()
}
