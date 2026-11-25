"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildDistanceForecast, cyclingNavigation, demoWeeklyMetrics, demoActivities } from "../../lib/cycling/demo-data";
import { useCyclingData } from "./data-provider";

const sections = cyclingNavigation;
const weeks = demoWeeklyMetrics;
const rides = demoActivities;

function LineChart({ points, forecast = false, height = 210 }) {
  const max = Math.max(1, ...points.map((point) => point.value)) * 1.18;
  const coords = points.map((point, index) => ({
    ...point,
    x: 12 + (index * 676) / Math.max(1, points.length - 1),
    y: height - 22 - (point.value / max) * (height - 48),
  }));
  const path = coords.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const baseline = height - 22;
  return (
    <div className="chart-frame">
      <svg className="line-chart" viewBox={`0 0 700 ${height}`} role="img" aria-label={forecast ? "Illustrative projected weekly distance" : "Illustrative weekly distance trend"}>
        {[0.25, 0.5, 0.75, 1].map((line) => <line key={line} x1="0" x2="700" y1={baseline - line * (height - 48)} y2={baseline - line * (height - 48)} className="chart-grid" />)}
        {forecast && <line x1={coords[Math.max(0, coords.length - 4)].x} x2={coords[Math.max(0, coords.length - 4)].x} y1="10" y2={baseline} className="chart-divider" />}
        <path d={`${path} L${coords.at(-1).x},${baseline} L${coords[0].x},${baseline} Z`} className="chart-area" />
        {forecast ? <><path d={coords.slice(0, 4).map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ")} className="chart-line"/><path d={coords.slice(3).map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ")} className="chart-line chart-line-forecast"/></> : <path d={path} className="chart-line"/>}
        {coords.map((point, index) => <circle key={`${point.label}-${index}`} cx={point.x} cy={point.y} r={index === coords.length - 1 ? 4 : 2.6} className={point.projected ? "chart-point chart-point-future" : "chart-point"} />)}
      </svg>
      <div className="chart-labels">{coords.map((point, index) => <span key={`${point.label}-${index}`}>{index === 0 || index === coords.length - 1 || index % Math.ceil(coords.length / 5) === 0 ? point.label : ""}</span>)}</div>
    </div>
  );
}

function RangeControl({ range, onChange }) {
  return <div className="range-control" aria-label="Chart time period">{["4W", "8W"].map((item) => <button key={item} onClick={() => onChange(item)} className={range === item ? "range-active" : ""}>{item}</button>)}</div>;
}

function Metric({ label, value, unit, change, note, icon }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><i>{icon}</i></div><div className="metric-value">{value}<small>{unit}</small></div><div className="metric-change">{change && <b>↗ {change}</b>}<span>{note || (change ? "vs previous 4 weeks" : "past 7 days")}</span></div></article>;
}

function SectionHeading({ eyebrow, title, detail, action }) {
  return <div className="section-heading"><div><span className="cycling-eyebrow">{eyebrow}</span><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{action}</div>;
}

function weeklyChartPoints(snapshot, range, connected = Boolean(snapshot?.connected)) {
  if (!connected) return (range === "8W" ? weeks : weeks.slice(-4)).map((week) => ({ label: week.label, value: week.distance }));
  const byStart = new Map((snapshot?.weeks || []).map((week) => [week.start, week]));
  const today = new Date();
  const monday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const count = range === "8W" ? 8 : 4;
  return Array.from({ length: count }, (_, index) => {
    const start = new Date(monday);
    start.setUTCDate(start.getUTCDate() - (count - index - 1) * 7);
    const key = start.toISOString().slice(0, 10);
    const week = byStart.get(key);
    return { start: key, label: week?.label || start.toLocaleDateString("en-AU", { month: "short", day: "2-digit", timeZone: "UTC" }), value: week?.distanceKm || 0 };
  });
}

function metricHours(seconds) {
  return (seconds / 3600).toFixed(1);
}

