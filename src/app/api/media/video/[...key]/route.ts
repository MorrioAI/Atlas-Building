import { NextResponse } from "next/server"
import { canViewMedia, type MediaObject } from "@/lib/media/access"
import { MEDIA_BUCKETS } from "@/lib/media/paths"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

/**
 * Long enough to watch and scrub a full recording on one signature; short enough
 * that a URL lifted from a network tab is dead by the next sitting. The signed
 * URL is a bearer token for this long — that trade is argued in ADR-0005.
 */
const SIGNED_URL_TTL_SECONDS = 3600

/**
 * GET /api/media/video/{key} — the database decides, then we redirect.
 *
 * We redirect rather than stream: proxying bytes costs bandwidth on every view,
 * a 307 costs one invocation, and range requests survive the hop so scrubbing
 * still works. See docs/adr/0005-media-access-decided-by-the-database.md.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key: segments } = await ctx.params
  const key = segments.join("/")

  // One refusal for every reason. A 403 would confirm the object exists, which
  // is a fact a stranger is not entitled to about a private recording.
  const notFound = () => NextResponse.json({ error: "not found" }, { status: 404 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: row, error } = await supabase
    .from("video_intros")
    .select("owner_id, visibility, removed_at")
    .eq("storage_key", key)
    .maybeSingle()

  if (error || !row) return notFound()

  const object: MediaObject = {
    ownerId: row.owner_id,
    visibility: row.visibility,
    removedAt: row.removed_at,
  }
  if (!canViewMedia(object, user?.id ?? null)) return notFound()

  // Decided above; signing below. The service-role client never chooses.
  const admin = createAdminClient()
  const { data: signed, error: signError } = await admin.storage
    .from(MEDIA_BUCKETS.video)
    .createSignedUrl(key, SIGNED_URL_TTL_SECONDS)

  if (signError || !signed) {
    return NextResponse.json({ error: "could not sign media url" }, { status: 502 })
  }

  // 307 keeps the method and the Range header on the follow-up request.
  return NextResponse.redirect(signed.signedUrl, {
    status: 307,
    headers: { "Cache-Control": "private, no-store" },
  })
}
