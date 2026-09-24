import { describe, expect, it } from "vitest"
import { canViewMedia, type MediaObject } from "./access"

const obj = (over: Partial<MediaObject> = {}): MediaObject => ({
  ownerId: "owner-1", visibility: "private", removedAt: null, ...over,
})

describe("canViewMedia", () => {
  it("shows a public object to a signed-out visitor", () => {
    expect(canViewMedia(obj({ visibility: "public" }), null)).toBe(true)
  })

  it("shows an unlisted object to anyone holding the link", () => {
    expect(canViewMedia(obj({ visibility: "unlisted" }), "stranger")).toBe(true)
  })

  it("shows a private object to its owner", () => {
    expect(canViewMedia(obj(), "owner-1")).toBe(true)
  })

  it("hides a private object from a stranger", () => {
    expect(canViewMedia(obj(), "stranger")).toBe(false)
  })

  it("hides a private object from a signed-out visitor", () => {
    expect(canViewMedia(obj(), null)).toBe(false)
  })

  it("hides a removed object from everyone but its owner", () => {
    const removed = obj({ visibility: "public", removedAt: "2026-09-01T00:00:00Z" })
    expect(canViewMedia(removed, "stranger")).toBe(false)
    expect(canViewMedia(removed, "owner-1")).toBe(true)
  })
})
