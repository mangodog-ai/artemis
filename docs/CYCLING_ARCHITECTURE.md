# Artemis Cycling architecture

Artemis Cycling is a separate product area in this Next.js app, available at `/cycling`. It shares the app runtime, but has its own visual system, navigation, pages, and data boundary. The life insurance product remains at the existing routes.

## Current structure

- `app/cycling/` contains the Cycling layout, overview, analysis, forecast, and activity routes.
- `app/cycling/cycling-dashboard.js` composes the dashboard views and reusable chart and metric components.
- `app/cycling/cycling.css` owns Cycling-specific styling so the existing insurance UI is not coupled to it.
- `lib/cycling/` holds sample activity data and a small forecast function. The data is synthetic and must be replaced before interpreting the dashboard as a rider's history.

## Data and provider boundary

Keep the UI dependent on normalized cycling activity and aggregate types, not Strava response shapes. A future server-side activity repository should be the only layer that reads provider records. A Strava adapter can normalize activities and stream data into the app's internal model, while pages consume that repository. Keep OAuth callback handling, token refresh, and sync jobs in server-only code. Never put access or refresh tokens in browser state, URLs, logs, or client bundles.

Before enabling a real connection, define the account model, requested OAuth scopes, consent and disconnect behavior, token encryption, retention/deletion, sync cadence, rate-limit handling, and treatment of private activities. Confirm current Strava API requirements and data use terms from official documentation at implementation time. Do not present sample values as connected account data.

## Analysis and forecast boundary

Keep descriptive metrics (distance, moving time, elevation, frequency) separate from forecast algorithms. Forecast outputs should carry their input window, method/version, assumptions, and an uncertainty or confidence description. The current example extends a recent distance average to demonstrate the product surface; it is explicitly illustrative and is not a training plan. Add a new feature by giving it a route under `app/cycling/`, reusing shared dashboard components, and placing its data logic in `lib/cycling/`.

## Next integration steps

1. Decide whether Cycling uses the existing Supabase identity or a separate account boundary.
2. Register/configure the Strava OAuth client and define secure token storage and disconnection behavior.
3. Add normalized activity and stream storage with per-user authorization and a sync watermark.
4. Replace the demo data source with the server-side repository; keep explicit source and sync timestamps.
5. Implement analysis and forecasting against real, consented history with visible assumptions and limits.
