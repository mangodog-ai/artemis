import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../lib/supabase/api-auth";
import { isSupabaseConfigured } from "../../../lib/supabase/config";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import {
  decryptUnderwritingPayload,
  encryptUnderwritingPayload,
} from "../../../lib/underwriting-encryption";

const CONSENT_VERSION = "fictional-quote-profile-v1";
const MAX_PAYLOAD_BYTES = 24_000;

function validPayload(payload) {
  const birthDate = typeof payload?.date_of_birth === "string"
    ? new Date(payload.date_of_birth + "T00:00:00Z")
    : null;
  const validBirthDate = birthDate &&
    !Number.isNaN(birthDate.valueOf()) &&
    birthDate.toISOString().slice(0, 10) === payload.date_of_birth &&
    birthDate <= new Date();

  return payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    validBirthDate &&
    typeof payload.state === "string" &&
    ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"].includes(payload.state) &&
    typeof payload.smoking_status === "string" &&
    ["never", "former", "current", "unknown"].includes(payload.smoking_status) &&
    typeof payload.occupation === "string" &&
    payload.occupation.length <= 120 &&
    typeof payload.annual_income_band === "string" &&
    payload.annual_income_band.length <= 40 &&
    payload.health_answers &&
    typeof payload.health_answers === "object" &&
    !Array.isArray(payload.health_answers);
}

async function getUserAndClient() {
  if (!isSupabaseConfigured()) {
    return { response: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }) };
  }

  const supabase = await createSupabaseServerClient({ writable: true });
  const { user, error } = await getAuthenticatedUser(supabase);
  if (error) {
    return { response: NextResponse.json({ error: "Authentication could not be verified." }, { status: 503 }) };
  }
  if (!user) {
    return { response: NextResponse.json({ error: "Sign in to manage your test profile." }, { status: 401 }) };
  }
  return { supabase, user };
}

export async function GET() {
  const context = await getUserAndClient();
  if (context.response) return context.response;

  const { data, error } = await context.supabase
    .from("quote_profiles")
    .select("id, schema_version, payload_ciphertext, payload_iv, payload_tag, encryption_key_version, consent_version, consented_at, updated_at")
    .maybeSingle();

  if (error) {
    console.error("Could not load encrypted test profile:", error.message);
    return NextResponse.json({ error: "The test profile could not be loaded." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ profile: null }, { headers: { "Cache-Control": "no-store" } });

  try {
    const payload = decryptUnderwritingPayload({
      ciphertext: data.payload_ciphertext,
      iv: data.payload_iv,
      tag: data.payload_tag,
    });
    return NextResponse.json({
      profile: {
        id: data.id,
        payload,
        consentVersion: data.consent_version,
        consentedAt: data.consented_at,
        updatedAt: data.updated_at,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not decrypt test profile.");
    return NextResponse.json({ error: "The test profile could not be decrypted. Check the server key configuration." }, { status: 503 });
  }
}

export async function PUT(request) {
  const context = await getUserAndClient();
  if (context.response) return context.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (
    body?.fictional_data_only !== true ||
    body?.consent_to_store !== true ||
    !validPayload(body.payload) ||
    Buffer.byteLength(JSON.stringify(body.payload), "utf8") > MAX_PAYLOAD_BYTES
  ) {
    return NextResponse.json({ error: "Complete the fictional profile and accept the test-data notice." }, { status: 400 });
  }

  let encrypted;
  try {
    encrypted = encryptUnderwritingPayload(body.payload);
  } catch (error) {
    console.error("Underwriting encryption is unavailable.");
    return NextResponse.json({ error: "Secure profile storage is not configured for this environment." }, { status: 503 });
  }

  const { data, error } = await context.supabase
    .from("quote_profiles")
    .upsert({
      user_id: context.user.id,
      schema_version: 1,
      payload_ciphertext: encrypted.ciphertext,
      payload_iv: encrypted.iv,
      payload_tag: encrypted.tag,
      encryption_key_version: encrypted.keyVersion,
      consent_version: CONSENT_VERSION,
      consented_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select("id, updated_at")
    .single();

  if (error) {
    console.error("Could not save encrypted test profile:", error.message);
    return NextResponse.json({ error: "The test profile could not be saved." }, { status: 500 });
  }
  return NextResponse.json({ id: data.id, updatedAt: data.updated_at });
}

export async function DELETE() {
  const context = await getUserAndClient();
  if (context.response) return context.response;

  const { error } = await context.supabase
    .from("quote_profiles")
    .delete()
    .eq("user_id", context.user.id);

  if (error) {
    console.error("Could not delete encrypted test profile:", error.message);
    return NextResponse.json({ error: "The test profile could not be deleted." }, { status: 500 });
  }
  return NextResponse.json({ deleted: true });
}
