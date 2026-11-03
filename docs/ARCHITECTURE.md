# Architecture notes

## Current proposal

The starter frontend uses the Next.js App Router with React. The landing page and login screen are currently static UI; there is no auth callback, Supabase client, or database integration yet.

    User browser
        |
        v
    Next.js application on Vercel
        +-- sign-in flow through Supabase Auth <-> Microsoft Entra ID
        +-- server-side routes/actions for protected operations
        +-- Supabase client with user session
                 |
                 v
          Supabase Postgres
          +-- Row Level Security policies

The diagram is a starting point, not a configured deployment. Vercel supports Git-based deployments, including preview and production environments. Supabase documents a Microsoft/Azure OAuth provider and a server-side PKCE callback flow for SSR applications. Confirm the exact flow, claims, and authorization mapping before implementing access controls. [Vercel deployment docs](https://vercel.com/docs/deployments) · [Supabase Azure sign-in docs](https://supabase.com/docs/guides/auth/social-sign-in/auth-azure)

## Identity and authorization

- Authentication answers who signed in; authorization determines which app data/actions they may access.
- Entra is the intended source of identity and permissions. A Microsoft sign-in button alone does not establish the required role/group policy.
- Choose one supported claim-to-role mapping and verify token contents, tenant restrictions, and behavior when group claims are overage/absent.
- Enforce the resulting authorization on server-side operations and with database Row Level Security where data access allows it.
- Never trust role values supplied by the browser. Do not use an ID token as an API authorization credential; Microsoft distinguishes ID tokens from access tokens.
- Decide whether Supabase Auth brokers Entra sign-in, or whether Entra tokens are passed as third-party auth. The former is the current proposal, not a final decision.

## Data model direction (not implemented)

Likely entities include insurer, product, cover type, product terms, price/quote snapshot, source record, comparison inputs, user/role, and administrative change history. Keep volatile values such as premiums separate from stable product descriptions. Attach source, retrieval/effective dates, status, and assumptions to sourced records. Avoid storing health information unless essential to an agreed flow.

## Environments and secrets

- Keep local, preview, and production Supabase projects/data separated where feasible.
- Configure Vercel preview and production environment variables separately.
- Use public Supabase URL/anon key only where intended; keep service-role keys, OAuth secrets, and other privileged credentials server-side.
- Do not commit .env files or production data. Add an .env.example only when implementation variables are known.

## Deployment direction

Connect the GitHub repository to Vercel so pull requests can use preview deployments and the protected production branch can deploy to production. The production domain, branch policy, Supabase regions, backups, monitoring, and release process remain undecided.

## Security and privacy baseline

- Default deny for access until tenant and role rules are explicit.
- RLS enabled on tables exposed through Supabase APIs, with policy behavior reviewed for each role.
- Validate authorization on every protected server action/route and every database access path.
- Keep sensitive values out of URLs, telemetry, and routine logs.
- Define data minimization, retention, deletion, and audit expectations before collecting personal or health data.
- Review threat model and qualified Australian privacy/insurance obligations before handling real customer data or enabling advice/quote flows.
