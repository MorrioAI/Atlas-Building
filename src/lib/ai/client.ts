import Anthropic from "@anthropic-ai/sdk"

/** Single shared Claude client. Server-only — never import from a client component. */
export const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/** The model we use for capability evaluation. Pin it — score stability is trust. */
export const EVAL_MODEL = "claude-sonnet-5"
