# Architecture notes

## Current proposal

The frontend uses the Next.js App Router with Supabase SSR authentication and a Supabase Postgres comparison catalog.

    User browser
        |
        v
    Next.js application on Vercel
        +-- Supabase Auth OAuth <-> Microsoft Entra ID
        +-- secure Supabase session cookies, refreshed in Next.js proxy
        +-- verified user checks in pages and route handlers
                 |
                 v
          Supabase Postgres + Row Level Security
          +-- source-backed product catalog (admin managed)
          +-- user-owned comparison and result snapshots

Supabase Auth brokers single-tenant Microsoft Entra sign-in. Its signed user identity is used by Postgres RLS; the app does not use a service-role key. See the [Entra and Supabase run sheet](./ENTRA_SETUP.md) for portal configuration and credentials.

## Identity and authorization

- Authentication answers who signed in; authorization determines which app data/actions they may access.
- Entra is the intended source of identity and permissions. A Microsoft sign-in button alone does not establish the required role/group policy.
- Sign-in is restricted by the Azure provider's tenant URL and Entra enterprise-app assignments.
- Authenticated users can read the verified catalog and only their own comparison history/results. RLS policies enforce ownership using `auth.uid()`.
- Catalog writes and source verification require an explicit row in `public.artemis_admins`; users cannot grant themselves admin access.
- Server pages and route handlers verify the Supabase user. Supabase's publishable key is the only project key used by the app; do not add a service-role key to Vercel.

## Comparison data model

The SQL migration creates providers, products, cover types, sourced coverage/facts, sourced premium examples, per-user comparisons, and immutable result snapshots. Every catalog fact/coverage/premium references a source and captured/effective dates. Product prices appear only for an exact match on cover type, amount, age, state, and premium basis. The engine does not calculate premiums or imply a sourced value is an insurer quote.

The initial comparison stores cover type, amount, age, state, premium basis, and the privacy notice version accepted. It excludes smoking, occupation, and health details. Users can delete saved comparisons; a broader retention policy remains to be decided.

Provider rows for Medibank, AHM, and TAL are name-only catalog entries. Product terms and prices are not seeded; administrators must add and verify permitted source material.

## Environments and secrets

- Store only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel/local env; these are public project configuration, not service credentials.
- Configure the Entra client secret in Supabase Auth's Azure provider settings, not in application environment variables.
- Never put Supabase service-role/secret keys, OAuth client secrets, or production data in the app, browser, or repository. `.env.example` contains only public variable names.
- Keep preview and production Supabase/Entra configuration separated where feasible.

## Deployment direction

Connect the GitHub repository to Vercel so pull requests can use preview deployments and the protected production branch can deploy to production. The production domain, branch policy, Supabase regions, backups, monitoring, and release process remain undecided.

## Security and privacy baseline

- Default deny for access until tenant and role rules are explicit.
- RLS is enabled on catalog, admin allow-list, comparisons, and result snapshots; policies give comparison owners access only to their own rows.
- Catalog changes go through security-definer database functions that check the admin allow-list. Keep these functions narrowly scoped and do not expose direct client writes.
- Apply and test migrations before deployment. Review policies whenever tables, RPCs, or roles change.
- Keep sensitive values out of URLs, telemetry, and routine logs.
- Define data minimization, retention, deletion, and audit expectations before collecting personal or health data.
- Review threat model and qualified Australian privacy/insurance obligations before handling real customer data or enabling advice/quote flows.
