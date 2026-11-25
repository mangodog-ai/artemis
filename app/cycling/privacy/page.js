import Link from "next/link";

export const metadata = {
  title: "Privacy — Artemis Cycling",
  description: "How Artemis Cycling handles a connected Strava account.",
};

export default function CyclingPrivacyPage() {
  const supportEmail = process.env.STRAVA_SUPPORT_EMAIL;
  return <main className="cycling-settings-page">
    <header className="cycling-settings-header"><Link href="/cycling">← Back to Cycling</Link><span>PRIVACY</span></header>
    <article className="cycling-settings-card cycling-privacy-card">
      <span className="cycling-eyebrow">ARTEMIS CYCLING</span>
      <h1>Privacy <em>notice.</em></h1>
      <p>This notice covers the optional Strava connection in Artemis Cycling.</p>
      <h2>Data collected</h2><p>With your consent, Artemis Cycling requests activity read access and receives your ride name, activity type, start date, distance, moving time and elevation gain. The requested activity scope includes activities you have marked Only You. The app does not request access to create or edit activities.</p>
      <h2>How data is used</h2><p>Activity records are fetched from Strava when you open the Cycling workspace and used to calculate your personal graphs and exploratory forecasts. Activity data is kept only in temporary page memory for no more than 24 hours; it is not written to the Artemis database. The app may retain encrypted Strava OAuth tokens and connection consent metadata so it can refresh the connection.</p>
      <h2>Your choices and deletion</h2><p>You may disconnect from the <Link href="/cycling/connect">Strava connection page</Link>. Artemis Cycling will revoke its Strava authorization and delete its stored token. Disconnecting also clears activity data currently held in the page. You may also revoke access through your <a href="https://www.strava.com/settings/apps" target="_blank" rel="noreferrer">Strava app settings</a>. Contact support to request deletion or help with a data request.</p>
      <h2>Security and third-party processing</h2><p>OAuth tokens are encrypted by the application before they are stored. Strava processes activity data under its own terms and privacy notice. Strava may monitor and use API usage data as described in its <a href="https://www.strava.com/legal/api_policy" target="_blank" rel="noreferrer">API Policy</a>.</p>
      <h2>Contact</h2><p>{supportEmail ? <a href={`mailto:${supportEmail}`}>{supportEmail}</a> : "Support contact has not been configured yet. Set STRAVA_SUPPORT_EMAIL before enabling the connection."}</p>
      <p className="strava-policy-note">This notice is an implementation draft. Confirm it against the final Strava app setup and applicable privacy requirements before sharing the app with other riders.</p>
    </article>
  </main>;
}
