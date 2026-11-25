import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import {
  fetchRecentCyclingActivities,
  getFreshStravaAccessToken,
  normalizeCyclingActivity,
} from "../../../../lib/cycling/strava";

export const dynamic = "force-dynamic";

function noStoreJson(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

function weeklySummary(activities) {
  const byWeek = new Map();
  for (const activity of activities) {
    const date = new Date(activity.startDateLocal || activity.startDate);
    if (Number.isNaN(date.getTime())) continue;
    const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const weekday = (day.getUTCDay() + 6) % 7;
    day.setUTCDate(day.getUTCDate() - weekday);
    const key = day.toISOString().slice(0, 10);
    const item = byWeek.get(key) || { start: key, distanceKm: 0, movingSeconds: 0, elevationMetres: 0, rides: 0 };
    item.distanceKm += activity.distanceKm;
    item.movingSeconds += activity.movingSeconds;
    item.elevationMetres += activity.elevationMetres;
    item.rides += 1;
    byWeek.set(key, item);
  }
  const today = new Date();
  const thisMonday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  thisMonday.setUTCDate(thisMonday.getUTCDate() - ((thisMonday.getUTCDay() + 6) % 7));
  return Array.from({ length: 52 }, (_, index) => {
    const start = new Date(thisMonday);
    start.setUTCDate(start.getUTCDate() - (51 - index) * 7);
    const key = start.toISOString().slice(0, 10);
    const item = byWeek.get(key) || { start: key, distanceKm: 0, movingSeconds: 0, elevationMetres: 0, rides: 0 };
    return {
      ...item,
      distanceKm: Math.round(item.distanceKm * 10) / 10,
      label: start.toLocaleDateString("en-AU", { month: "short", day: "2-digit", timeZone: "UTC" }),
    };
  });
}

function buildMetrics(activities) {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const last7 = activities.filter((activity) => now - new Date(activity.startDate).getTime() < weekMs);
  const recent4 = activities.filter((activity) => now - new Date(activity.startDate).getTime() < 4 * weekMs);
  const previous4 = activities.filter((activity) => {
    const age = now - new Date(activity.startDate).getTime();
    return age >= 4 * weekMs && age < 8 * weekMs;
  });
  const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);
  const distance = sum(recent4, "distanceKm");
  const previousDistance = sum(previous4, "distanceKm");
  return {
    last7DistanceKm: Math.round(sum(last7, "distanceKm")),
    last7MovingSeconds: sum(last7, "movingSeconds"),
    last7ElevationMetres: Math.round(sum(last7, "elevationMetres")),
    last7RideDays: new Set(last7.map((activity) => (activity.startDateLocal || activity.startDate).slice(0, 10))).size,
    recent4DistanceKm: Math.round(distance),
    previous4DistanceKm: Math.round(previousDistance),
    recent4RideCount: recent4.length,
    recent4MovingSeconds: sum(recent4, "movingSeconds"),
    recent4ElevationMetres: Math.round(sum(recent4, "elevationMetres")),
    distanceChangePercent: previousDistance ? Math.round(((distance - previousDistance) / previousDistance) * 100) : null,
  };
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError && authError.name !== "AuthSessionMissingError") return noStoreJson({ error: "Could not verify the signed-in user." }, 500);
  if (!user) return noStoreJson({ connected: false, reason: "sign_in_required" });

  try {
    const connection = await getFreshStravaAccessToken(supabase);
    if (!connection) return noStoreJson({ connected: false });
    const { activities: providerActivities, truncated } = await fetchRecentCyclingActivities(connection.tokens.access_token);
    const activities = providerActivities.map(normalizeCyclingActivity).sort((a, b) => b.startDate.localeCompare(a.startDate));
    const weeks = weeklySummary(activities);
    return noStoreJson({
      connected: true,
      activities,
      weeks,
      metrics: buildMetrics(activities),
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      historyDays: 365,
      truncated,
    });
  } catch (error) {
    console.error("Cycling Strava activity request failed:", error.message);
    return noStoreJson({ error: error.message || "Could not load Strava activities." }, 502);
  }
}
