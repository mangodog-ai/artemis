import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/supabase/api-auth";
import { isSupabaseConfigured } from "../../../../lib/supabase/config";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export async function DELETE(_request, { params }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  const supabase = await createSupabaseServerClient({ writable: true });
  const { user, error } = await getAuthenticatedUser(supabase);
  if (error) {
    return NextResponse.json({ error: "Authentication could not be verified." }, { status: 503 });
  }
  if (!user) {
    return NextResponse.json({ error: "Sign in to delete a fictional request." }, { status: 401 });
  }

  const { id } = await params;
  const { error: deleteError } = await supabase
    .from("quote_requests")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Could not delete fictional quote request:", deleteError.message);
    return NextResponse.json({ error: "The fictional request could not be deleted." }, { status: 500 });
  }
  return NextResponse.json({ deleted: true });
}
