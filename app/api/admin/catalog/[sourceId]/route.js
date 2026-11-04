import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../../lib/supabase/api-auth";
import { isSupabaseConfigured } from "../../../../../lib/supabase/config";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(_request, { params }) {
  const { sourceId } = await params;
  if (!UUID_PATTERN.test(sourceId)) {
    return NextResponse.json({ error: "Source record not found." }, { status: 404 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured for this deployment." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient({ writable: true });
  const { user, error: authError } = await getAuthenticatedUser(supabase);
  if (authError) {
    console.error("Could not verify Supabase session:", authError.message);
    return NextResponse.json({ error: "Authentication could not be verified." }, { status: 503 });
  }
  if (!user) {
    return NextResponse.json({ error: "Sign in to verify provider data." }, { status: 401 });
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_artemis_admin");
  if (adminError) {
    console.error("Could not verify catalog administrator access:", adminError.message);
    return NextResponse.json({ error: "Administrator access could not be verified." }, { status: 503 });
  }
  if (!isAdmin) {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  }

  const { error } = await supabase.rpc("admin_verify_source", {
    p_source_id: sourceId,
  });
  if (error) {
    console.error("Could not verify source record:", error.message);
    return NextResponse.json({ error: "The source record could not be verified." }, { status: 500 });
  }

  return NextResponse.json({ verified: true });
}
