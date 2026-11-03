# Project memory

## What we are building

Artemis is a new app to compare life insurance in Australia. The user initially described car insurance and then changed the product to life insurance. Treat life insurance as the current scope.

## Intended platform

- GitHub: mangodog-ai/artemis
- Hosting: Vercel
- Database: Supabase
- Identity and permissions: Microsoft Entra ID
- App stack: Next.js App Router + React (starter scaffold created; JavaScript for now)
- Proposed Entra connection: Supabase Auth Microsoft/Azure provider (not yet configured or validated for required role/group claims)

## Current implementation

- The home page says the service is under construction and links to /login.
- The /login page shows a Microsoft sign-in control as unavailable until Entra authentication is configured.
- No real authentication, comparison data, or insurer integrations are implemented.
- This environment does not currently have Node.js/npm available, so the app could not be run locally here.

## Product guardrails

- No insurer quote feeds or integrations have been selected.
- Do not present indicative or stored prices as live quotes.
- Clearly retain source, captured/effective dates, assumptions, and limitations for any comparison data.
- Avoid collecting health information until the user journey and necessity are understood. Health and underwriting information is especially sensitive.
- No advice, suitability assessment, sales channel, or regulatory positioning has been approved.

## Unresolved decisions

See docs/PRODUCT.md for the MVP questions and docs/DECISIONS.md for the decision log. Update this memory when confirmed decisions materially change the product or architecture.
