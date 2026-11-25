import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import { isStravaConfigured, getStravaConfig, stravaOAuthUrl } from "../../../../lib/cycling/strava";

export async function POST(request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const form = await request.formData();
  if (form.get("consent") !== "cycling-strava-v1") {
    return NextResponse.redirect(new URL("/cycling/connect?error=consent", request.url), 303);
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/cycling/connect", request.url), 303);

  try {
    getStravaConfig();
  } catch {
    return NextResponse.redirect(new URL("/cycling/connect?error=configuration", request.url), 303);
  }
  if (!process.env.STRAVA_SUPPORT_EMAIL || !isStravaConfigured()) {
    return NextResponse.redirect(new URL("/cycling/connect?error=configuration", request.url), 303);
  }
  const { data: webhookReady, error: webhookError } = await supabase.rpc("check_cycling_strava_webhook_config", {
    p_webhook_secret: process.env.STRAVA_WEBHOOK_DB_SECRET,
  });
  if (webhookError || !webhookReady) {
    return NextResponse.redirect(new URL("/cycling/connect?error=configuration", request.url), 303);
  }

  const state = randomBytes(32).toString("hex");
  const response = NextResponse.redirect(stravaOAuthUrl(state), 303);
  response.cookies.set("strava_oauth_state", state, {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/api/strava/callback",
    maxAge: 600,
  });
  response.cookies.set("strava_oauth_consent", "cycling-strava-v1", {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/api/strava/callback",
    maxAge: 600,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
