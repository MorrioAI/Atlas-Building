/**
 * Served with a 503 by the middleware rewrite — see src/middleware.ts.
 * This page does not set the status itself; it is the body of that response.
 */
export const metadata = {
  title: "Atlas — back shortly",
  robots: { index: false, follow: false },
}

export default function MaintenancePage() {
  return (
    <main>
      <h1>Back shortly</h1>
      <p>Atlas is down for planned maintenance. Nothing you have submitted is lost.</p>
    </main>
  )
}
