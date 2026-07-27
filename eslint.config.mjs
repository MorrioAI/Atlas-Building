import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { FlatCompat } from "@eslint/eslintrc"

// eslint-config-next is still eslintrc-style, so it is bridged into flat
// config. `next lint` is deprecated in Next 15 and prompts interactively,
// which cannot run in CI — CI calls the ESLint CLI directly instead.
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

const config = [
  { ignores: [".next/**", "node_modules/**", "coverage/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
]

export default config
