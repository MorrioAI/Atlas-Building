import { describe, expect, it } from "vitest"
import { scoreDimension } from "./score"
import type { Signal } from "@/types"

const sig = (over: Partial<Signal>): Signal => ({
  id: "s", kind: "challenge", dimension: "communication", value: 80,
  createdAt: new Date().toISOString(), ...over,
})

describe("scoreDimension", () => {
  it("returns zero score and confidence with no signals", () => {
    const r = scoreDimension("communication", [])
    expect(r).toEqual({ dimension: "communication", score: 0, confidence: 0, signalCount: 0 })
  })

  it("keeps one decimal of precision (rounding is a trust bug)", () => {
    const r = scoreDimension("communication", [sig({ value: 74 }), sig({ value: 75 })])
    expect(r.score).toBe(74.5)
  })

  it("raises confidence as corroborating signals accumulate", () => {
    const one = scoreDimension("communication", [sig({})]).confidence
    const many = scoreDimension("communication", Array.from({ length: 10 }, () => sig({}))).confidence
    expect(many).toBeGreaterThan(one)
  })

  it("weights recent signals more than stale ones", () => {
    const now = Date.parse("2026-01-01T00:00:00Z")
    const old = new Date(now - 400 * 86_400_000).toISOString()
    const recent = new Date(now).toISOString()
    const r = scoreDimension("communication", [
      sig({ value: 20, createdAt: old }),
      sig({ value: 90, createdAt: recent }),
    ], now)
    expect(r.score).toBeGreaterThan(55) // recent 90 pulls harder than stale 20
  })
})
