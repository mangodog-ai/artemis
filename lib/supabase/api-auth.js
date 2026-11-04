export async function getAuthenticatedUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") {
    return { user: null, error };
  }

  return { user, error: null };
}
