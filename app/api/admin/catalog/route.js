import { NextResponse } from "next/server";
import { parseCatalogEntry } from "../../../../lib/comparison-validation";
import { getAuthenticatedUser } from "../../../../lib/supabase/api-auth";
import { isSupabaseConfigured } from "../../../../lib/supabase/config";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

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

  const entry = parseCatalogEntry(body);
  if (!entry) {
    return NextResponse.json({ error: "Check the catalog fields and try again." }, { status: 400 });
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
    return NextResponse.json({ error: "Sign in to manage provider data." }, { status: 401 });
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_artemis_admin");
  if (adminError) {
    console.error("Could not verify catalog administrator access:", adminError.message);
    return NextResponse.json({ error: "Administrator access could not be verified." }, { status: 503 });
  }
  if (!isAdmin) {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  }

  const { data: sourceId, error } = await supabase.rpc("admin_create_catalog_entry", {
    p_provider_name: entry.provider_name,
    p_provider_website_url: entry.provider_website_url,
    p_product_name: entry.product_name,
    p_product_summary: entry.product_summary,
    p_cover_type: entry.cover_type,
    p_coverage_summary: entry.coverage_summary,
    p_source_url: entry.source_url,
    p_source_title: entry.source_title,
    p_effective_from: entry.effective_from,
    p_effective_to: entry.effective_to,
    p_facts: entry.facts,
    p_premium: entry.premium,
  });

  if (error) {
    console.error("Could not save provider catalog entry:", error.message);
    return NextResponse.json({ error: "The source-backed entry could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ source_id: sourceId }, { status: 201 });
}
