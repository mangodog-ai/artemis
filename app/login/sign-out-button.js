"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

export default function SignOutButton() {
  const [error, setError] = useState("");

  async function handleSignOut() {
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError("Sign-out failed. Please try again.");
      console.error("Supabase sign-out failed:", signOutError.message);
      return;
    }

    window.location.assign("/");
  }

  return (
    <>
      <button
        className="microsoft-button sign-out-button"
        type="button"
        onClick={handleSignOut}
      >
        Sign out
      </button>
      {error && <p className="auth-error" role="alert">{error}</p>}
    </>
  );
}
