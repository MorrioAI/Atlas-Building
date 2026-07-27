"use client"

import { useState } from "react"

interface Props {
  role: string
}

/**
 * Kicks off a Capability Challenge run. The real scenario + evaluation stream
 * from the server; this component owns only the local run state.
 */
export function CapabilityChallenge({ role }: Props) {
  const [runId, setRunId] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setStarting(true)
    setError(null)
    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error("Could not start the challenge. Try again.")
      const { runId } = await res.json()
      setRunId(runId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setStarting(false)
    }
  }

  if (runId) return <p>Challenge started. Run: {runId}</p>

  return (
    <div>
      <button onClick={start} disabled={starting}>
        {starting ? "Starting…" : "Start Capability Challenge"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
