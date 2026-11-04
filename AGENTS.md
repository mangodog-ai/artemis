# Working in this repository

## Product context

- Artemis is a new Australia-focused life insurance comparison app.
- Planned hosting is Vercel; planned database is Supabase Postgres; app identity and access permissions are expected to come from Microsoft Entra ID.
- The frontend uses Next.js App Router and JavaScript. Supabase Auth brokers single-tenant Microsoft Entra sign-in; Supabase Postgres stores comparison history with RLS. Project configuration and the migration must be applied using docs/ENTRA_SETUP.md before database features work.
- Product scope and quote sourcing are unresolved. See docs/PRODUCT.md and docs/FEATURES.md before making product assumptions.

## Working rules

- Prefer small, reviewable changes and keep documentation aligned with implementation.
- Treat insurance pricing, policy terms, eligibility, and underwriting as time-sensitive and source-specific. Store provenance and effective dates for comparison data.
- Do not invent or imply live quotes, insurer integrations, policy recommendations, or regulatory approval.
- Compare prices only when a verified source matches all saved assumptions exactly; never calculate or imply a live quote.
- Minimize collection of health and identity information. Comparison inputs currently include age/state but exclude health, smoking, and occupation. Do not add real personal or health data to fixtures, logs, screenshots, or repository files.
- Enforce authorization on the server and in database policies. Hiding a UI element is not an access control.
- Never commit credentials. Keep local secrets in ignored environment files and maintain a safe .env.example if configuration is introduced.
- When the app is scaffolded, document commands and run only the checks the user asks for.
