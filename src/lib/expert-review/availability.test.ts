import { describe, expect, it } from "vitest"
import { isExpertReviewAvailable } from "./availability"

describe("isExpertReviewAvailable", () => {
  it("is available when at least one reviewer is accepting", async () => {
    expect(await isExpertReviewAvailable(async () => 1)).toBe(true)
  })

  it("is unavailable when no reviewer is accepting", async () => {
    expect(await isExpertReviewAvailable(async () => 0)).toBe(false)
  })

  it("fails closed when the reviewer store is unreachable", async () => {
    const unreachable = async () => {
      throw new Error("connection refused")
    }
    expect(await isExpertReviewAvailable(unreachable)).toBe(false)
  })
})
