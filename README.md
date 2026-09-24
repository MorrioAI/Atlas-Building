# Atlas

**The AI-native career platform — built in the open.**

Atlas helps people prove what they can actually do. Our thesis: career development is broken not because people lack skills, but because they lack **evidence**. Atlas generates capability evidence from real work — not self-reported claims.

This repository is the real, living codebase. Read it, run it, and ship pull requests that become part of your public contribution history.

> 🎓 **New here?** The guided program — where you take on a role and help build Atlas week by week with AI feedback — lives on **[Morrio Universe](https://morrio.ai/universe)**. This repo is the real thing you contribute to; the platform is how you learn to. We keep briefs and mentorship on the platform on purpose, so contributing here always means shipping something real.

## Stack

- **Next.js** (App Router) · **React** · **TypeScript**
- **Supabase** — Postgres, Auth, Storage
- **Anthropic Claude** — the AI evaluation layer
- **Stripe** — billing
- **Tailwind CSS**

## Quickstart

```bash
pnpm install
cp .env.example .env.local   # add your keys
pnpm dev                     # http://localhost:3000
```

The schema lives in [`supabase/migrations`](./supabase/migrations). Apply it to
your own Supabase project with the [Supabase CLI](https://supabase.com/docs/guides/local-development)
(`supabase db push`). The home page runs without it; `/api/media/video/*` and the
AI spend ledger read tables that only the migrations create.

## Repository layout

```
src/
  app/            Next.js routes + API handlers
  components/     React components
  lib/
    talent/       The Talent Algorithm — 7-dimension capability scoring
    ai/           Claude client + prompt orchestration, and spend metering
    media/        Path helpers + the access decision behind private media
    expert-review/  Availability for the paid human review surface
    observability/  Error reporting
    supabase/     Server + browser clients, and a service-role client
    maintenance.ts  The maintenance switch, read in middleware
  middleware.ts   Runs on every request — see ARCHITECTURE.md § Runtimes
  types/          Shared types
supabase/
  migrations/     The schema the above depends on
docs/             How we work — per-discipline handbooks, and ADRs
.github/          Issue/PR templates, CODEOWNERS, CI
```

## How we work

Every craft has a short handbook. Read yours before opening a PR:

| Discipline | Handbook |
|------------|----------|
| Engineering | [`docs/engineering`](./docs/engineering) |
| Product | [`docs/product`](./docs/product) |
| Design | [`docs/design`](./docs/design) |
| Data | [`docs/data`](./docs/data) |
| Marketing | [`docs/marketing`](./docs/marketing) |
| Strategy & Ops | [`docs/operations`](./docs/operations) |

Architecture: [`ARCHITECTURE.md`](./ARCHITECTURE.md) · Roadmap: [`ROADMAP.md`](./ROADMAP.md) · Decisions: [`docs/adr`](./docs/adr)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Start with a [`good first issue`](../../issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

## License

MIT © Tripool LLC. See [LICENSE](./LICENSE).
