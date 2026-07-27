import type { DimensionScore, Signal } from "@/types"
import { TALENT_DIMENSIONS, type TalentDimension } from "./dimensions"

const HALF_LIFE_DAYS = 90
const DAY_MS = 86_400_000

/** Recency weight in (0, 1]. Older signals count less. */
function recencyWeight(createdAt: string, now: number): number {
  const ageDays = Math.max(0, (now - Date.parse(createdAt)) / DAY_MS)
  return Math.pow(0.5, ageDays / HALF_LIFE_DAYS)
}

/**
 * Confidence grows with the number of corroborating signals and saturates.
 * Two signals is meaningfully more than one; twenty is not much more than ten.
 */
function confidenceFor(count: number): number {
  if (count <= 0) return 0
  return Math.min(1, 1 - Math.exp(-count / 4))
}

/**
 * Score one dimension from its signals: a recency-weighted mean (0–100)
 * plus a confidence (0–1). Pure and deterministic — see score.test.ts.
 */
export function scoreDimension(dimension: TalentDimension, signals: Signal[], now = Date.now()): DimensionScore {
  const relevant = signals.filter((s) => s.dimension === dimension)
  if (relevant.length === 0) {
    return { dimension, score: 0, confidence: 0, signalCount: 0 }
  }

  let weightedSum = 0
  let weightTotal = 0
  for (const s of relevant) {
    const w = recencyWeight(s.createdAt, now)
    weightedSum += s.value * w
    weightTotal += w
  }

  return {
    dimension,
    score: Math.round((weightedSum / weightTotal) * 10) / 10, // keep one decimal — trust bug if we drop it
    confidence: confidenceFor(relevant.length),
    signalCount: relevant.length,
  }
}

/** Score every dimension for a profile. */
export function scoreProfile(signals: Signal[], now = Date.now()): DimensionScore[] {
  return TALENT_DIMENSIONS.map((d) => scoreDimension(d, signals, now))
}
