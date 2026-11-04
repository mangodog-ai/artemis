import { NextResponse } from "next/server";
import { parseComparisonInput } from "../../../lib/comparison-validation";
import { getAuthenticatedUser } from "../../../lib/supabase/api-auth";
import { isSupabaseConfigured } from "../../../lib/supabase/config";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

const PRIVACY_NOTICE_VERSION = "comparison-v1";

export async function GET() {
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
    return NextResponse.json({ error: "Sign in to view saved comparisons." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("comparisons")
    .select("id, cover_type, cover_amount, age, state, premium_basis, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Could not load comparison history:", error.message);
    return NextResponse.json({ error: "Saved comparisons could not be loaded." }, { status: 500 });
  }

  return NextResponse.json({ comparisons: data });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    throw error;
  }

  const input = parseComparisonInput(body);
  if (!input || body.privacy_notice_accepted !== true) {
    return NextResponse.json(
      { error: "Complete the comparison fields and accept the privacy notice." },
      { status: 400 },
    );
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
    return NextResponse.json({ error: "Sign in to save a comparison." }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("save_comparison", {
    p_cover_type: input.cover_type,
    p_cover_amount: input.cover_amount,
    p_age: input.age,
    p_state: input.state,
    p_premium_basis: input.premium_basis,
    p_privacy_notice_version: PRIVACY_NOTICE_VERSION,
  });

  if (error) {
    console.error("Could not save comparison:", error.message);
    return NextResponse.json({ error: "The comparison could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ id: data }, { status: 201 });
}
