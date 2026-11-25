"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CyclingDataContext = createContext(null);

export function CyclingDataProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [error, setError] = useState("");

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/cycling/status", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not check Strava status.");
      setConnected(Boolean(result.connected));
    } catch (caught) {
      setError(caught.message || "Could not check Strava status.");
    } finally {
      setChecking(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cycling/activities", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not refresh Strava activities.");
      setConnected(Boolean(result.connected));
      setSnapshot(result.connected ? result : null);
    } catch (caught) {
      setError(caught.message || "Could not load Strava activities.");
    } finally {
      setLoading(false);
      setHasAttempted(true);
    }
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);
  useEffect(() => {
    if (!snapshot?.expiresAt) return undefined;
    const delay = Math.max(0, new Date(snapshot.expiresAt).getTime() - Date.now());
    const timer = setTimeout(() => setSnapshot(null), delay);
    return () => clearTimeout(timer);
  }, [snapshot]);

  const value = useMemo(() => ({ connected, checking, snapshot, loading, hasAttempted, error, refresh, setSnapshot, setConnected }), [connected, checking, snapshot, loading, hasAttempted, error, refresh]);
  return <CyclingDataContext.Provider value={value}>{children}</CyclingDataContext.Provider>;
}

export function useCyclingData() {
  return useContext(CyclingDataContext) || { connected: false, checking: false, snapshot: null, loading: false, hasAttempted: false, error: "", refresh: async () => {}, setSnapshot: () => {}, setConnected: () => {} };
}
