import type { ReactNode } from "react"

export const metadata = {
  title: "Atlas — prove what you can do",
  description: "The AI-native career platform. Evidence, not claims.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
