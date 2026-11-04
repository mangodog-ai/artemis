"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

export default function SignInButton() {
  const [error, setError] = useState("");

  async function handleSignIn() {
    setError("");

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "email",
        redirectTo: `${window.location.origin}/auth/callback?next=/compare`,
      },
    });

    if (signInError) {
      setError("Microsoft sign-in could not be started. Please try again.");
      console.error("Supabase Azure sign-in failed:", signInError.message);
    }
  }

  return (
    <>
      <button className="microsoft-button" type="button" onClick={handleSignIn}>
        <span className="microsoft-mark" aria-hidden="true">
          <i /><i /><i /><i />
        </span>
        Continue with Microsoft
      </button>
      {error && <p className="auth-error" role="alert">{error}</p>}
    </>
  );
}
