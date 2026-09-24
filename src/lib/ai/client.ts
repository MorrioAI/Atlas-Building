import Anthropic from "@anthropic-ai/sdk"
import { cookies } from "next/headers"
import { assertUnderCap, readUsage, record } from "./usage"

/**
 * The shared Claude client, wrapped so that every call is metered.
 *
 * Metering lives here rather than at the call sites, because call sites are
 * added by people who have never read this file. See
 * docs/adr/0006-cost-metered-at-the-client.md.
 *
 * ATTRIBUTION IS A LABEL, NEVER AN AUTHORISATION. The wrapper sits below every
 * route and has no user argument, so it reads the session cookie to put a name
 * on a cost row. That is enough to answer "who spent this". It is *not* enough
 * to decide what anyone may do — the cookie has not been verified against the
 * auth server here. If you need an access decision, call
 * `supabase.auth.getUser()` in the route and decide there.
 *
 * Server-only — never import from a client component.
 */
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/** The model we use for capability evaluation. Pin it — score stability is trust. */
export const EVAL_MODEL = "claude-sonnet-5"

/**
 * A label for the cost row. Unverified by construction: see the note above.
 * Falls back to "unattributed" outside a request scope, such as a cron job.
 */
async function costScope(): Promise<string> {
  try {
    const store = await cookies()
    const session = store.getAll().find((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"))
    return session ? `session:${session.value.slice(0, 12)}` : "anonymous"
  } catch {
    return "unattributed"
  }
}

const rawCreate = client.messages.create.bind(client.messages)
client.messages.create = (async (...args: Parameters<typeof rawCreate>) => {
  await assertUnderCap() // refuse before spending
  const scope = await costScope()
  const result = await rawCreate(...args)

  // A streaming create() resolves to a Stream, which carries no usage. The
  // streaming path is metered on messages.stream below.
  if (result && typeof result === "object" && "usage" in result) {
    record(result.model, readUsage(result.usage), scope)
  }
  return result
}) as typeof client.messages.create

const rawStream = client.messages.stream.bind(client.messages)
client.messages.stream = ((...args: Parameters<typeof rawStream>) => {
  // NOTE: the ceiling check is fired but not awaited here, because stream() is
  // synchronous by contract. A stream started in the same tick as the ceiling
  // being reached gets through; the next one does not. One forgotten method
  // would be a silent hole in the accounting, and a hole in the accounting
  // looks exactly like an absence of spend.
  void assertUnderCap().catch(() => {})

  const stream = rawStream(...args)
  stream.on("finalMessage", (message) => {
    void costScope().then((scope) => record(message.model, readUsage(message.usage), scope))
  })
  return stream
}) as typeof client.messages.stream

export const claude = client
