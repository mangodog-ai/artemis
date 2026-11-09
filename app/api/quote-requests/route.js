import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../lib/supabase/api-auth";
import { isSupabaseConfigured } from "../../../lib/supabase/config";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

const STORE_CONSENT_VERSION = "fictional-quote-request-v1";
const MAX_COVER_AMOUNT = 100_000_000;
const COVER_TYPES = ["life", "tpd", "trauma", "income_protection"];
const PREMIUM_BASES = ["monthly", "annual"];
const PROVIDERS = ["TAL", "Budget Direct", "Zurich", "Medibank"];

async function getContext() {
  if (!isSupabaseConfigured()) {
    return { response: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }) };
  }
  const supabase = await createSupabaseServerClient({ writable: true });
  const { user, error } = await getAuthenticatedUser(supabase);
  if (error) {
    return { response: NextResponse.json({ error: "Authentication could not be verified." }, { status: 503 }) };
  }
  if (!user) {
    return { response: NextResponse.json({ error: "Sign in to use the fictional quote lab." }, { status: 401 }) };
  }
  return { supabase, user };
}

export async function GET() {
  const context = await getContext();
  if (context.response) return context.response;

  const { data, error } = await context.supabase
    .from("quote_requests")
    .select("id, provider_name, product_name, cover_type, cover_amount, premium_basis, request_status, status_note, created_at, quote_results(id, result_kind, provider_reference, premium_amount, currency, premium_basis, retrieved_at, expires_at, source_url)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Could not load test quote requests:", error.message);
    return NextResponse.json({ error: "Test quote requests could not be loaded." }, { status: 500 });
  }
  return NextResponse.json({ requests: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  const context = await getContext();
  if (context.response) return context.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const amount = Number(body?.cover_amount);
  if (
    body?.fictional_data_only !== true ||
    body?.consent_to_store !== true ||
    !PROVIDERS.includes(body.provider_name) ||
    typeof body.product_name !== "string" ||
    !body.product_name.trim() ||
    body.product_name.trim().length > 160 ||
    !COVER_TYPES.includes(body.cover_type) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > MAX_COVER_AMOUNT ||
    !PREMIUM_BASES.includes(body.premium_basis)
  ) {
    return NextResponse.json({ error: "Complete the fictional quote request and accept the test-data notice." }, { status: 400 });
  }

  const { data: profile, error: profileError } = await context.supabase
    .from("quote_profiles")
    .select("payload_ciphertext, payload_iv, payload_tag, encryption_key_version")
    .maybeSingle();

  if (profileError) {
    console.error("Could not load encrypted profile snapshot:", profileError.message);
    return NextResponse.json({ error: "The fictional profile could not be loaded." }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ error: "Save a fictional underwriting profile before creating a quote request." }, { status: 400 });
  }

  const { data, error } = await context.supabase
    .from("quote_requests")
    .insert({
      user_id: context.user.id,
      provider_name: body.provider_name,
      product_name: body.product_name.trim(),
      cover_type: body.cover_type,
      cover_amount: amount,
      premium_basis: body.premium_basis,
      request_status: "draft",
      request_payload_ciphertext: profile.payload_ciphertext,
      request_payload_iv: profile.payload_iv,
      request_payload_tag: profile.payload_tag,
      encryption_key_version: profile.encryption_key_version,
      store_consent_version: STORE_CONSENT_VERSION,
      status_note: "Saved for fictional testing. No information was sent to the provider.",
    })
    .select("id, provider_name, product_name, cover_type, cover_amount, premium_basis, request_status, status_note, created_at")
    .single();

  if (error) {
    console.error("Could not save fictional quote request:", error.message);
    return NextResponse.json({ error: "The fictional quote request could not be saved." }, { status: 500 });
  }
  return NextResponse.json({ request: data }, { status: 201 });
}
