/**
 * The seven capability dimensions the Talent Algorithm scores.
 * See docs/adr/0002-talent-algorithm-seven-dimensions.md.
 */
export const TALENT_DIMENSIONS = [
  "technical_depth",
  "communication",
  "leadership",
  "ownership",
  "collaboration",
  "learning_ability",
  "execution",
] as const

export type TalentDimension = (typeof TALENT_DIMENSIONS)[number]

export const DIMENSION_LABELS: Record<TalentDimension, string> = {
  technical_depth: "Technical Depth",
  communication: "Communication",
  leadership: "Leadership",
  ownership: "Ownership",
  collaboration: "Collaboration",
  learning_ability: "Learning Ability",
  execution: "Execution",
}
