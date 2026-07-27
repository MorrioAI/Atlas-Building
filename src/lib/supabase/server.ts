import { cookies } from "next/headers"
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr"

/** Request-scoped Supabase client that reads/writes the auth cookie. */
export async function createClient() {
  const cookieStore = await cookies()

  // Annotated explicitly: createServerClient declares the deprecated
  // get/set/remove overload first, so this getAll/setAll shape is not
  // contextually typed and the callback params would infer as `any`.
  const cookieMethods: CookieMethodsServer = {
    getAll: () => cookieStore.getAll(),
    setAll: (all) => all.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieMethods },
  )
}
