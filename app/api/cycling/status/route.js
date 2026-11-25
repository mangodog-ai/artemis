import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError && authError.name !== "AuthSessionMissingError") {
    return NextResponse.json({ error: "Could not verify the signed-in user." }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }
  if (!user) return NextResponse.json({ connected: false }, { headers: { "Cache-Control": "private, no-store" } });
  const { data, error } = await supabase.rpc("get_cycling_strava_connection");
  if (error) return NextResponse.json({ error: "Could not read the Strava connection." }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  return NextResponse.json({ connected: Boolean(data?.length) }, { headers: { "Cache-Control": "private, no-store" } });
}
