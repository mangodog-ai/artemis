# Artemis

An Australia-focused life insurance comparison app. The initial product direction is to help people compare life cover options with clear explanations of price, cover, exclusions, and key policy differences.

## Project status

This is a new project. Product scope, quote sources, customer access model, and the exact Entra ID authorization model are still being defined. See [the feature list](docs/FEATURES.md), [product brief](docs/PRODUCT.md), and [architecture notes](docs/ARCHITECTURE.md).

## Planned platform

- Next.js App Router and React, deployed on Vercel (the starter is JavaScript).
- Supabase Postgres for application data, with Row Level Security for data access controls.
- Microsoft Entra ID for single-tenant sign-in by assigned users. Authentication uses a server-side OAuth flow; app roles and authorization are not yet configured.
- GitHub repository: [mangodog-ai/artemis](https://github.com/mangodog-ai/artemis).

Supabase remains a planned data platform and is not connected yet. Entra authentication requires the portal setup in [the Entra run sheet](docs/ENTRA_SETUP.md).

## Getting started

Requires Node.js 20.9 or newer. Copy `.env.example` to `.env.local`, configure the values as described in [the Entra run sheet](docs/ENTRA_SETUP.md), run `npm install`, then `npm run dev` and open http://localhost:3000. `/account` is protected and redirects unauthenticated visitors to `/login`.

Before adding comparison flows or collecting personal information, agree on the MVP decisions listed in [the product brief](docs/PRODUCT.md).

## Project memory

Keep durable context in [AGENTS.md](AGENTS.md), [.codex/memory.md](.codex/memory.md), and the decision log. Update those files when product scope or architecture decisions change. Avoid putting secrets, personal information, or production data in the repository.
