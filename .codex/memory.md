# Project memory

## What we are building

Artemis is a new app to compare life insurance in Australia. The user initially described car insurance and then changed the product to life insurance. Treat life insurance as the current scope.

## Intended platform

- GitHub: mangodog-ai/artemis
- Hosting: Vercel
- Database: Supabase
- Identity and permissions: Microsoft Entra ID
- App stack: Next.js App Router + React (starter scaffold created; JavaScript for now)
- Entra integration: Supabase Auth Azure provider, pinned to the single tenant, with assigned-user access
- Auth, database, and Vercel setup: docs/ENTRA_SETUP.md

## Current implementation

- The home page says the service is under construction and links to /login.
- /login uses Supabase Auth's Azure OAuth flow. Update the Entra callback and Supabase provider before deploying this auth change.
- Supabase SSR session cookies protect /account, /compare, /comparisons, and /admin.
- The comparison engine saves cover type, amount, age, state, premium basis, and source-backed result snapshots. RLS isolates history to each signed-in Supabase user.
- Admin catalog entry and source verification use public.artemis_admins; an admin must be allow-listed in Supabase after signing in.
- /quote-lab is a test-only interface for fictional underwriting profiles, draft requests, and simulated results. Profile and request payloads are AES-256-GCM encrypted server-side; the Supabase migration and server-only UNDERWRITING_ENCRYPTION_KEY must be configured before use. It does not send data to insurer sites.
- The migration seeds only provider names (Medibank, AHM, TAL) and cover-type labels; no provider product terms or premiums are invented.
- Supabase secrets remain in the Supabase dashboard; the app uses only the public URL and publishable key. Never commit secrets.

## Product guardrails

- No insurer quote feeds or integrations have been selected.
- User wants the future quote flow to collect and store underwriting details in a private profile to reduce repeated input. The current encrypted profile is test-only with fictional data. Do not reuse it for production until exact provider fields, separate consent to store/send, key management, retention/deletion, and access rules are designed. Never use real details in fixtures or logs.
- Quote agent permission review and proposed data flow are in docs/QUOTE_AGENT.md. Budget Direct terms explicitly block scraping/scripted responses and systematic/repetitive quote gathering; TAL's materials license is limited to personal/non-commercial use. Zurich and Medibank quote-flow permissions still need verification.
- Do not present indicative or stored prices as live quotes.
- Clearly retain source, captured/effective dates, assumptions, and limitations for any comparison data.
- Treat health and underwriting information as especially sensitive and follow the profile safeguards in docs/QUOTE_AGENT.md.
- No advice, suitability assessment, sales channel, or regulatory positioning has been approved.

## Unresolved decisions

See docs/PRODUCT.md for the MVP questions and docs/DECISIONS.md for the decision log. Update this memory when confirmed decisions materially change the product or architecture.
