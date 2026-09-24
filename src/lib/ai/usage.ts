import { reportError } from "@/lib/observability/report"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * The spend ledger and the two knobs that act on it.
 *
 * Alert and ceiling are deliberately separate: one tells you and changes
 * nothing, the other refuses work. See docs/operations/cost-controls.md.
 */

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

/**
 * Read the SDK's usage object without binding to its type.
 *
 * The SDK adds fields to `usage` between versions — cache counters arrived
 * after the base two — and a hard type here turns a routine bump into a
 * compile error, or worse, silently drops the new field from the ledger.
 */
export function readUsage(usage: unknown): TokenUsage {
  const u = (usage ?? {}) as Record<string, unknown>
  const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0)
  return {
    inputTokens: num(u.input_tokens),
    outputTokens: num(u.output_tokens),
    cacheReadTokens: num(u.cache_read_input_tokens),
    cacheWriteTokens: num(u.cache_creation_input_tokens),
  }
}

/**
 * Public list pricing, USD per million tokens. This is published pricing, not
 * what it costs us to serve anything.
 *
 * TODO(engineering): this table goes stale silently. A model we have no row for
 * bills as zero, which reads as "cheap" rather than "unknown" — see
 * `costUsd` for how that is surfaced.
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-5": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-fable-5": { input: 10, output: 50 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
}

const PER_MILLION = 1_000_000

/** Cached input is billed at a fraction of the input rate; writing it costs a premium. */
const CACHE_READ_RATE = 0.1
const CACHE_WRITE_RATE = 1.25

/** Cost of one call in USD, or null when we have no price for the model. */
export function costUsd(model: string, usage: TokenUsage): number | null {
  const price = MODEL_PRICING[model]
  if (!price) return null

  const inputUnits =
    usage.inputTokens +
    usage.cacheReadTokens * CACHE_READ_RATE +
    usage.cacheWriteTokens * CACHE_WRITE_RATE

  return (inputUnits * price.input + usage.outputTokens * price.output) / PER_MILLION
}

function envUsd(name: string): number | null {
  const raw = process.env[name]
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : null
}

/** On by default where configured. Changes nothing; tells you. */
export const dailyAlertUsd = () => envUsd("ATLAS_AI_DAILY_ALERT_USD")

/** Off by default. Refuses work. Recoverable by editing one value. */
export const dailyCeilingUsd = () => envUsd("ATLAS_AI_DAILY_CEILING_USD")

export class CostCeilingReachedError extends Error {
  constructor(spentUsd: number, ceilingUsd: number) {
    super(`daily AI spend ceiling reached: $${spentUsd.toFixed(2)} of $${ceilingUsd.toFixed(2)}`)
    this.name = "CostCeilingReachedError"
  }
}

export function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

/**
 * Reading the ledger before every call would double the latency of every call.
 * The cache means the ceiling can be overshot by at most one window's spend,
 * which is the right trade for a control that exists to turn a month-long
 * outage into an hours-long one.
 */
const TOTAL_CACHE_MS = 60_000
let cachedTotal: { day: string; usd: number; readAt: number } | null = null

async function spentTodayUsd(): Promise<number> {
  const day = utcDay()
  if (cachedTotal && cachedTotal.day === day && Date.now() - cachedTotal.readAt < TOTAL_CACHE_MS) {
    return cachedTotal.usd
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("ai_spend_daily")
    .select("cost_usd")
    .eq("day", day)

  if (error) throw new Error(error.message)

  const usd = (data ?? []).reduce((sum, row) => sum + Number(row.cost_usd ?? 0), 0)
  cachedTotal = { day, usd, readAt: Date.now() }
  return usd
}

/**
 * Refuse before spending, if a ceiling is configured.
 *
 * NOTE: this fails OPEN — no ceiling set, or a ledger we cannot read, lets the
 * call through. That is the opposite of `isExpertReviewAvailable`, and the
 * difference is what is on the other side: there, guessing wrong charges
 * someone for work nobody will do; here, guessing wrong stops the product
 * because a table was briefly unreachable. See ADR-0004 for the boundary.
 */
export async function assertUnderCap(): Promise<void> {
  const ceiling = dailyCeilingUsd()
  if (ceiling === null) return

  let spent: number
  try {
    spent = await spentTodayUsd()
  } catch (err) {
    reportError("ai/ledger:read", err)
    return
  }

  if (spent >= ceiling) throw new CostCeilingReachedError(spent, ceiling)
}

/**
 * Write one call to the ledger. Fire-and-forget: never awaited on the request
 * path, and never throws.
 *
 * A missing table or a database blip degrades to "we don't know what today
 * cost" — never to a failed request. Verify that by running the real path with
 * the table absent; see docs/engineering/verification.md §2.
 */
export function record(model: string, usage: TokenUsage, scope: string): void {
  void writeLedger(model, usage, scope).catch((err) => {
    reportError("ai/ledger:write", err, { model })
  })
}

async function writeLedger(model: string, usage: TokenUsage, scope: string): Promise<void> {
  const cost = costUsd(model, usage)
  if (cost === null) {
    // An unpriced model must not book as $0.00 — that reads as "cheap" rather
    // than "unknown", and the ceiling would never see it coming.
    reportError("ai/pricing:unknown-model", new Error(`no price for model ${model}`), { model })
  }

  const supabase = createAdminClient()
  // Incremented by the database, not read-then-write from here. A spend ceiling
  // cannot afford to undercount, and the one moment it matters is the moment
  // many calls are in flight. See ADR-0006.
  const { error } = await supabase.rpc("record_ai_spend", {
    p_day: utcDay(),
    p_scope: scope,
    p_model: model,
    p_input_tokens: usage.inputTokens + usage.cacheReadTokens + usage.cacheWriteTokens,
    p_output_tokens: usage.outputTokens,
    p_cost_usd: cost ?? 0,
    p_priced: cost !== null,
  })
  if (error) throw new Error(error.message)

  await maybeAlert()
}

/** One alert per day, handled by the reporter's own dedupe on the key. */
async function maybeAlert(): Promise<void> {
  const threshold = dailyAlertUsd()
  if (threshold === null) return

  cachedTotal = null // the number we just wrote is the one we want to judge
  const spent = await spentTodayUsd()
  if (spent >= threshold) {
    reportError(
      "ai/spend:over-alert-threshold",
      new Error(`AI spend is $${spent.toFixed(2)} today, over the $${threshold.toFixed(2)} alert threshold`),
    )
  }
}
