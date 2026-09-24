import { describe, expect, it } from "vitest"
import { absoluteMediaUrl, mediaPath, parseMediaRef } from "./paths"

describe("mediaPath", () => {
  it("builds a relative path so the row resolves in every environment", () => {
    expect(mediaPath("video", "users/abc/intro.mp4")).toBe("/api/media/video/users/abc/intro.mp4")
  })

  it("encodes each segment without eating the separators", () => {
    expect(mediaPath("video", "users/a b/intro #1.mp4"))
      .toBe("/api/media/video/users/a%20b/intro%20%231.mp4")
  })

  it("refuses a key that would climb out of its prefix", () => {
    expect(() => mediaPath("video", "../../secrets.mp4")).toThrow()
    expect(() => mediaPath("video", "/absolute.mp4")).toThrow()
  })
})

describe("parseMediaRef", () => {
  it("round-trips the current form", () => {
    const key = "users/abc/intro #1.mp4"
    expect(parseMediaRef(mediaPath("video", key))).toEqual({ kind: "video", key })
  })

  it("accepts a legacy public storage URL, so the backfill is not a prerequisite", () => {
    const legacy = "https://example.supabase.co/storage/v1/object/public/video-intros/users/abc/intro.mp4"
    expect(parseMediaRef(legacy)).toEqual({ kind: "video", key: "users/abc/intro.mp4" })
  })

  it("accepts a legacy signed storage URL and drops its token", () => {
    const legacy = "https://example.supabase.co/storage/v1/object/sign/video-intros/users/abc/intro.mp4?token=eyJ"
    expect(parseMediaRef(legacy)).toEqual({ kind: "video", key: "users/abc/intro.mp4" })
  })

  it("returns null for an unknown bucket, an unknown kind, and traversal", () => {
    expect(parseMediaRef("https://x/storage/v1/object/public/other-bucket/a.mp4")).toBeNull()
    expect(parseMediaRef("/api/media/audio/a.mp3")).toBeNull()
    expect(parseMediaRef("/api/media/video/../../etc/passwd")).toBeNull()
    expect(parseMediaRef("")).toBeNull()
  })
})

describe("absoluteMediaUrl", () => {
  it("converts at the point of use, for Open Graph and server-side fetches", () => {
    expect(absoluteMediaUrl("/api/media/video/a.mp4", "https://atlas.example"))
      .toBe("https://atlas.example/api/media/video/a.mp4")
  })

  it("throws rather than emitting a half-built URL when no base is configured", () => {
    expect(() => absoluteMediaUrl("/api/media/video/a.mp4", undefined)).toThrow()
  })
})
