"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AU_STATES, COVER_TYPES } from "../../lib/comparison-validation";

export default function ComparisonForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/comparisons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cover_type: formData.get("cover_type"),
        cover_amount: Number(formData.get("cover_amount")),
        age: Number(formData.get("age")),
        state: formData.get("state"),
        premium_basis: formData.get("premium_basis"),
        privacy_notice_accepted: formData.get("privacy_notice_accepted") === "on",
      }),
    });

    const result = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(result.error ?? "The comparison could not be saved.");
      return;
    }

    router.push(`/comparisons/${result.id}`);
  }

  return (
    <form className="workspace-card comparison-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Type of cover
          <select name="cover_type" defaultValue="life" required>
            {COVER_TYPES.map((type) => (
              <option key={type.code} value={type.code}>{type.name}</option>
            ))}
          </select>
        </label>
        <label>
          Amount of cover (AUD)
          <input name="cover_amount" type="number" min="1" max="100000000" step="1000" required />
        </label>
        <label>
          Age
          <input name="age" type="number" min="18" max="100" step="1" required />
        </label>
        <label>
          State or territory
          <select name="state" defaultValue="" required>
            <option value="" disabled>Select one</option>
            {AU_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
        </label>
        <label>
          Premium basis
          <select name="premium_basis" defaultValue="monthly" required>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </label>
      </div>

      <p className="privacy-notice">
        Your age, state and comparison assumptions will be saved to your private
        comparison history until you delete it. This form does not ask for health,
        smoking or occupation details.
      </p>
      <label className="consent-row">
        <input name="privacy_notice_accepted" type="checkbox" required />
        <span>I understand and agree to save these assumptions with my comparison.</span>
      </label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="primary-button submit-button" type="submit" disabled={pending}>
        {pending ? "Saving comparison…" : "Compare verified products"}
      </button>
      <p className="comparison-disclaimer">
        This is product information, not a live quote, recommendation or personal
        insurance advice. Prices are shown only when supported by a verified
        source with matching assumptions.
      </p>
    </form>
  );
}
