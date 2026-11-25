"use client";

import { useState } from "react";
import { useCyclingData } from "./data-provider";

export default function StravaConnectionControl({ configured }) {
  const { connected, checking, loading, setSnapshot, setConnected } = useCyclingData();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function disconnect() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/strava/disconnect", { method: "POST", cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not disconnect Strava.");
      setConnected(false);
      setSnapshot(null);
      setMessage(result.providerRevoked ? "Strava was disconnected and the local connection was deleted." : "The local connection was deleted. Remove Artemis Cycling from your Strava app settings to revoke access there.");
    } catch (error) {
      setMessage(error.message || "Could not disconnect Strava.");
    } finally {
      setPending(false);
    }
  }

  if (checking || loading) return <p className="strava-state">Checking the Strava connection…</p>;
  if (connected) {
    return <div className="strava-connected"><div><span className="strava-connected-dot"/><b>Strava connected</b><small>Ride activity is loaded on demand for your dashboards.</small></div><button type="button" className="strava-disconnect" disabled={pending} onClick={disconnect}>{pending ? "Disconnecting…" : "Disconnect and delete"}</button>{message && <p className="strava-control-message" role="status">{message}</p>}</div>;
  }

  return <>
    {!configured && <p className="strava-setup-warning">Strava setup is incomplete. Add the server-only credentials and encryption key from the Cycling setup guide first.</p>}
    <form action="/api/strava/connect" method="post" className="strava-consent-form">
      <label className="strava-consent"><input type="checkbox" name="consent" value="cycling-strava-v1" required disabled={!configured}/><span>I agree to connect my Strava account and let Artemis Cycling read my activities, including activities set to Only You, to show my personal cycling analysis and forecasts.</span></label>
      <button className="strava-connect-button" type="submit" disabled={!configured}>Authorize with Strava <span aria-hidden="true">↗</span></button>
    </form>
    {message && <p className="strava-control-message" role="status">{message}</p>}
  </>;
}
