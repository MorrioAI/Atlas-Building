import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// The `@/*` alias is declared in tsconfig.json, which vitest does not read.
// Without this, a runtime `@/...` import resolves in the editor and fails in
// the test run — and only for value imports, since type-only ones are erased.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
})
