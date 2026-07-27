import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { scoreProfile } from "@/lib/talent/score"
import type { Signal } from "@/types"

// GET /api/talent/:profileId — public talent scores for a profile.
export async function GET(_req: Request, ctx: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await ctx.params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("signals")
    .select("id, kind, dimension, value, created_at")
    .eq("profile_id", profileId)

  if (error) return NextResponse.json({ error: "failed to load signals" }, { status: 500 })

  const signals: Signal[] = (data ?? []).map((r) => ({
    id: r.id, kind: r.kind, dimension: r.dimension, value: r.value, createdAt: r.created_at,
  }))

  return NextResponse.json({ scores: scoreProfile(signals) })
}
