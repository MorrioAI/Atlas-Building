import { NextResponse, type NextRequest } from "next/server"
import { isExemptFromMaintenance, isMaintenanceOn } from "@/lib/maintenance"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isExemptFromMaintenance(pathname)) return NextResponse.next()
  if (!(await isMaintenanceOn())) return NextResponse.next()

  // Rewrite, not redirect. A redirect lets a crawler index the outage page as
  // the site itself, and that outlives the window by weeks. See ADR-0007.
  return NextResponse.rewrite(new URL("/maintenance", req.url), {
    status: 503,
    headers: { "Retry-After": "600", "Cache-Control": "no-store" },
  })
}

export const config = {
  // Static assets and image optimisation are left alone: serving a 503 for a
  // stylesheet makes the maintenance page itself look broken.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
