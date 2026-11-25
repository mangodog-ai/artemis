import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import { exchangeStravaCode, revokeStravaToken, sealStravaTokens, tokenPayload } from "../../../../lib/cycling/strava";

function finish(request, destination) {
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set("strava_oauth_state", "", { path: "/api/strava/callback", maxAge: 0 });
  response.cookies.set("strava_oauth_consent", "", { path: "/api/strava/callback", maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const cookieState = request.cookies.get("strava_oauth_state")?.value;
  const consent = request.cookies.get("strava_oauth_consent")?.value;
  if (!state || !cookieState || state !== cookieState || consent !== "cycling-strava-v1") return finish(request, "/cycling/connect?error=state");
  if (url.searchParams.get("error")) return finish(request, "/cycling/connect?error=denied");
  if (!code) return finish(request, "/cycling/connect?error=callback");

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return finish(request, "/login?next=/cycling/connect");

  let tokens;
  try {
    tokens = await exchangeStravaCode(code);
    const scopes = String(tokens.scope || "").split(/[\s,]+/).filter(Boolean);
    if (!scopes.includes("activity:read_all")) {
      if (tokens.refresh_token) await revokeStravaToken(tokens.refresh_token).catch(() => {});
      return finish(request, "/cycling/connect?error=scope");
    }
    const athleteId = tokens.athlete?.id_str || tokens.athlete?.id;
    if (!athleteId) return finish(request, "/cycling/connect?error=callback");
    const sealed = sealStravaTokens(tokenPayload(tokens));
    const { error } = await supabase.rpc("upsert_cycling_strava_connection", {
      p_athlete_id: String(athleteId),
      p_token_ciphertext: sealed.token_ciphertext,
      p_token_iv: sealed.token_iv,
      p_token_tag: sealed.token_tag,
      p_granted_scope: scopes.join(" "),
      p_token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
      p_consent_version: "cycling-strava-v1",
      p_consented_at: new Date().toISOString(),
    });
    if (error) throw new Error("Storage unavailable");
    return finish(request, "/cycling?strava=connected");
  } catch (error) {
    if (tokens?.refresh_token) await revokeStravaToken(tokens.refresh_token).catch(() => {});
    console.error("Strava connection failed:", error.message);
    return finish(request, "/cycling/connect?error=connection");
  }
}
