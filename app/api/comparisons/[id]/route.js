import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/supabase/api-auth";
import { isSupabaseConfigured } from "../../../../lib/supabase/config";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Comparison not found." }, { status: 404 });
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
    return NextResponse.json({ error: "Sign in to view this comparison." }, { status: 401 });
  }

  const { data: comparison, error } = await supabase
    .from("comparisons")
    .select("id, cover_type, cover_amount, age, state, premium_basis, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Could not load comparison:", error.message);
    return NextResponse.json({ error: "Comparison could not be loaded." }, { status: 500 });
  }
  if (!comparison) {
    return NextResponse.json({ error: "Comparison not found." }, { status: 404 });
  }

  const { data: results, error: resultsError } = await supabase
    .from("comparison_results")
    .select("id, provider_name_snapshot, product_name_snapshot, product_summary_snapshot, coverage_summary_snapshot, coverage_source_snapshot, facts_snapshot, premium_amount_snapshot, premium_source_snapshot")
    .eq("comparison_id", id)
    .order("provider_name_snapshot");

  if (resultsError) {
    console.error("Could not load comparison results:", resultsError.message);
    return NextResponse.json({ error: "Comparison results could not be loaded." }, { status: 500 });
  }

  return NextResponse.json({ comparison, results });
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Comparison not found." }, { status: 404 });
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
    return NextResponse.json({ error: "Sign in to delete this comparison." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("comparisons")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Could not delete comparison:", error.message);
    return NextResponse.json({ error: "Comparison could not be deleted." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Comparison not found." }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
