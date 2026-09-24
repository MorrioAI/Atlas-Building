import { createClient } from "@/lib/supabase/server"

/**
 * Counts reviewers who are onboarded and currently accepting work.
 *
 * The live count *is* the switch, in both directions — onboarding the first
 * reviewer opens the surface and the last one leaving closes it. A feature flag
 * would be a second thing to remember, and it fails by staying off.
 */
type ReviewerCounter = () => Promise<number>

async function countAcceptingReviewers(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("expert_reviewers")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepting")

  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * Is Expert Review available to buy right now?
 *
 * NOTE: this is the one availability check in the codebase that fails CLOSED.
 * See docs/adr/0004-availability-checks-that-gate-payment-fail-closed.md.
 *
 * Call this on the server before charging, not only before rendering the button —
 * a stale tab and a direct POST both ignore a hidden button.
 */
export async function isExpertReviewAvailable(
  count: ReviewerCounter = countAcceptingReviewers,
): Promise<boolean> {
  try {
    return (await count()) > 0
  } catch {
    // Fail CLOSED, unlike everything else here: guessing "available" takes
    // someone's money for work nobody will do. Hiding a surface for the length
    // of an outage is recoverable by waiting; an unservable paid order is not.
    return false
  }
}
