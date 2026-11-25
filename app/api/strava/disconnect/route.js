import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import { openStravaTokens, revokeStravaToken } from "../../../../lib/cycling/strava";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError && authError.name !== "AuthSessionMissingError") return NextResponse.json({ error: "Could not verify the signed-in user." }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Sign in before disconnecting Strava." }, { status: 401 });

  const { data: rows, error: readError } = await supabase.rpc("get_cycling_strava_connection");
  if (readError) return NextResponse.json({ error: "Could not read the Strava connection." }, { status: 500 });
  let providerRevoked = true;
  if (rows?.[0]) {
    try {
      const tokens = openStravaTokens(rows[0]);
      await revokeStravaToken(tokens.refresh_token);
    } catch (error) {
      console.error("Strava revoke request failed:", error.message);
      providerRevoked = false;
    }
  }

  const { error: deleteError } = await supabase.rpc("delete_cycling_strava_connection");
  if (deleteError) return NextResponse.json({ error: "Could not delete the stored Strava connection." }, { status: 500 });
  return NextResponse.json({ connected: false, providerRevoked }, { headers: { "Cache-Control": "private, no-store" } });
}
