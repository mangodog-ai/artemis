import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import SignInButton from "./sign-in-button";

export const metadata = {
  title: "Log in — Artemis",
  description: "Sign in to Artemis.",
};

const authErrors = {
  AccessDenied: "This account isn't assigned access to Artemis. Contact your administrator.",
  Callback: "Microsoft sign-in couldn't be completed. Please try again or contact your administrator.",
  Configuration: "Microsoft sign-in isn't configured yet. Contact your administrator.",
};

export default async function LoginPage({ searchParams }) {
  const configured = isSupabaseConfigured();
  if (configured) {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error && error.name !== "AuthSessionMissingError") {
      throw error;
    }

    if (user) {
      redirect("/compare");
    }
  }

  const params = await searchParams;
  const error =
    typeof params?.error === "string"
      ? authErrors[params.error] ??
        "Sign-in couldn't be completed. Please try again or contact your administrator."
      : null;
  return (
    <main className="login-shell">
      <Link className="brand login-brand" href="/">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 36 36" fill="none">
            <path d="M18 3.5 30 8v9.3c0 7.3-4.9 12.6-12 15.2C10.9 29.9 6 24.6 6 17.3V8l12-4.5Z" stroke="currentColor" strokeWidth="1.7" />
            <path d="M12 19.4c1.8-3.2 3.8-4.8 6-4.8s4.2 1.6 6 4.8M18 11.2v3.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </span>
        <span>artemis</span>
      </Link>
      <section className="login-card">
        <span className="login-symbol" aria-hidden="true">✳</span>
        <p className="eyebrow">Welcome to Artemis</p>
        <h1>Your clearer view<br />is coming soon.</h1>
        <p className="login-copy">
          Sign in with your invited work account to access Artemis.
        </p>
        {configured ? (
          <SignInButton />
        ) : (
          <p className="auth-notice" role="status">
            Microsoft sign-in is not configured yet. Contact your administrator.
          </p>
        )}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <Link className="back-link" href="/">← Back to home</Link>
      </section>
      <p className="login-footer">Thoughtful cover. Clearer choices.</p>
    </main>
  );
}
