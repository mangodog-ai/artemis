# Artemis

An Australia-focused life insurance comparison app. The initial product direction is to help people compare life cover options with clear explanations of price, cover, exclusions, and key policy differences.

## Project status

This is a new project. Product scope, quote sources, customer access model, and the exact Entra ID authorization model are still being defined. See [the feature list](docs/FEATURES.md), [product brief](docs/PRODUCT.md), and [architecture notes](docs/ARCHITECTURE.md).

## Planned platform

- Next.js App Router and React, deployed on Vercel (the starter is JavaScript).
- Supabase Postgres for application data, with Row Level Security for data access controls.
- Microsoft Entra ID for sign-in and app access. The initial integration direction is Supabase Auth's Microsoft/Azure provider; role and group authorization still needs validation.
- GitHub repository: [mangodog-ai/artemis](https://github.com/mangodog-ai/artemis).

These are the current working choices, not a deployed or configured system.

## Getting started

Requires Node.js 20.9 or newer. Run npm install once, then npm run dev and open http://localhost:3000. The /login route is a visual placeholder; Microsoft Entra authentication is not connected yet.

Before adding comparison flows or collecting personal information, agree on the MVP decisions listed in [the product brief](docs/PRODUCT.md).

## Project memory

Keep durable context in [AGENTS.md](AGENTS.md), [.codex/memory.md](.codex/memory.md), and the decision log. Update those files when product scope or architecture decisions change. Avoid putting secrets, personal information, or production data in the repository.
