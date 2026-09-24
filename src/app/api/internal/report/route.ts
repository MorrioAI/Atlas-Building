import { NextResponse } from "next/server"

/**
 * POST /api/internal/report — where src/lib/observability/report.ts sends things.
 *
 * This route exists so that the reporter itself can import nothing: all the
 * Node-only machinery is allowed to live here, on one runtime.
 *
 * Exempt this path from every gate — auth walls, maintenance mode, rate limits.
 * An error raised during an outage is the error most worth hearing about, and a
 * gate that swallows it blinds you exactly when you are looking. The exemption
 * is in src/lib/maintenance.ts.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body.key !== "string") {
    return NextResponse.json({ error: "key is required" }, { status: 400 })
  }

  // TODO(engineering): deliver this somewhere a human reads — mail, or a
  // paging provider. Structured stderr is the floor, not the destination.
  console.error("[alert]", JSON.stringify(body))

  // 202: we have taken it. Never make the caller's success depend on ours.
  return new NextResponse(null, { status: 202 })
}