function Overview({ range, setRange, snapshot, connected, loading, error, refresh }) {
  const visible = weeklyChartPoints(snapshot, range, connected);
  const metrics = snapshot?.metrics;
  const liveActivities = snapshot?.activities || [];
  return <>
    <div className="welcome-row"><div><span className="cycling-eyebrow">LAST 7 DAYS</span><h1>Your riding, <em>in perspective.</em></h1><p>A clearer view of your training rhythm, progress and what may come next.</p></div>{connected && snapshot && <div className="demo-pill"><span className="live-data-dot"/> Strava data · {new Date(snapshot.fetchedAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</div>}{!connected && <div className="demo-pill"><span/> Sample dashboard</div>}</div>
    <div className="metrics-grid"><Metric label="DISTANCE" value={metrics ? metrics.last7DistanceKm : connected ? "—" : "156"} unit="km" change={!connected ? "18%" : null} note={connected ? "past 7 days" : undefined} icon="↗"/><Metric label="MOVING TIME" value={metrics ? metricHours(metrics.last7MovingSeconds) : connected ? "—" : "6.1"} unit="hrs" change={!connected ? "12%" : null} note={connected ? "past 7 days" : undefined} icon="◷"/><Metric label="ELEVATION" value={metrics ? metrics.last7ElevationMetres.toLocaleString("en-AU") : connected ? "—" : "1,840"} unit="m" change={!connected ? "24%" : null} note={connected ? "past 7 days" : undefined} icon="⌁"/><Metric label="RIDE DAYS" value={metrics ? metrics.last7RideDays : connected ? "—" : "5"} unit="days" change={!connected ? "1 day" : null} note={connected ? "past 7 days" : undefined} icon="▦"/></div>
    {connected && loading && <p className="cycling-live-note">Loading your Strava activities…</p>}
    {connected && snapshot?.truncated && <p className="cycling-live-note">Showing up to 1,000 cycling activities from the last 12 months.</p>}
    {connected && error && <p className="cycling-live-error" role="alert">{error} <button type="button" onClick={refresh}>Try again</button></p>}
    <section className="panel trend-panel"><SectionHeading eyebrow={`TRAINING LOAD · LAST ${range === "8W" ? "8" : "4"} WEEKS`} title={connected ? "Your riding, week by week." : "A steady build."} detail={connected ? "Weekly distance calculated from your recent Strava activity." : "Weekly distance has trended up while your ride frequency stays consistent."} action={<RangeControl range={range} onChange={setRange}/>} /><div className="chart-legend"><i/> Distance <span>km per week</span></div><LineChart points={visible}/>{!connected && <div className="chart-insight"><span className="insight-icon">✳</span><p><b>Building consistency</b><br/>You rode on 5 days this week, above your 4 week average of 4 days.</p><span className="insight-tag">SAMPLE</span></div>}</section>
    <div className="lower-grid"><section className="panel"><SectionHeading eyebrow="NEXT 4 WEEKS" title="A measured outlook."/><div className="forecast-summary"><div><small>PROJECTED DISTANCE</small><strong>~{connected ? metrics ? Math.round(weeklyChartPoints(snapshot, "4W", true).reduce((sum, week) => sum + week.value, 0)) : "—" : 549} <i>km</i></strong><span>{connected ? "Based on your recent 4 week average" : "Based on illustrative sample data"}</span></div><span className="forecast-arrow">↗</span></div><div className="mini-bars">{[74, 81, 92, 88].map((v, i) => <div key={v}><i style={{ height: `${v}%` }}></i><small>W{i + 1}</small></div>)}</div><Link className="text-link" href="/cycling/forecast">Explore forecast <b>↗</b></Link></section><section className="panel"><SectionHeading eyebrow="RECENT ACTIVITY" title="Latest rides." action={<Link className="text-link" href="/cycling/activities">View all ↗</Link>}/><RideList compact activities={connected ? liveActivities : rides}/></section></div>
  </>;
}

function RideList({ compact = false, activities = rides }) {
  const items = activities.slice(0, compact ? 3 : activities.length);
  if (!items.length) return <p className="cycling-empty-rides">No cycling activities found for the last 12 months.</p>;
  return <div className={`ride-list ${compact ? "ride-list-compact" : ""}`}>{items.map((ride) => {
    const isLive = ride.distanceKm !== undefined;
    const date = isLive ? new Date(ride.startDateLocal || ride.startDate) : null;
    const day = isLive ? date.toLocaleDateString("en-AU", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase() : ride.day;
    const name = ride.name;
    const kind = isLive ? ride.sportType : ride.kind;
    const distance = isLive ? `${ride.distanceKm.toFixed(1)} km` : ride.distance;
    const time = isLive ? `${Math.floor(ride.movingSeconds / 3600) ? `${Math.floor(ride.movingSeconds / 3600)}h ` : ""}${Math.floor((ride.movingSeconds % 3600) / 60)}m` : ride.time;
    const climb = isLive ? `${ride.elevationMetres} m` : ride.climb;
    return <article className="ride-row" key={ride.id || ride.name}><div className="ride-symbol">⌁</div><div className="ride-name"><span>{day}</span><b>{name}</b><small>{kind}</small></div><div className="ride-stat"><b>{distance}</b><span>distance</span></div><div className="ride-stat"><b>{time}</b><span>moving time</span></div><div className="ride-stat"><b>{climb}</b><span>elevation</span></div>{ride.effort && <span className={`effort effort-${ride.effort.toLowerCase()}`}>{ride.effort}</span>}</article>;
  })}</div>;
}

function Analysis({ snapshot, connected }) {
  const metrics = snapshot?.metrics;
  const chart = weeklyChartPoints(snapshot, "8W", connected);
  const averageRide = metrics?.recent4RideCount ? (metrics.recent4DistanceKm / metrics.recent4RideCount).toFixed(1) : "—";
  const elevationPer100 = metrics?.recent4DistanceKm ? Math.round(metrics.recent4ElevationMetres / metrics.recent4DistanceKm * 100) : "—";
  return <><div className="welcome-row"><div><span className="cycling-eyebrow">YOUR PATTERNS</span><h1>Understand the <em>work behind progress.</em></h1><p>Look across distance, time and climbing to see how your training is changing.</p></div><div className="demo-pill"><span className={connected ? "live-data-dot" : ""}/>{connected ? "Strava analysis" : "Sample dashboard"}</div></div><div className="metrics-grid"><Metric label="4 WEEK DISTANCE" value={metrics ? metrics.recent4DistanceKm : connected ? "—" : "549"} unit="km" change={metrics?.distanceChangePercent == null ? (!connected ? "18%" : null) : `${metrics.distanceChangePercent}%`} icon="↗"/><Metric label="AVG. RIDE" value={metrics ? averageRide : connected ? "—" : "31"} unit="km" change={!connected ? "7%" : null} icon="⌁"/><Metric label="AVG. DURATION" value={metrics?.recent4RideCount ? metricHours(metrics.recent4MovingSeconds / metrics.recent4RideCount) : connected ? "—" : "1.3"} unit="hrs" change={!connected ? "6%" : null} icon="◷"/><Metric label="ELEVATION / 100 KM" value={metrics ? elevationPer100.toLocaleString("en-AU") : connected ? "—" : "920"} unit="m" change={!connected ? "4%" : null} icon="⌁"/></div><section className="panel trend-panel"><SectionHeading eyebrow="VOLUME OVER TIME" title="Distance and training time." detail={connected ? "Weekly distance calculated from your recent Strava activity." : "Use your own history to understand whether the workload is changing."} action={<span className="chart-period-label">8 WEEKS</span>}/><div className="chart-legend"><i/> Weekly distance <span>km per week</span></div><LineChart points={chart}/></section><section className="panel analysis-notes"><SectionHeading eyebrow="OBSERVATIONS" title="What stands out."/><div className="observation-grid"><article><i>01</i><b>{connected ? "Ride frequency" : "More regular weeks"}</b><p>{connected && metrics ? `${metrics.recent4RideCount} rides in the last four weeks.` : "Your recent four weeks include 18 ride days, compared with 14 in the previous four."}</p></article><article><i>02</i><b>{connected ? "Climbing context" : "Climbing is rising"}</b><p>{connected && metrics ? `${elevationPer100} m elevation per 100 km across the last four weeks.` : "Elevation per 100 km has moved up gradually alongside your weekly distance."}</p></article><article><i>03</i><b>Keep context in view</b><p>Distance alone cannot describe effort or recovery. Add heart rate or power streams when available.</p></article></div></section></>;
}

function Forecast({ snapshot, connected }) {
  const recentWeeks = connected ? weeklyChartPoints(snapshot, "4W", true).map((week) => ({ label: week.label, distance: week.value, start: week.start })) : weeks;
  const { recent: forecast, projected: future, average: avg } = connected && !snapshot
    ? { recent: [], projected: [], average: 0 }
    : buildDistanceForecast(recentWeeks);
  const hasForecast = forecast.length > 0 && (!connected || snapshot?.metrics?.recent4RideCount > 0);
  const projection = future.reduce((sum, week) => sum + week.value, 0);
  return <><div className="welcome-row"><div><span className="cycling-eyebrow">PLANNING AHEAD</span><h1>A forecast, <em>with context.</em></h1><p>Explore a simple projection from your recent riding. It is a planning aid, not a training prescription.</p></div><div className="demo-pill"><span className={connected ? "live-data-dot" : ""}/>{connected ? "Based on your Strava data" : "Illustrative projection"}</div></div><div className="forecast-callout"><span>↗</span><div><b>Projection method</b><p>{connected ? "The example extends your recent four-week average with a gentle trend. It does not account for fatigue, goals or conditions." : "The example uses sample data. Connect Strava to calculate the projection from your recent riding."}</p></div></div><section className="panel trend-panel"><SectionHeading eyebrow="WEEKLY DISTANCE · KM" title="Recent activity and projected volume." detail="The projection uses a recent average and does not account for fatigue, goals or conditions." action={<span className="chart-period-label">4 WEEKS + 4 WEEKS</span>}/><div className="chart-legend"><i/> Recorded <span>· · ·</span><i className="legend-future"/> Illustrative projection</div>{hasForecast ? <LineChart points={[...forecast, ...future]} forecast height={250}/> : <p className="cycling-empty-rides">{connected && !snapshot ? "Loading your activity history…" : "No rides in the last four weeks to build a projection."}</p>}<div className="forecast-range"><span>RECENT AVG.<b>{hasForecast ? `${Math.round(avg)} km / week` : "—"}</b></span><span>4 WEEK OUTLOOK<b>{hasForecast ? `${Math.round(projection)} km total` : "—"}</b></span><span>CONFIDENCE<b>Exploratory</b></span></div></section><section className="panel analysis-notes"><SectionHeading eyebrow="NEXT FEATURES" title="Forecasts can grow with your goals."/><div className="feature-roadmap"><span>01</span><div><b>Choose a target</b><p>Model a distance, event or climbing goal against available training history.</p></div><span>02</span><div><b>Add training signals</b><p>Bring in power, heart rate and perceived effort to add context to volume.</p></div><span>03</span><div><b>See uncertainty</b><p>Show ranges and assumptions so projections stay useful and understandable.</p></div></div></section></>;
}

function Activities({ snapshot, connected }) {
  return <><div className="welcome-row"><div><span className="cycling-eyebrow">YOUR RIDE LOG</span><h1>Every ride, <em>part of the picture.</em></h1><p>Browse your recent activities and the details that feed your analysis.</p></div><div className="demo-pill"><span className={connected ? "live-data-dot" : ""}/>{connected ? "Last 12 months · Strava" : "Sample activities"}</div></div><section className="panel activities-panel"><SectionHeading eyebrow="RECENT RIDES" title="Activity history." detail={connected ? "Your cycling activities fetched from Strava on demand." : "Example activity rows show how connected Strava data will be organized."} action={connected ? <button className="filter-button">Last 12 months⌄</button> : null}/><RideList activities={connected ? snapshot?.activities || [] : rides}/></section><div className="forecast-callout"><span>◎</span><div><b>{connected ? "Activity data is temporary" : "Bring your ride history together"}</b><p>{connected ? "Your activity list stays in page memory for up to 24 hours and is fetched again from Strava when refreshed." : "Strava connection will let you build analysis from your own training history."}</p></div></div></>;
}

export default function CyclingDashboard({ view }) {
  const [range, setRange] = useState("8W");
  const { connected, checking, snapshot, loading, hasAttempted, error, refresh } = useCyclingData();
  useEffect(() => {
    if (view !== "overview" && view !== "analysis" && view !== "forecast" && view !== "activities") return;
    if (connected && !checking && !snapshot && !loading && !hasAttempted) refresh();
  }, [view, connected, checking, snapshot, loading, hasAttempted, refresh]);

  return <div className="cycling-app"><aside className="cycling-sidebar"><Link className="cycling-brand" href="/cycling"><span className="cycling-mark">a.</span><span>ARTEMIS<small>CYCLING</small></span></Link><div className="side-caption">YOUR TRAINING</div><nav className="cycling-nav" aria-label="Cycling navigation">{sections.map((section) => <Link key={section.href} href={section.href} className={(view === "overview" ? section.href === "/cycling" : section.href.endsWith(view)) ? "nav-selected" : ""}><span>{section.icon}</span>{section.label}{section.href === "/cycling/forecast" && <i>NEW</i>}</Link>)}</nav><div className="sidebar-bottom"><div className="strava-avatar">S</div><div><b>Strava connection</b><small>{checking ? "Checking…" : connected ? "Connected" : "Not connected"}</small></div><span className={`connection-dot ${connected ? "connection-dot-active" : ""}`}/></div><Link className="back-to-artemis" href="/">← Artemis home</Link></aside><main className="cycling-main"><header className="cycling-topbar"><div className="breadcrumbs">Artemis <span>/</span> Cycling <span>/</span> <b>{view === "overview" ? "Overview" : view[0].toUpperCase() + view.slice(1)}</b></div><div className="cycling-top-actions">{connected && <button type="button" className="cycling-refresh" onClick={refresh} disabled={loading}>{loading ? "Refreshing…" : "Refresh data"}</button>}<Link className="cycling-connect-link" href="/cycling/connect">{connected ? "Connection settings" : "Connect Strava"}</Link></div></header><div className="cycling-content"><div className="sample-banner"><span>ⓘ</span><p>{connected ? <><b>Strava connected</b> · Your activity history is fetched on demand and shown only in your account.</> : <><b>Sample dashboard</b> · Every activity and metric shown here is illustrative. Connect Strava to load your data.</>}</p><Link href={connected ? "/cycling/privacy" : "/cycling/connect"}>{connected ? "Privacy notice" : "Connect"}</Link></div>{error && view !== "overview" && <p className="cycling-live-error" role="alert">{error}</p>}{view === "overview" && <Overview range={range} setRange={setRange} snapshot={snapshot} connected={connected} loading={loading} error={error} refresh={refresh} />}{view === "analysis" && <Analysis snapshot={snapshot} connected={connected}/ >}{view === "forecast" && <Forecast snapshot={snapshot} connected={connected} />}{view === "activities" && <Activities snapshot={snapshot} connected={connected} />}<footer className="cycling-footer"><span>ARTEMIS CYCLING</span><span>Activity insights are descriptive. Forecasts are exploratory.</span><Link href="/cycling/privacy">Privacy</Link></footer></div></main></div>;
}
