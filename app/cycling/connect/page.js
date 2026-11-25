import Link from "next/link";
import { requireUser } from "../../../lib/require-user";
import { isStravaConfigured } from "../../../lib/cycling/strava";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import StravaConnectionControl from "../strava-connection-control";

export const metadata = {
  title: "Connect Strava — Artemis Cycling",
  description: "Connect your Strava account to explore your cycling history.",
};

const connectionErrors = {
  configuration: "Strava setup is incomplete. Check the app credentials, support email, callback, webhook subscription, database webhook secret and token encryption key.",
  state: "The connection session expired or could not be verified. Start again from this page.",
  denied: "Strava authorization was cancelled. You can try again whenever you are ready.",
  scope: "Activity access was not granted. Artemis Cycling needs activity:read_all to include private activities.",
  callback: "Strava did not return the information needed to finish connecting.",
  connection: "The connection could not be saved. Check the database migration and app configuration, then retry.",
  consent: "Review the data notice and confirm consent before continuing.",
};

export default async function StravaConnectPage({ searchParams }) {
  await requireUser({ nextPath: "/cycling/connect" });
  const params = await searchParams;
  const error = typeof params?.error === "string" ? connectionErrors[params.error] : null;
  const supportEmail = process.env.STRAVA_SUPPORT_EMAIL;
  const supabase = await createSupabaseServerClient();
  const { data: webhookReady, error: webhookError } = await supabase.rpc("check_cycling_strava_webhook_config", {
    p_webhook_secret: process.env.STRAVA_WEBHOOK_DB_SECRET,
  });
  const canConnect = isStravaConfigured() && Boolean(supportEmail) && Boolean(webhookReady) && !webhookError;

  return <main className="cycling-settings-page">
    <header className="cycling-settings-header"><Link href="/cycling">← Back to Cycling</Link><span>ACCOUNT CONNECTION</span></header>
    <section className="cycling-settings-card">
      <span className="cycling-eyebrow">YOUR DATA, YOUR CALL</span>
      <h1>Connect <em>Strava.</em></h1>
      <p className="cycling-settings-lead">Bring your ride history into your personal Artemis Cycling analysis.</p>
      {error && <p className="strava-error" role="alert">{error}</p>}
      <div className="strava-data-notice">
        <h2>What this connection does</h2>
        <ul>
          <li>Requests read access to your activity history, including activities set to Only You. It does not request permission to edit or upload activities.</li>
          <li>Loads up to the most recent 12 months of cycling activities when you open Cycling, then builds your charts from that response.</li>
          <li>Ride records are not saved to Artemis storage. They stay in page memory for up to 24 hours and are fetched again when you refresh after that.</li>
          <li>Your OAuth tokens are encrypted before being stored in your account. You can disconnect here; the app will revoke its access and delete its stored token.</li>
          <li>Your activity data is shown only to your signed-in account. You can request deletion by disconnecting; no ride records are stored in the app database.</li>
        </ul>
      </div>
      <p className="strava-policy-note">Strava may monitor and use API usage data as described in its <a href="https://www.strava.com/legal/api_policy" target="_blank" rel="noreferrer">API Policy</a>. See the <Link href="/cycling/privacy">Artemis Cycling privacy notice</Link>.</p>
      <StravaConnectionControl configured={canConnect}/>
      <p className="strava-support">Support: {supportEmail ? <a href={`mailto:${supportEmail}`}>{supportEmail}</a> : <b>Not configured. Set STRAVA_SUPPORT_EMAIL before connecting.</b>}</p>
    </section>
  </main>;
}
