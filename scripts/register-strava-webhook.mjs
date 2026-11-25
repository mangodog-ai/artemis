const required = [
  "STRAVA_CLIENT_ID",
  "STRAVA_CLIENT_SECRET",
  "STRAVA_WEBHOOK_CALLBACK_URL",
  "STRAVA_WEBHOOK_VERIFY_TOKEN",
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing environment values: ${missing.join(", ")}`);
  process.exitCode = 1;
} else {
  const body = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    callback_url: process.env.STRAVA_WEBHOOK_CALLBACK_URL,
    verify_token: process.env.STRAVA_WEBHOOK_VERIFY_TOKEN,
  });
  const response = await fetch("https://www.strava.com/api/v3/push_subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    console.error(`Strava webhook subscription could not be created (HTTP ${response.status}). Check whether this app already has a subscription.`);
    process.exitCode = 1;
  } else {
    console.log(`Webhook subscription created: ${result.id}`);
    console.log("Set STRAVA_WEBHOOK_SUBSCRIPTION_ID to that value in the server environment.");
  }
}
