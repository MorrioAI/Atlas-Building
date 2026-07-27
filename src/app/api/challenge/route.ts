import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/challenge — start a Capability Challenge run for the current user.
// Thin handler: auth + persistence here, evaluation logic lives in lib/.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { role } = await req.json().catch(() => ({}))
  if (typeof role !== "string") {
    return NextResponse.json({ error: "role is required" }, { status: 400 })
  }

  // TODO(engineering): rate-limit per user before Michigan-scale load. See ROADMAP.
  const { data, error } = await supabase
    .from("challenge_runs")
    .insert({ user_id: user.id, role, status: "in_progress" })
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: "could not start challenge" }, { status: 500 })
  return NextResponse.json({ runId: data.id }, { status: 201 })
}
