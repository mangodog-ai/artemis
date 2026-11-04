"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteComparisonButton({ comparisonId }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this saved comparison? This cannot be undone.")) {
      return;
    }

    setPending(true);
    setError("");
    const response = await fetch(`/api/comparisons/${comparisonId}`, {
      method: "DELETE",
    });
    const result = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(result.error ?? "The comparison could not be deleted.");
      return;
    }

    router.push("/comparisons");
    router.refresh();
  }

  return (
    <div>
      <button className="text-button delete-button" type="button" onClick={handleDelete} disabled={pending}>
        {pending ? "Deleting…" : "Delete comparison"}
      </button>
      {error && <p className="auth-error" role="alert">{error}</p>}
    </div>
  );
}
