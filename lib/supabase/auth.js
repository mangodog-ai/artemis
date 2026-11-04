import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "./server";
import { isSupabaseConfigured } from "./config";

export async function requireUser() {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=Configuration");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") {
    throw error;
  }

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data: isAdmin, error } = await supabase.rpc("is_artemis_admin");

  if (error) {
    throw error;
  }

  if (!isAdmin) {
    notFound();
  }

  return user;
}
