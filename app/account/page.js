import Link from "next/link";
import { requireUser } from "../../lib/require-user";
import SignOutButton from "../login/sign-out-button";

export const metadata = {
  title: "Your account — Artemis",
  description: "Your signed-in Artemis account.",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <main className="login-shell">
      <Link className="brand login-brand" href="/" aria-label="Artemis home">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 36 36" fill="none">
            <path d="M18 3.5 30 8v9.3c0 7.3-4.9 12.6-12 15.2C10.9 29.9 6 24.6 6 17.3V8l12-4.5Z" stroke="currentColor" strokeWidth="1.7" />
            <path d="M12 19.4c1.8-3.2 3.8-4.8 6-4.8s4.2 1.6 6 4.8M18 11.2v3.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </span>
        <span>artemis</span>
      </Link>
      <section className="login-card account-card">
        <span className="login-symbol" aria-hidden="true">✳</span>
        <p className="eyebrow">Signed in to Artemis</p>
        <h1>Welcome{user.name ? `, ${user.name}` : ""}.</h1>
        {user.email && <p className="login-copy">{user.email}</p>}
        <p className="login-copy">Your comparison workspace is being prepared.</p>
        <SignOutButton />
        <Link className="back-link" href="/">← Back to home</Link>
      </section>
      <p className="login-footer">Thoughtful cover. Clearer choices.</p>
    </main>
  );
}
