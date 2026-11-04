"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AU_STATES, COVER_TYPES, FACT_KEYS, PREMIUM_BASES } from "../../../lib/comparison-validation";

function parseFacts(value) {
  const lines = value.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.map((line) => {
    const separator = line.indexOf("=");
    if (separator < 1) {
      return { key: "", value: "" };
    }
    return {
      key: line.slice(0, separator).trim(),
      value: line.slice(separator + 1).trim(),
    };
  });
}

export default function CatalogEntryForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [savedSourceId, setSavedSourceId] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSavedSourceId("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const premiumEnabled = data.get("include_premium") === "on";
    const body = {
      provider_name: data.get("provider_name"),
      provider_website_url: data.get("provider_website_url"),
      product_name: data.get("product_name"),
      product_summary: data.get("product_summary"),
      cover_type: data.get("cover_type"),
      coverage_summary: data.get("coverage_summary"),
      source_url: data.get("source_url"),
      source_title: data.get("source_title"),
      effective_from: data.get("effective_from") || null,
      effective_to: data.get("effective_to") || null,
      facts: parseFacts(String(data.get("facts") ?? "")),
      premium: premiumEnabled
        ? {
            cover_amount: Number(data.get("premium_cover_amount")),
            age: Number(data.get("premium_age")),
            state: data.get("premium_state"),
            premium_basis: data.get("premium_basis"),
            premium_amount: Number(data.get("premium_amount")),
          }
        : null,
    };

    const response = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(result.error ?? "The catalog entry could not be saved.");
      return;
    }

    setSavedSourceId(result.source_id);
    form.reset();
    router.refresh();
  }

  return (
    <form className="workspace-card catalog-form" onSubmit={handleSubmit}>
      <h2>Add source-backed product details</h2>
      <div className="form-grid">
        <label>Provider name<input name="provider_name" required maxLength={120} placeholder="e.g. TAL" /></label>
        <label>Provider website (optional)<input name="provider_website_url" type="url" placeholder="https://" /></label>
        <label>Product name<input name="product_name" required maxLength={160} /></label>
        <label>Cover type
          <select name="cover_type" defaultValue="life" required>
            {COVER_TYPES.map((type) => <option key={type.code} value={type.code}>{type.name}</option>)}
          </select>
        </label>
        <label className="form-wide">Product summary<textarea name="product_summary" maxLength={1000} required rows={2} /></label>
        <label className="form-wide">Cover details for this cover type<textarea name="coverage_summary" maxLength={2000} required rows={3} /></label>
        <label>Source title<input name="source_title" maxLength={240} required /></label>
        <label>Source URL<input name="source_url" type="url" placeholder="https://" required /></label>
        <label>Effective from (optional)<input name="effective_from" type="date" /></label>
        <label>Effective to (optional)<input name="effective_to" type="date" /></label>
        <label className="form-wide">
          Key facts (one per line as <code>key=value</code>)
          <textarea name="facts" rows={5} placeholder="eligibility=...&#10;exclusions=...&#10;waiting_period=..." />
          <small>Allowed keys: {FACT_KEYS.join(", ")}</small>
        </label>
      </div>
      <details className="premium-entry">
        <summary>Add an explicitly sourced premium example (optional)</summary>
        <p className="muted-copy">This is stored as a source example, not calculated. It is shown only for an exact match on all assumptions.</p>
        <label className="consent-row">
          <input name="include_premium" type="checkbox" />
          <span>Include a premium value from the cited source</span>
        </label>
        <div className="form-grid">
          <label>Cover amount (AUD)<input name="premium_cover_amount" type="number" min="1" step="1000" /></label>
          <label>Age<input name="premium_age" type="number" min="18" max="100" /></label>
          <label>State
            <select name="premium_state" defaultValue="">
              <option value="" disabled>Select one</option>
              {AU_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
          </label>
          <label>Premium basis
            <select name="premium_basis" defaultValue="monthly">
              {PREMIUM_BASES.map((basis) => <option key={basis} value={basis}>{basis}</option>)}
            </select>
          </label>
          <label>Premium amount (AUD)<input name="premium_amount" type="number" min="0" step="0.01" /></label>
        </div>
      </details>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {savedSourceId && (
        <div className="draft-confirmation" role="status">
          Draft saved. Review the source and verify it below before it appears in comparisons.
          <VerifySourceButton sourceId={savedSourceId} onVerified={() => setSavedSourceId("")} />
        </div>
      )}
      <button className="primary-button submit-button" type="submit" disabled={pending}>
        {pending ? "Saving source…" : "Save as draft"}
      </button>
    </form>
  );
}

function VerifySourceButton({ sourceId, onVerified }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleVerify() {
    setPending(true);
    setError("");
    const response = await fetch(`/api/admin/catalog/${sourceId}`, { method: "POST" });
    const result = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(result.error ?? "The source could not be verified.");
      return;
    }

    onVerified?.();
    window.location.reload();
  }

  return (
    <span>
      <button className="text-button verify-button" type="button" onClick={handleVerify} disabled={pending}>
        {pending ? "Verifying…" : "Verify source"}
      </button>
      {error && <span className="auth-error" role="alert">{error}</span>}
    </span>
  );
}
