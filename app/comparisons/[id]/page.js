import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "../../../lib/require-user";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { COVER_TYPES } from "../../../lib/comparison-validation";
import ProtectedNav from "../../protected-nav";
import DeleteComparisonButton from "./delete-button";

export const dynamic = "force-dynamic";

const FACT_LABELS = {
  eligibility: "Eligibility",
  exclusions: "Exclusions",
  waiting_period: "Waiting period",
  benefit_period: "Benefit period",
  premium_type: "Premium type",
  indexation: "Indexation",
  renewability: "Renewability",
  claims_conditions: "Claims conditions",
  other: "Other detail",
};

function SourceLink({ source }) {
  if (!source?.url) {
    return null;
  }

  return (
    <a href={source.url} target="_blank" rel="noreferrer">
      {source.title || "View source"} <span aria-hidden="true">↗</span>
    </a>
  );
}

export default async function ComparisonDetailPage({ params }) {
  await requireUser();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: comparison, error } = await supabase
    .from("comparisons")
    .select("id, cover_type, cover_amount, age, state, premium_basis, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!comparison) {
    notFound();
  }

  const { data: results, error: resultError } = await supabase
    .from("comparison_results")
    .select("id, provider_name_snapshot, product_name_snapshot, product_summary_snapshot, coverage_summary_snapshot, coverage_source_snapshot, facts_snapshot, premium_amount_snapshot, premium_source_snapshot")
    .eq("comparison_id", id)
    .order("provider_name_snapshot");

  if (resultError) {
    throw resultError;
  }

  const coverName = COVER_TYPES.find((type) => type.code === comparison.cover_type)?.name ?? comparison.cover_type;

  return (
    <main className="workspace-shell">
      <ProtectedNav />
      <section className="workspace-heading">
        <p className="eyebrow">Saved {new Date(comparison.created_at).toLocaleString("en-AU")}</p>
        <h1>{coverName} comparison.</h1>
        <p>
          ${Number(comparison.cover_amount).toLocaleString("en-AU")} cover · age {comparison.age} · {comparison.state} · {comparison.premium_basis} premium basis
        </p>
      </section>
      <div className="comparison-table-wrap">
        {!results.length ? (
          <section className="workspace-card empty-state">
            <h2>No verified product details match this cover type yet.</h2>
            <p>
              The comparison is saved. Provider information will appear after an
              administrator adds and verifies source material.
            </p>
          </section>
        ) : (
          <table className="comparison-table">
            <thead>
              <tr>
                <th scope="col">Provider / product</th>
                <th scope="col">Cover details</th>
                <th scope="col">Key differences</th>
                <th scope="col">Sourced premium</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id}>
                  <th scope="row">
                    <span className="result-provider">{result.provider_name_snapshot}</span>
                    <span className="result-product">{result.product_name_snapshot}</span>
                    <p className="product-summary">{result.product_summary_snapshot}</p>
                  </th>
                  <td>
                    <p>{result.coverage_summary_snapshot}</p>
                    <SourceLink source={result.coverage_source_snapshot} />
                  </td>
                  <td>
                    {result.facts_snapshot?.length ? (
                      <ul className="fact-list">
                        {result.facts_snapshot.map((fact, index) => (
                          <li key={`${fact.key}-${index}`}>
                            <b>{FACT_LABELS[fact.key] ?? fact.key}</b>
                            <span>{fact.value}</span>
                            <SourceLink source={fact.source} />
                          </li>
                        ))}
                      </ul>
                    ) : <span className="muted-copy">No additional sourced details</span>}
                  </td>
                  <td>
                    {result.premium_amount_snapshot == null ? (
                      <span className="muted-copy">No exact sourced match</span>
                    ) : (
                      <>
                        <b>${Number(result.premium_amount_snapshot).toFixed(2)} AUD</b>
                        <span className="result-product">{comparison.premium_basis}</span>
                        <SourceLink source={result.premium_source_snapshot} />
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="comparison-disclaimer">
        Product information reflects the sources and dates shown. A sourced
        premium is not an insurer quote unless the cited source explicitly says
        so. No recommendation or personal advice is provided.
      </p>
      <div className="detail-actions">
        <Link className="account-link" href="/comparisons">← Saved comparisons</Link>
        <DeleteComparisonButton comparisonId={id} />
      </div>
    </main>
  );
}
