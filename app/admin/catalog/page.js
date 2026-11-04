import Link from "next/link";
import { requireAdmin } from "../../../lib/require-user";
import { COVER_TYPES, FACT_KEYS } from "../../../lib/comparison-validation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import ProtectedNav from "../../protected-nav";
import CatalogEntryForm from "./catalog-entry-form";
import VerifySourceButton from "./verify-source-button";

export const metadata = {
  title: "Provider data — Artemis",
  description: "Add and verify source-backed provider information.",
};

export const dynamic = "force-dynamic";

export default async function CatalogAdminPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data: sources, error } = await supabase
    .from("source_records")
    .select("id, title, source_url, captured_at, effective_from, providers(name), product_coverages(cover_type, products(name))")
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return (
    <main className="workspace-shell">
      <ProtectedNav />
      <section className="workspace-heading">
        <p className="eyebrow">Administrator workspace</p>
        <h1>Provider data.</h1>
        <p>Add product information with its source. New entries remain hidden until an administrator verifies the source.</p>
      </section>
      <CatalogEntryForm />
      <section className="admin-source-section">
        <h2>Draft sources to verify</h2>
        {!sources.length ? (
          <p className="muted-copy">There are no draft sources to review.</p>
        ) : (
          <ul className="admin-source-list">
            {sources.map((source) => {
              const coverage = source.product_coverages?.[0];
              return (
                <li className="workspace-card" key={source.id}>
                  <div>
                    <b>{coverage?.products?.name ?? "Product"}</b>
                    <span>{source.providers?.name} · {COVER_TYPES.find((type) => type.code === coverage?.cover_type)?.name ?? coverage?.cover_type}</span>
                    <a href={source.source_url} target="_blank" rel="noreferrer">{source.title} ↗</a>
                    <small>Captured {new Date(source.captured_at).toLocaleDateString("en-AU")}{source.effective_from ? ` · Effective ${source.effective_from}` : ""}</small>
                  </div>
                  <VerifySourceButton sourceId={source.id} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <p className="comparison-disclaimer">
        Only enter details supported by an authorized, current source. Add the
        exact source assumptions for any price; the comparison does not generate
        or estimate premiums.
      </p>
      <Link className="account-link" href="/account">← Account</Link>
    </main>
  );
}
