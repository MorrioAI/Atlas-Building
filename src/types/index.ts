import type { TalentDimension } from "@/lib/talent/dimensions"

/** A single piece of evidence a score can point back to. */
export interface Signal {
  id: string
  kind: "deliverable" | "challenge" | "review" | "post"
  dimension: TalentDimension
  /** 0–100 raw quality assessed by the AI layer. */
  value: number
  /** ISO timestamp — used for recency/confidence decay. */
  createdAt: string
}

/** A scored dimension with an honesty-preserving confidence. */
export interface DimensionScore {
  dimension: TalentDimension
  score: number       // 0–100
  confidence: number  // 0–1
  signalCount: number
}
