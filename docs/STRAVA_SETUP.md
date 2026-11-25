# Strava setup for Artemis Cycling

The app code is ready for OAuth, but this repository does not contain the Strava app credentials or encryption key. Keep these values in `.env.local` for development and in the deployment's server-only environment settings for production. Never add them to `NEXT_PUBLIC_*`, source files, logs, or screenshots.

## 1. Create the Strava application

Create an API application in your Strava account settings. New apps start in single-player mode for the developer's own account. Strava currently requires a subscription to create an API app. Set the Authorization Callback Domain to `localhost` for local testing. For deployment, use the exact production hostname and register the matching callback URI.

The app requests only `activity:read_all`, which is read-only activity access and includes activities marked Only You. It does not request permission to write or upload activities. You must accept the consent notice in Artemis Cycling before the OAuth redirect begins.

Strava's changelog currently says the API base changes from `https://www.strava.com/api/v3` to `https://api-v3.strava.com` on January 4, 2027. The activity adapter switches to the new base on that date; the OAuth and webhook subscription endpoints continue to use their documented hosts.

## 2. Apply the Supabase migration

Apply `supabase/migrations/20261125000000_cycling_strava_connection.sql` to the Supabase project configured for Artemis. The migration creates a private, owner-scoped connection table and RPC functions. It does not create an activity history table.

## 3. Configure local values

Copy the variable names from `.env.example` into `.env.local` and fill in:

| Variable | Value |
| --- | --- |
| `STRAVA_CLIENT_ID` | Client ID shown in Strava API settings |
| `STRAVA_CLIENT_SECRET` | Client secret shown in Strava API settings |
| `STRAVA_REDIRECT_URI` | `http://localhost:3000/api/strava/callback` for local testing |
| `STRAVA_TOKEN_ENCRYPTION_KEY` | A dedicated base64 encoded 32-byte key |
| `STRAVA_SUPPORT_EMAIL` | A real contact address shown in the consent and privacy pages |
| `STRAVA_WEBHOOK_CALLBACK_URL` | Public HTTPS URL ending in `/api/strava/webhook/<path-secret>` |
| `STRAVA_WEBHOOK_PATH_SECRET` | Random secret segment used to protect the webhook route |
| `STRAVA_WEBHOOK_VERIFY_TOKEN` | Random token Strava sends during webhook setup validation |
| `STRAVA_WEBHOOK_DB_SECRET` | Random secret used by the deauthorization database function |
| `STRAVA_WEBHOOK_SUBSCRIPTION_ID` | Subscription ID returned by Strava after creating the webhook |

Generate a fresh token encryption key with `openssl rand -base64 32`. Store it in a password manager and the server environment. Losing or rotating the key without re-encrypting the stored token will require reconnecting Strava.

Generate the three webhook secrets with `openssl rand -hex 32`. Put the path secret in the callback URL as well as `STRAVA_WEBHOOK_PATH_SECRET`. After applying the migration, insert the DB secret once through the Supabase SQL Editor:

```sql
insert into public.cycling_strava_webhook_config (singleton, webhook_secret_hash)
values (true, md5('<STRAVA_WEBHOOK_DB_SECRET>'));
```

The config table is not readable by application roles. Keep the inserted value and server environment value identical.

For Vercel, set `STRAVA_REDIRECT_URI` to `https://<your-domain>/api/strava/callback`, use the same hostname as the Strava callback domain, and add the same secrets in Vercel's server environment settings. Set the privacy policy URL in Strava's API application settings to `https://<your-domain>/cycling/privacy`.

## 4. Register the required webhook

Deploy the webhook route to a public HTTPS domain first. In Strava, use the public hostname as the Authorization Callback Domain and set `STRAVA_WEBHOOK_CALLBACK_URL` to `https://<your-domain>/api/strava/webhook/<path-secret>`. Set `STRAVA_WEBHOOK_VERIFY_TOKEN`, then run `npm run strava:webhook` once with the credentials loaded in the environment. The script prints only the new subscription ID; set it as `STRAVA_WEBHOOK_SUBSCRIPTION_ID` in the server environment and redeploy. Strava supports one webhook subscription per API app. The handler validates the challenge and subscription ID and removes local tokens when Strava reports deauthorization.

## 5. Connect and use

Start Artemis, sign in with the configured Artemis account, open `/cycling/connect`, review and accept the notice, then authorize Artemis in Strava. The dashboard fetches up to 1,000 cycling activities from the last 365 days when opened. The initial fetch can use several API calls for a high volume of rides; the app exposes rate-limit errors and does not poll in the background.

Ride summaries are not saved in the app database or browser storage. They are held in page memory for up to 24 hours and then need to be fetched again. OAuth tokens are encrypted server-side. The Connection settings page can revoke access and delete the local token.

## Limits

This is intended for personal single-player testing. Strava's current developer agreement limits caching to seven days, requires deletion when a user disconnects or requests it, and requires activity deletions to be reflected promptly. This integration uses a 24-hour in-memory activity window and deletes its local token on disconnect. Review the current Strava API Agreement and confirm its webhook, support contact, privacy, and deletion requirements before connecting additional riders or operating a public service.
