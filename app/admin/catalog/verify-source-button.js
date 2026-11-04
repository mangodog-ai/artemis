"use client";

import { useState } from "react";

export default function VerifySourceButton({ sourceId }) {
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

    window.location.reload();
  }

  return (
    <div className="verify-action">
      <button className="text-button verify-button" type="button" onClick={handleVerify} disabled={pending}>
        {pending ? "Verifying…" : "Verify source"}
      </button>
      {error && <p className="auth-error" role="alert">{error}</p>}
    </div>
  );
}
