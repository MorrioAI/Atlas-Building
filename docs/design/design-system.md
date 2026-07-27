# Design — Design System

## Brand palette
| Token | Hex | Use |
|-------|-----|-----|
| pink | `#FE2C55` | primary accent, CTAs |
| cyan | `#25F4EE` | secondary / signal |
| lime | `#CCFF00` | highlights |
| violet | `#6600CC` | depth accents |
| ink | `#15181E` | text / dark surfaces |

## Type
- One typeface, tight tracking on headings (`letter-spacing: -0.02em`), generous line-height on body.
- Type scale is fixed — don't introduce one-off sizes.

## Spacing & radius
- 4px base grid. Rounded surfaces use `rounded-2xl` for cards, `rounded-full` for pills.

## Components
- Reuse before you build. New shared components ship with all states and a usage note.
- Every interactive element has a visible focus state and respects `prefers-reduced-motion`.

## Voice in UI
- A control says exactly what it does ("Publish" → then a toast "Published"). Errors say what went wrong and how to fix it.
