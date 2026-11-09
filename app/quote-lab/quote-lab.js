"use client";

import { useEffect, useState } from "react";

const emptyProfile = {
  date_of_birth: "",
  state: "",
  smoking_status: "never",
  occupation: "",
  annual_income_band: "",
  health_answers: {},
};

const providers = ["TAL", "Budget Direct", "Zurich", "Medibank"];
const coverTypes = [
  ["life", "Life cover"],
  ["tpd", "Total and permanent disability"],
  ["trauma", "Trauma / critical illness"],
  ["income_protection", "Income protection"],
];

export default function QuoteLab() {
  const [profile, setProfile] = useState(emptyProfile);
  const [healthJson, setHealthJson] = useState("{}");
  const [requests, setRequests] = useState([]);
  const [savedProfile, setSavedProfile] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    const [profileResponse, requestResponse] = await Promise.all([
      fetch("/api/quote-profile", { cache: "no-store" }),
      fetch("/api/quote-requests", { cache: "no-store" }),
    ]);
    const profileBody = await profileResponse.json();
    const requestBody = await requestResponse.json();
    if (!profileResponse.ok || !requestResponse.ok) {
      throw new Error(profileBody.error ?? requestBody.error ?? "Test data could not be loaded.");
    }
    if (profileBody.profile?.payload) {
      const payload = profileBody.profile.payload;
      setProfile({ ...emptyProfile, ...payload });
      setHealthJson(JSON.stringify(payload.health_answers ?? {}, null, 2));
      setSavedProfile(true);
      setConsent(true);
    }
    setRequests(requestBody.requests ?? []);
  }

  useEffect(() => {
    loadData().catch((loadError) => setError(loadError.message));
  }, []);

  async function sendJson(url, method, body) {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "The request failed.");
    return result;
  }

  async function saveProfile(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const healthAnswers = JSON.parse(healthJson);
      if (!healthAnswers || Array.isArray(healthAnswers) || typeof healthAnswers !== "object") {
        throw new Error("Underwriting answers must be a JSON object.");
      }
      await sendJson("/api/quote-profile", "PUT", {
        fictional_data_only: true,
        consent_to_store: consent,
        payload: { ...profile, health_answers: healthAnswers },
      });
      setSavedProfile(true);
      setMessage("Fictional profile saved encrypted in Supabase.");
    } catch (saveError) {
      setError(saveError instanceof SyntaxError ? "Underwriting answers must be valid JSON." : saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function createRequest(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(formElement);
    try {
      await sendJson("/api/quote-requests", "POST", {
        provider_name: form.get("provider_name"),
        product_name: form.get("product_name"),
        cover_type: form.get("cover_type"),
        cover_amount: Number(form.get("cover_amount")),
        premium_basis: form.get("premium_basis"),
        consent_to_store: form.get("consent_to_store") === "on",
        fictional_data_only: form.get("fictional_data_only") === "on",
      });
      formElement.reset();
      await loadData();
      setMessage("Draft saved. It has not been sent to the provider.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function addSimulatedResult(event, requestId) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(formElement);
    try {
      await sendJson("/api/quote-requests/" + requestId + "/results", "POST", {
        premium_amount: Number(form.get("premium_amount")),
        premium_basis: form.get("premium_basis"),
        expires_at: form.get("expires_at"),
        source_url: form.get("source_url"),
        fictional_data_only: form.get("fictional_data_only") === "on",
      });
      formElement.reset();
      await loadData();
      setMessage("Simulated result saved. It is clearly marked as test data.");
    } catch (resultError) {
      setError(resultError.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteProfile() {
    if (!window.confirm("Delete the saved fictional underwriting profile?")) return;
    setBusy(true);
    setError("");
    try {
      await sendJson("/api/quote-profile", "DELETE");
      setProfile(emptyProfile);
      setHealthJson("{}");
      setSavedProfile(false);
      setConsent(false);
      setMessage("Fictional profile deleted.");
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteRequest(requestId) {
    if (!window.confirm("Delete this fictional quote request and its simulated results?")) return;
    setBusy(true);
    setError("");
    try {
      await sendJson("/api/quote-requests/" + requestId, "DELETE");
      await loadData();
      setMessage("Fictional request and its results deleted.");
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="quote-lab">
      <aside className="test-data-banner">
        <b>Fictional data only</b>
        <span>This test page stores encrypted sample underwriting answers and simulated quote results. It does not contact insurer sites or submit quotes.</span>
      </aside>
      {message && <p className="auth-notice" role="status">{message}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <section className="workspace-card quote-section">
        <p className="eyebrow">Step 1 · Private test profile</p>
        <h2>Underwriting details</h2>
        <p className="muted-copy">Use invented values only. Details are encrypted by the server before storage. Health answers below use a JSON object so the test schema can evolve.</p>
        <form onSubmit={saveProfile}>
          <div className="form-grid">
            <label>Date of birth<input type="date" value={profile.date_of_birth} onChange={(event) => setProfile({ ...profile, date_of_birth: event.target.value })} required /></label>
            <label>State or territory
              <select value={profile.state} onChange={(event) => setProfile({ ...profile, state: event.target.value })} required>
                <option value="" disabled>Select one</option>
                {["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"].map((state) => <option key={state}>{state}</option>)}
              </select>
            </label>
            <label>Tobacco use
              <select value={profile.smoking_status} onChange={(event) => setProfile({ ...profile, smoking_status: event.target.value })}>
                <option value="never">Never</option><option value="former">Former</option><option value="current">Current</option><option value="unknown">Unknown</option>
              </select>
            </label>
            <label>Occupation (fictional)<input maxLength="120" value={profile.occupation} onChange={(event) => setProfile({ ...profile, occupation: event.target.value })} required /></label>
            <label>Annual income band
              <select value={profile.annual_income_band} onChange={(event) => setProfile({ ...profile, annual_income_band: event.target.value })} required>
                <option value="" disabled>Select one</option>
                <option value="under-50k">Under $50,000</option><option value="50-100k">$50,000–$99,999</option><option value="100-150k">$100,000–$149,999</option><option value="150k-plus">$150,000 or more</option>
              </select>
            </label>
            <label className="form-wide">Fictional health and underwriting answers (JSON)
              <textarea rows="7" value={healthJson} onChange={(event) => setHealthJson(event.target.value)} spellCheck="false" />
              <small>Example: {"{\"conditions\":[],\"medications\":[],\"height_cm\":170,\"weight_kg\":70}"}</small>
            </label>
          </div>
          <label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /><span>I confirm this is fictional test data and consent to storing this encrypted profile in my private test account.</span></label>
          <button className="primary-button submit-button" type="submit" disabled={busy}>{busy ? "Saving…" : savedProfile ? "Update encrypted profile" : "Save encrypted profile"}</button>
          {savedProfile && <button className="text-button delete-button" type="button" onClick={deleteProfile} disabled={busy}>Delete profile</button>}
        </form>
      </section>

      <section className="workspace-card quote-section">
        <p className="eyebrow">Step 2 · Test request</p>
        <h2>Create a draft quote request</h2>
        <p className="muted-copy">This saves an encrypted snapshot for testing. It does not send any data to the selected provider.</p>
        <form onSubmit={createRequest}>
          <div className="form-grid">
            <label>Provider<select name="provider_name" defaultValue="" required><option value="" disabled>Select provider</option>{providers.map((provider) => <option key={provider}>{provider}</option>)}</select></label>
            <label>Product name<input name="product_name" maxLength="160" required /></label>
            <label>Cover type<select name="cover_type" defaultValue="life">{coverTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Cover amount (AUD)<input name="cover_amount" type="number" min="1" max="100000000" step="1000" required /></label>
            <label>Premium basis<select name="premium_basis"><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label>
          </div>
          <label className="consent-row"><input name="fictional_data_only" type="checkbox" required /><span>I confirm the profile and request use fictional test data only.</span></label>
          <label className="consent-row"><input name="consent_to_store" type="checkbox" required /><span>I consent to storing this encrypted request snapshot in my private test account.</span></label>
          <button className="primary-button submit-button" type="submit" disabled={busy || !savedProfile}>Save draft request</button>
        </form>
      </section>

      <section className="quote-requests">
        <div className="workspace-heading"><p className="eyebrow">Step 3 · Test results</p><h2>Saved requests and results</h2></div>
        {requests.length === 0 ? <div className="workspace-card empty-state"><p>No test requests yet. Save a profile, then create a draft.</p></div> : requests.map((quoteRequest) => (
          <article className="workspace-card quote-request-card" key={quoteRequest.id}>
            <div className="quote-request-heading">
              <div><h3>{quoteRequest.provider_name} · {quoteRequest.product_name}</h3><p>{quoteRequest.cover_type} · AUD {Number(quoteRequest.cover_amount).toLocaleString("en-AU")} · {quoteRequest.premium_basis}</p></div>
              <span className="test-badge">DRAFT · NOT SENT</span>
            </div>
            <p className="muted-copy">{quoteRequest.status_note}</p>
            <button className="text-button delete-button" type="button" onClick={() => deleteRequest(quoteRequest.id)} disabled={busy}>Delete request and results</button>
            <form className="simulated-result-form" onSubmit={(event) => addSimulatedResult(event, quoteRequest.id)}>
              <h4>Add a fictional test result</h4>
              <div className="form-grid">
                <label>Premium amount (AUD)<input name="premium_amount" type="number" min="0" step="0.01" required /></label>
                <label>Basis<select name="premium_basis" defaultValue={quoteRequest.premium_basis}><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label>
                <label>Expires on (optional)<input name="expires_at" type="date" /></label>
                <label>Source URL<input name="source_url" type="url" defaultValue="https://example.invalid/test-quote" required /></label>
              </div>
              <label className="consent-row"><input name="fictional_data_only" type="checkbox" required /><span>This is a simulated result using fictional data, not an insurer quote.</span></label>
              <button className="text-button" type="submit" disabled={busy}>Save simulated result</button>
            </form>
            {quoteRequest.quote_results?.length > 0 && <ul className="quote-result-list">{quoteRequest.quote_results.map((result) => <li key={result.id}><span><b>SIMULATED TEST RESULT</b><small>{result.source_url}</small></span><strong>AUD {Number(result.premium_amount).toFixed(2)} / {result.premium_basis}</strong></li>)}</ul>}
          </article>
        ))}
      </section>
    </div>
  );
}
