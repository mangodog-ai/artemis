# Artemis Cycling architecture

Artemis Cycling is a separate product area in this Next.js app, available at `/cycling`. It shares the app runtime, but has its own visual system, navigation, pages, and data boundary. The life insurance product remains at the existing routes.

## Current structure

- `app/cycling/` contains the Cycling layout, overview, analysis, forecast, and activity routes.
- `app/cycling/cycling-dashboard.js` composes the dashboard views and reusable chart and metric components.
- `app/cycling/cycling.css` owns Cycling-specific styling so the existing insurance UI is not coupled to it.
- `lib/cycling/` holds sample activity data and a small forecast function. The data is synthetic and must be replaced before interpreting the dashboard as a rider's history.

## Data and provider boundary

The Strava adapter in `lib/cycling/strava.js` exchanges and refreshes OAuth tokens on the server, encrypts tokens with AES-256-GCM, and normalizes activity summaries. The account connection is owner-scoped through Supabase RPC functions in the Cycling migration. The browser never receives OAuth tokens.

The activity endpoint fetches at most 1,000 cycling activities from the previous 365 days directly from Strava. It returns only the summary fields needed for charts and ride lists. Responses use `no-store`; activity data stays in in-memory page state for up to 24 hours, then must be refreshed. Activity rows and aggregates are not written to Postgres or browser storage. Do not add persistent activity storage or a longer cache without rechecking Strava's current agreement.

The consent page at `/cycling/connect` explains the requested `activity:read_all` scope, data fields, use, retention, and disconnect behavior. Disconnect calls Strava's current token revoke endpoint and deletes the local encrypted connection. The privacy notice is at `/cycling/privacy`. Configure `STRAVA_SUPPORT_EMAIL` before enabling consent; set the same URL as the privacy policy in Strava's application settings. A deauthorization webhook is handled at `/api/strava/webhook/[secret]`; the app requires the Strava subscription ID and database webhook secret to be configured before registering the subscription.

## Analysis and forecast boundary

Keep descriptive metrics (distance, moving time, elevation, frequency) separate from forecast algorithms. Forecast outputs should carry their input window, method/version, assumptions, and an uncertainty or confidence description. The current example extends a recent distance average to demonstrate the product surface; it is explicitly illustrative and is not a training plan. Add a new feature by giving it a route under `app/cycling/`, reusing shared dashboard components, and placing its data logic in `lib/cycling/`.

## Next integration steps

1. Create a Strava API application. New Strava apps start in single-player mode; Strava currently requires a subscription to create an app.
2. Apply `supabase/migrations/20261125000000_cycling_strava_connection.sql` and configure the server-only values listed in `STRAVA_SETUP.md`.
3. Set the Strava callback domain and redirect URI to match the environment. For local development, use `localhost` and `http://localhost:3000/api/strava/callback`.
4. Sign into Artemis, open `/cycling/connect`, review the notice, and authorize the Strava account.
5. Register the deauthorization webhook using the instructions in `STRAVA_SETUP.md` before connecting the account.
6. Recheck Strava's current API agreement, webhook and deletion requirements before making this available beyond personal single-player testing.

The activity summaries are fetched on demand, not stored as a durable archive. Forecasts are exploratory calculations from the most recent four weeks and should retain visible method and assumptions.
