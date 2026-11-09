import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../../lib/supabase/api-auth";
import { isSupabaseConfigured } from "../../../../../lib/supabase/config";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";

export async function POST(request, { params }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  const supabase = await createSupabaseServerClient({ writable: true });
  const { user, error: authError } = await getAuthenticatedUser(supabase);
  if (authError) {
    return NextResponse.json({ error: "Authentication could not be verified." }, { status: 503 });
  }
  if (!user) {
    return NextResponse.json({ error: "Sign in to save a fictional result." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { id } = await params;
  const premium = Number(body?.premium_amount);
  const validExpiry = body?.expires_at === "" || body?.expires_at == null ||
    (!Number.isNaN(Date.parse(body.expires_at)) && new Date(body.expires_at).toISOString() >= new Date().toISOString());

  if (
    body?.fictional_data_only !== true ||
    !Number.isFinite(premium) ||
    premium < 0 ||
    !["monthly", "annual"].includes(body.premium_basis) ||
    !validExpiry ||
    typeof body?.source_url !== "string" ||
    body.source_url.length > 2000 ||
    !/^https:\/\//i.test(body.source_url)
  ) {
    return NextResponse.json({ error: "Enter a fictional premium, basis, valid date, and HTTPS source URL." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("quote_results")
    .insert({
      quote_request_id: id,
      result_kind: "simulated_test",
      premium_amount: premium,
      currency: "AUD",
      premium_basis: body.premium_basis,
      expires_at: body.expires_at || null,
      source_url: body.source_url,
    })
    .select("id, result_kind, premium_amount, currency, premium_basis, retrieved_at, expires_at, source_url")
    .single();

  if (error) {
    console.error("Could not save fictional quote result:", error.message);
    return NextResponse.json({ error: "The fictional result could not be saved." }, { status: 500 });
  }
  return NextResponse.json({ result: data }, { status: 201 });
}
