import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

function safeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request, { params }) {
  const { secret } = await params;
  const pathSecret = process.env.STRAVA_WEBHOOK_PATH_SECRET;
  const verifySecret = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
  const url = new URL(request.url);
  const challenge = url.searchParams.get("hub.challenge");
  if (!safeEqual(secret, pathSecret) || url.searchParams.get("hub.mode") !== "subscribe" || !safeEqual(url.searchParams.get("hub.verify_token"), verifySecret) || !challenge) {
    return NextResponse.json({ error: "Webhook verification failed." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ "hub.challenge": challenge }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request, { params }) {
  const { secret } = await params;
  if (!safeEqual(secret, process.env.STRAVA_WEBHOOK_PATH_SECRET)) {
    return NextResponse.json({ error: "Webhook authentication failed." }, { status: 403 });
  }
  let event;
  let rawBody;
  try {
    rawBody = await request.text();
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid webhook event." }, { status: 400 });
  }
  if (String(event.subscription_id) !== process.env.STRAVA_WEBHOOK_SUBSCRIPTION_ID) {
    return NextResponse.json({ error: "Unknown webhook subscription." }, { status: 403 });
  }
  if (event.object_type === "athlete" && (event.updates?.authorized === "false" || event.updates?.authorized === false)) {
    const ownerId = rawBody.match(/"owner_id"\s*:\s*(\d+)/)?.[1];
    if (!process.env.STRAVA_WEBHOOK_DB_SECRET || !ownerId) {
      return NextResponse.json({ error: "Webhook processing is not configured." }, { status: 503 });
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("delete_cycling_strava_connection_from_webhook", {
      p_athlete_id: ownerId,
      p_webhook_secret: process.env.STRAVA_WEBHOOK_DB_SECRET,
    });
    if (error) {
      console.error("Strava deauthorization webhook could not delete the connection.");
      return NextResponse.json({ error: "Could not process deauthorization." }, { status: 500 });
    }
  }
  return NextResponse.json({ received: true }, { headers: { "Cache-Control": "no-store" } });
}
