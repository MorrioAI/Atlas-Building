import { beforeEach, describe, expect, it } from "vitest"
import { isExemptFromMaintenance, isMaintenanceOn, resetMaintenanceCache } from "./maintenance"

beforeEach(resetMaintenanceCache)

describe("isExemptFromMaintenance", () => {
  it("keeps the surface holding the off switch reachable", () => {
    expect(isExemptFromMaintenance("/admin")).toBe(true)
    expect(isExemptFromMaintenance("/admin/flags")).toBe(true)
  })

  it("keeps paths whose failure outlives the window reachable", () => {
    expect(isExemptFromMaintenance("/api/stripe/webhook")).toBe(true)
    expect(isExemptFromMaintenance("/api/cron/score-signals")).toBe(true)
    expect(isExemptFromMaintenance("/api/internal/report")).toBe(true)
  })

  it("does not exempt an ordinary path that merely starts with the same letters", () => {
    expect(isExemptFromMaintenance("/administrators")).toBe(false)
    expect(isExemptFromMaintenance("/")).toBe(false)
    expect(isExemptFromMaintenance("/api/challenge")).toBe(false)
  })
})

describe("isMaintenanceOn", () => {
  it("is on when the flag row says so", async () => {
    expect(await isMaintenanceOn(async () => true)).toBe(true)
  })

  it("is off when the flag row says so", async () => {
    expect(await isMaintenanceOn(async () => false)).toBe(false)
  })

  it("fails open when the flag cannot be read, so the switch is not the outage", async () => {
    const unreachable = async () => {
      throw new Error("no such table: site_flags")
    }
    expect(await isMaintenanceOn(unreachable)).toBe(false)
  })

  it("does not cache a failed read", async () => {
    let calls = 0
    const flaky = async () => {
      calls += 1
      if (calls === 1) throw new Error("blip")
      return true
    }
    expect(await isMaintenanceOn(flaky)).toBe(false)
    expect(await isMaintenanceOn(flaky)).toBe(true)
  })

  it("caches a successful read rather than hitting the database per request", async () => {
    let calls = 0
    const counting = async () => {
      calls += 1
      return true
    }
    await isMaintenanceOn(counting)
    await isMaintenanceOn(counting)
    expect(calls).toBe(1)
  })
})
