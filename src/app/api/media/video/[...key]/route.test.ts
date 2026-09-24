/**
 * READ THIS BEFORE ADDING A TEST HERE.
 *
 * An early draft of this route returned 404 for *every* request. Every "a
 * private item is refused" assertion below passed, for entirely the wrong
 * reason. A suite that only asserts refusals is indistinguishable from a
 * feature that is switched off.
 *
 * So the 200-shaped case comes first, and it stays first. If you add a refusal,
 * add the matching grant in the same commit.
 *
 * See docs/engineering/verification.md §2.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

const SIGNED = "https://storage.example/object/sign/video-intros/users/abc/intro.mp4?token=eyJ"

interface Row { owner_id: string; visibility: string; removed_at: string | null }

let row: Row | null
let viewerId: string | null
let signError: { message: string } | null

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: viewerId ? { id: viewerId } : null } }) },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: row, error: null }) }),
      }),
    }),
  }),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    storage: {
      from: () => ({
        createSignedUrl: async () =>
          signError ? { data: null, error: signError } : { data: { signedUrl: SIGNED }, error: null },
      }),
    },
  }),
}))

const { GET } = await import("./route")

const get = (key = "users/abc/intro.mp4") =>
  GET(new Request("https://atlas.example/api/media/video/" + key), {
    params: Promise.resolve({ key: key.split("/") }),
  })

beforeEach(() => {
  row = { owner_id: "owner-1", visibility: "private", removed_at: null }
  viewerId = "owner-1"
  signError = null
})

describe("GET /api/media/video/[...key]", () => {
  it("redirects the owner of a private recording to a signed URL", async () => {
    const res = await get()
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe(SIGNED)
  })

  it("redirects a signed-out visitor to a signed URL for a public recording", async () => {
    row = { owner_id: "owner-1", visibility: "public", removed_at: null }
    viewerId = null
    const res = await get()
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe(SIGNED)
  })

  it("does not let the signed URL be cached by a shared cache", async () => {
    expect((await get()).headers.get("cache-control")).toBe("private, no-store")
  })

  it("404s a private recording for a stranger", async () => {
    viewerId = "stranger"
    expect((await get()).status).toBe(404)
  })

  it("404s a private recording for a signed-out visitor", async () => {
    viewerId = null
    expect((await get()).status).toBe(404)
  })

  it("404s rather than 403s, so a stranger cannot confirm the object exists", async () => {
    viewerId = "stranger"
    const res = await get()
    expect(res.status).not.toBe(403)
    expect(res.status).toBe(404)
  })

  it("404s when no row stands behind the key", async () => {
    row = null
    expect((await get()).status).toBe(404)
  })

  it("fails with 502 rather than redirecting when signing fails", async () => {
    signError = { message: "storage unavailable" }
    expect((await get()).status).toBe(502)
  })
})
