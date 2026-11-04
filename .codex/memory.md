# Project memory

## What we are building

Artemis is a new app to compare life insurance in Australia. The user initially described car insurance and then changed the product to life insurance. Treat life insurance as the current scope.

## Intended platform

- GitHub: mangodog-ai/artemis
- Hosting: Vercel
- Database: Supabase
- Identity and permissions: Microsoft Entra ID
- App stack: Next.js App Router + React (starter scaffold created; JavaScript for now)
- Entra integration: NextAuth Microsoft Azure AD OpenID Connect provider, with a pinned single-tenant authority and assigned-user access
- Auth implementation details and Azure/Vercel setup: docs/ENTRA_SETUP.md

## Current implementation

- The home page says the service is under construction and links to /login.
- /login offers Microsoft sign-in when the required environment variables are present; otherwise it explains that setup is incomplete.
- /account requires a server-side authenticated session. Enterprise-app assignment is configured in Entra; no app roles or group-based authorization are implemented.
- Entra credentials and NEXTAUTH_SECRET must stay in server-only Vercel environment variables and ignored local .env.local files; never commit them.
- Supabase, comparison data, and insurer integrations are not connected.

## Product guardrails

- No insurer quote feeds or integrations have been selected.
- Do not present indicative or stored prices as live quotes.
- Clearly retain source, captured/effective dates, assumptions, and limitations for any comparison data.
- Avoid collecting health information until the user journey and necessity are understood. Health and underwriting information is especially sensitive.
- No advice, suitability assessment, sales channel, or regulatory positioning has been approved.

## Unresolved decisions

See docs/PRODUCT.md for the MVP questions and docs/DECISIONS.md for the decision log. Update this memory when confirmed decisions materially change the product or architecture.
