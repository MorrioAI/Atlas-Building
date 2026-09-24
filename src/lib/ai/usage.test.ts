import { afterEach, describe, expect, it } from "vitest"
import { costUsd, dailyAlertUsd, dailyCeilingUsd, readUsage, utcDay } from "./usage"

const NO_USAGE = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }

describe("readUsage", () => {
  it("reads the fields the SDK reports today", () => {
    expect(readUsage({ input_tokens: 100, output_tokens: 20 })).toEqual({
      ...NO_USAGE, inputTokens: 100, outputTokens: 20,
    })
  })

  it("picks up cache counters when the SDK reports them", () => {
    const usage = { input_tokens: 5, output_tokens: 1, cache_read_input_tokens: 900, cache_creation_input_tokens: 40 }
    expect(readUsage(usage)).toEqual({
      inputTokens: 5, outputTokens: 1, cacheReadTokens: 900, cacheWriteTokens: 40,
    })
  })

  it("reads zeros rather than NaN from a shape it does not recognise", () => {
    expect(readUsage(undefined)).toEqual(NO_USAGE)
    expect(readUsage({ input_tokens: "lots" })).toEqual(NO_USAGE)
  })
})

describe("costUsd", () => {
  it("prices input and output at the model's published rates", () => {
    const cost = costUsd("claude-sonnet-5", { ...NO_USAGE, inputTokens: 1_000_000, outputTokens: 1_000_000 })
    expect(cost).toBeCloseTo(12) // $2 in + $10 out
  })

  it("prices cached input below fresh input, and cache writes above it", () => {
    const fresh = costUsd("claude-sonnet-5", { ...NO_USAGE, inputTokens: 1_000_000 })!
    const cached = costUsd("claude-sonnet-5", { ...NO_USAGE, cacheReadTokens: 1_000_000 })!
    const written = costUsd("claude-sonnet-5", { ...NO_USAGE, cacheWriteTokens: 1_000_000 })!
    expect(cached).toBeLessThan(fresh)
    expect(written).toBeGreaterThan(fresh)
  })

  it("returns null for a model it has no price for, rather than booking it as free", () => {
    expect(costUsd("some-model-we-have-not-priced", { ...NO_USAGE, inputTokens: 1_000_000 })).toBeNull()
  })
})

describe("the two knobs", () => {
  const original = { ...process.env }
  afterEach(() => {
    process.env.ATLAS_AI_DAILY_ALERT_USD = original.ATLAS_AI_DAILY_ALERT_USD
    process.env.ATLAS_AI_DAILY_CEILING_USD = original.ATLAS_AI_DAILY_CEILING_USD
  })

  it("reads a configured threshold", () => {
    process.env.ATLAS_AI_DAILY_ALERT_USD = "25"
    expect(dailyAlertUsd()).toBe(25)
  })

  it("treats an unset ceiling as off, which is the default", () => {
    delete process.env.ATLAS_AI_DAILY_CEILING_USD
    expect(dailyCeilingUsd()).toBeNull()
  })

  it("treats an unparseable value as unset rather than as zero", () => {
    // A ceiling of 0 would refuse every call. Reading "" or "abc" as 0 turns a
    // typo in an env var into a total outage.
    process.env.ATLAS_AI_DAILY_CEILING_USD = "abc"
    expect(dailyCeilingUsd()).toBeNull()
    process.env.ATLAS_AI_DAILY_CEILING_USD = "0"
    expect(dailyCeilingUsd()).toBeNull()
  })
})

describe("utcDay", () => {
  it("buckets by UTC date so a ledger row does not depend on server locale", () => {
    expect(utcDay(new Date("2026-09-23T23:59:59Z"))).toBe("2026-09-23")
    expect(utcDay(new Date("2026-09-24T00:00:01Z"))).toBe("2026-09-24")
  })
})
