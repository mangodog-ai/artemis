# Architecture notes

## Current proposal

The starter frontend uses the Next.js App Router with React. The landing page and login screen are currently static UI; there is no auth callback, Supabase client, or database integration yet.

    User browser
        |
        v
    Next.js application on Vercel
        +-- server-side OAuth sign-in <-> Microsoft Entra ID
        +-- signed, secure NextAuth session cookie
        +-- server-side authentication checks for protected routes/actions
                 |
                 v
          Supabase Postgres (planned; not connected)
          +-- Row Level Security policies (required before storing app data)

The app currently uses NextAuth's Microsoft Azure AD OpenID Connect provider with a single-tenant authority. See the [Entra setup run sheet](./ENTRA_SETUP.md) for portal configuration and credential handling. Supabase is not part of the current sign-in flow.

## Identity and authorization

- Authentication answers who signed in; authorization determines which app data/actions they may access.
- Entra is the intended source of identity and permissions. A Microsoft sign-in button alone does not establish the required role/group policy.
- Sign-in is restricted to the configured tenant ID and Entra enterprise-app assignments. All assigned users currently receive the same basic sign-in access; app roles and group authorization are not implemented.
- Enforce the resulting authorization on server-side operations and with database Row Level Security where data access allows it.
- `/account` uses a server-side session check. Every future protected route, server action, API handler, and data access path must independently enforce authorization.
- The app uses the identity token only to establish its server-side session. Do not use an ID token as an API authorization credential; Microsoft distinguishes ID tokens from access tokens.

## Data model direction (not implemented)

Likely entities include insurer, product, cover type, product terms, price/quote snapshot, source record, comparison inputs, user/role, and administrative change history. Keep volatile values such as premiums separate from stable product descriptions. Attach source, retrieval/effective dates, status, and assumptions to sourced records. Avoid storing health information unless essential to an agreed flow.

## Environments and secrets

- Keep local, preview, and production credentials separated. Do not share production Entra credentials with preview deployments.
- Store OAuth credentials and `NEXTAUTH_SECRET` as server-only Vercel environment variables; use `.env.local` for local development.
- Do not commit `.env` files, OAuth secrets, or production data. `.env.example` contains variable names only.
- Rotate Entra client secrets before expiry and redeploy after updating the runtime value.

## Deployment direction

Connect the GitHub repository to Vercel so pull requests can use preview deployments and the protected production branch can deploy to production. The production domain, branch policy, Supabase regions, backups, monitoring, and release process remain undecided.

## Security and privacy baseline

- Default deny for access until tenant and role rules are explicit.
- RLS enabled on tables exposed through Supabase APIs, with policy behavior reviewed for each role.
- Validate authorization on every protected server action/route and every database access path.
- Keep sensitive values out of URLs, telemetry, and routine logs.
- Define data minimization, retention, deletion, and audit expectations before collecting personal or health data.
- Review threat model and qualified Australian privacy/insurance obligations before handling real customer data or enabling advice/quote flows.
