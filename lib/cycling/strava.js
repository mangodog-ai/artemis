import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const TOKEN_URL = "https://www.strava.com/oauth/token";
const ENCRYPTION_KEY_ENV = "STRAVA_TOKEN_ENCRYPTION_KEY";

function stravaApiBase() {
  const changeDate = Date.UTC(2027, 0, 4);
  return Date.now() >= changeDate ? "https://api-v3.strava.com" : "https://www.strava.com/api/v3";
}

export function getStravaConfig() {
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REDIRECT_URI, [ENCRYPTION_KEY_ENV]: encodedKey } = process.env;
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REDIRECT_URI || !encodedKey) {
    throw new Error("Strava is not configured. Set the Strava app credentials, redirect URI, and token encryption key.");
  }
  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32) throw new Error(`${ENCRYPTION_KEY_ENV} must be a base64 encoded 32-byte key.`);
  return { clientId: STRAVA_CLIENT_ID, clientSecret: STRAVA_CLIENT_SECRET, redirectUri: STRAVA_REDIRECT_URI, key };
}

export function sealStravaTokens(tokens) {
  const { key } = getStravaConfig();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(tokens), "utf8"), cipher.final()]);
  return {
    token_ciphertext: ciphertext.toString("base64"),
    token_iv: iv.toString("base64"),
    token_tag: cipher.getAuthTag().toString("base64"),
  };
}

export function openStravaTokens(row) {
  const { key } = getStravaConfig();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(row.token_iv, "base64"));
  decipher.setAuthTag(Buffer.from(row.token_tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(row.token_ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
  return JSON.parse(plaintext);
}

async function tokenRequest(fields) {
  const { clientId, clientSecret } = getStravaConfig();
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...fields });
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.access_token) {
    throw new Error("Strava could not complete token exchange.");
  }
  return result;
}

export function exchangeStravaCode(code) {
  return tokenRequest({ code, grant_type: "authorization_code" });
}

export async function getFreshStravaAccessToken(supabase) {
  const { data: rows, error } = await supabase.rpc("get_cycling_strava_connection");
  if (error) throw new Error("Could not read the Strava connection.");
  const row = rows?.[0];
  if (!row) return null;

  const tokens = openStravaTokens(row);
  if (tokens.expires_at > Math.floor(Date.now() / 1000) + 60) return { row, tokens };

  const refreshed = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: tokens.refresh_token,
  });
  const nextTokens = { ...refreshed, scope: refreshed.scope || tokens.scope };
  const sealed = sealStravaTokens(nextTokens);
  const { error: saveError } = await supabase.rpc("upsert_cycling_strava_connection", {
    p_athlete_id: row.athlete_id,
    p_token_ciphertext: sealed.token_ciphertext,
    p_token_iv: sealed.token_iv,
    p_token_tag: sealed.token_tag,
    p_granted_scope: nextTokens.scope || "",
    p_token_expires_at: new Date(nextTokens.expires_at * 1000).toISOString(),
    p_consent_version: row.consent_version,
    p_consented_at: row.consented_at,
  });
  if (saveError) throw new Error("Could not update the encrypted Strava connection.");
  return { row, tokens: nextTokens };
}

export async function fetchRecentCyclingActivities(accessToken) {
  const after = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
  const activities = [];
  let page = 1;
  let truncated = false;

  while (page <= 5) {
    const url = new URL(`${stravaApiBase()}/athlete/activities`);
    url.searchParams.set("after", String(after));
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", "200");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (response.status === 429) throw new Error("Strava rate limit reached. Try refreshing later.");
    if (!response.ok) throw new Error("Could not fetch activities from Strava.");
    const pageActivities = await response.json();
    if (!Array.isArray(pageActivities)) throw new Error("Strava returned an unexpected activity response.");
    activities.push(...pageActivities.filter((activity) => isCyclingActivity(activity.sport_type || activity.type)));
    if (pageActivities.length < 200) return { activities, truncated: false };
    page += 1;
  }
  truncated = true;
  return { activities, truncated };
}

function isCyclingActivity(sportType) {
  return typeof sportType === "string" && /ride|cycling|velomobile/i.test(sportType);
}

export function normalizeCyclingActivity(activity) {
  return {
    id: String(activity.id_str || activity.id),
    name: activity.name || "Ride",
    sportType: activity.sport_type || activity.type || "Ride",
    distanceKm: Math.round((Number(activity.distance) || 0) / 10) / 100,
    movingSeconds: Number(activity.moving_time) || 0,
    elevationMetres: Math.round(Number(activity.total_elevation_gain) || 0),
    startDate: activity.start_date,
    startDateLocal: activity.start_date_local || activity.start_date,
  };
}

export async function revokeStravaToken(refreshToken) {
  const { clientId, clientSecret } = getStravaConfig();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://www.strava.com/oauth/revoke", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ token: refreshToken, token_type_hint: "refresh_token" }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Could not revoke Strava authorization.");
}

export function tokenPayload(tokens) {
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expires_at,
    scope: tokens.scope || "",
  };
}

export function isStravaConfigured() {
  try {
    getStravaConfig();
    return Boolean(
      process.env.STRAVA_SUPPORT_EMAIL &&
      process.env.STRAVA_WEBHOOK_CALLBACK_URL &&
      process.env.STRAVA_WEBHOOK_PATH_SECRET &&
      process.env.STRAVA_WEBHOOK_VERIFY_TOKEN &&
      process.env.STRAVA_WEBHOOK_SUBSCRIPTION_ID &&
      process.env.STRAVA_WEBHOOK_DB_SECRET,
    );
  } catch {
    return false;
  }
}

export function stravaOAuthUrl(state) {
  const { clientId, redirectUri } = getStravaConfig();
  const url = new URL("https://www.strava.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("scope", "activity:read_all");
  url.searchParams.set("state", state);
  return url;
}
