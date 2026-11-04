import Link from "next/link";
import { requireUser } from "../../lib/require-user";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { COVER_TYPES } from "../../lib/comparison-validation";
import ProtectedNav from "../protected-nav";

export const metadata = {
  title: "Saved comparisons — Artemis",
  description: "Your private saved cover comparisons.",
};

export const dynamic = "force-dynamic";

export default async function ComparisonsPage() {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data: comparisons, error } = await supabase
    .from("comparisons")
    .select("id, cover_type, cover_amount, age, state, premium_basis, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return (
    <main className="workspace-shell">
      <ProtectedNav />
      <section className="workspace-heading">
        <p className="eyebrow">Your account</p>
        <h1>Saved comparisons.</h1>
        <p>Only you can see your saved comparison history.</p>
      </section>
      {!comparisons.length ? (
        <section className="workspace-card empty-state">
          <h2>No comparisons saved yet.</h2>
          <p>Start with a cover type and a few assumptions.</p>
          <Link className="primary-button" href="/compare">Start a comparison <span aria-hidden="true">↗</span></Link>
        </section>
      ) : (
        <div className="history-list">
          {comparisons.map((comparison) => {
            const coverName = COVER_TYPES.find((type) => type.code === comparison.cover_type)?.name ?? comparison.cover_type;
            return (
              <Link className="workspace-card history-card" href={`/comparisons/${comparison.id}`} key={comparison.id}>
                <span>
                  <b>{coverName}</b>
                  <small>${Number(comparison.cover_amount).toLocaleString("en-AU")} cover · age {comparison.age} · {comparison.state}</small>
                </span>
                <span className="history-date">
                  {new Date(comparison.created_at).toLocaleDateString("en-AU")}
                  <i aria-hidden="true">↗</i>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
