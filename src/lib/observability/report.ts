/**
 * Operational alerting.
 *
 * NOTE: this module imports nothing, on purpose. It is compiled for every
 * runtime the framework targets, including the edge runtime in middleware. A
 * single Node-only transitive import here does not "turn alerting off" — it
 * fails to compile and every route returns 500. Making the import dynamic does
 * not help; the bundler still follows it.
 *
 * So the Node-only machinery (mail, paging, whatever it becomes) lives behind
 * /api/internal/report, which both runtimes can reach over HTTP.
 *
 * See docs/engineering/error-reporting.md.
 */

/** Alerts already sent this process-day, so a retry loop sends one message. */
const seen = new Map<string, number>()

const DAY_MS = 86_400_000

/**
 * Errors that are the system working, not the system failing. Every one of
 * these left in the channel costs a reader.
 */
function isExpected(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  // Next uses thrown sentinels for redirect() and notFound() control flow.
  const digest = (err as { digest?: unknown }).digest
  if (typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND")) {
    return true
  }
  return err.name === "AbortError" || err.name === "RateLimitError"
}

/**
 * Report an operational problem. Deduped on `key` for a day.
 *
 * `key` should identify the *kind* of failure — `"api/challenge:insert"` — not
 * the instance. An alert that fires per request teaches people to ignore it.
 *
 * Never throws and never blocks: a reporter that fails during an incident turns
 * one problem into two, and the second one hides the first.
 */
export function reportError(key: string, err: unknown, context?: Record<string, string | number>): void {
  if (isExpected(err)) return

  const now = Date.now()
  const last = seen.get(key)
  if (last !== undefined && now - last < DAY_MS) return
  seen.set(key, now)

  void fetch("/api/internal/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key,
      message: err instanceof Error ? err.message : String(err),
      context: context ?? {},
    }),
  }).catch(() => {
    // Swallowed deliberately. See the note at the top of this file.
  })
}
