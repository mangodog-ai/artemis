# Artemis

An Australia-focused life insurance comparison app. The initial product direction is to help people compare life cover options with clear explanations of price, cover, exclusions, and key policy differences.

## Project status

This is a new project. Product scope, quote sources, customer access model, and the exact Entra ID authorization model are still being defined. See [the feature list](docs/FEATURES.md), [product brief](docs/PRODUCT.md), and [architecture notes](docs/ARCHITECTURE.md).

## Planned platform

- Next.js App Router and React, deployed on Vercel (the starter is JavaScript).
- Supabase Auth for Microsoft Entra sign-in and Supabase Postgres for application data, with Row Level Security for user-owned comparison history.
- Microsoft Entra ID is configured as Supabase Auth's single-tenant Azure provider. Admin catalog access is separately allow-listed in the database.
- GitHub repository: [mangodog-ai/artemis](https://github.com/mangodog-ai/artemis).

Supabase and Entra configuration are project-specific and must be completed using [the Entra and Supabase run sheet](docs/ENTRA_SETUP.md). The comparison migration is in [supabase/migrations](supabase/migrations).

## Getting started

Requires Node.js 20.9 or newer. Copy `.env.example` to `.env.local`, set the Supabase project URL and publishable key, run `npm install`, then `npm run dev` and open http://localhost:3000. `/compare`, saved comparisons, and catalog administration require sign-in.

Apply the SQL migration and complete the Azure/Supabase setup before testing sign-in or database features. The initial comparison form stores cover type, amount, age, state, and premium basis; it does not collect health, smoking, or occupation data. It does not generate premiums.

## Project memory

Keep durable context in [AGENTS.md](AGENTS.md), [.codex/memory.md](.codex/memory.md), and the decision log. Update those files when product scope or architecture decisions change. Avoid putting secrets, personal information, or production data in the repository.
