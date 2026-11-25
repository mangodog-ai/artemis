"use client";

import Link from "next/link";
import { useState } from "react";
import { buildDistanceForecast, cyclingNavigation, demoWeeklyMetrics, demoActivities } from "../../lib/cycling/demo-data";

const sections = cyclingNavigation;
const weeks = demoWeeklyMetrics;
const rides = demoActivities;

function LineChart({ points, forecast = false, height = 210 }) {
  const max = Math.max(...points.map((point) => point.value)) * 1.18;
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

function Metric({ label, value, unit, change, icon }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><i>{icon}</i></div><div className="metric-value">{value}<small>{unit}</small></div><div className="metric-change"><b>↗ {change}</b><span>vs previous 4 weeks</span></div></article>;
}

function SectionHeading({ eyebrow, title, detail, action }) {
  return <div className="section-heading"><div><span className="cycling-eyebrow">{eyebrow}</span><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{action}</div>;
}

function Overview({ range, setRange }) {
  const visible = range === "8W" ? weeks : weeks.slice(-4);
  return <>
    <div className="welcome-row"><div><span className="cycling-eyebrow">MONDAY, 23 NOVEMBER</span><h1>Your riding, <em>in perspective.</em></h1><p>A clearer view of your training rhythm, progress and what may come next.</p></div><div className="demo-pill"><span></span> Sample dashboard</div></div>
    <div className="metrics-grid"><Metric label="DISTANCE" value="156" unit="km" change="18%" icon="↗"/><Metric label="MOVING TIME" value="6.1" unit="hrs" change="12%" icon="◷"/><Metric label="ELEVATION" value="1,840" unit="m" change="24%" icon="⌁"/><Metric label="RIDE DAYS" value="5" unit="days" change="1 day" icon="▦"/></div>
    <section className="panel trend-panel"><SectionHeading eyebrow="TRAINING LOAD · LAST 8 WEEKS" title="A steady build." detail="Weekly distance has trended up while your ride frequency stays consistent." action={<RangeControl range={range} onChange={setRange}/>} /><div className="chart-legend"><i/> Distance <span>km per week</span></div><LineChart points={visible.map((week) => ({ label: week.label, value: week.distance }))}/><div className="chart-insight"><span className="insight-icon">✳</span><p><b>Building consistency</b><br/>You rode on 5 days this week, above your 4 week average of 4 days.</p><span className="insight-tag">RHYTHM</span></div></section>
    <div className="lower-grid"><section className="panel"><SectionHeading eyebrow="NEXT 4 WEEKS" title="A measured outlook."/><div className="forecast-summary"><div><small>PROJECTED DISTANCE</small><strong>~549 <i>km</i></strong><span>Based on your recent 4 week average</span></div><span className="forecast-arrow">↗</span></div><div className="mini-bars">{[74, 81, 92, 88].map((v, i) => <div key={v}><i style={{ height: `${v}%` }}></i><small>W{i + 1}</small></div>)}</div><Link className="text-link" href="/cycling/forecast">Explore forecast <b>↗</b></Link></section><section className="panel"><SectionHeading eyebrow="RECENT ACTIVITY" title="Latest rides." action={<Link className="text-link" href="/cycling/activities">View all ↗</Link>}/><RideList compact/></section></div>
  </>;
}

function RideList({ compact = false }) {
  return <div className={`ride-list ${compact ? "ride-list-compact" : ""}`}>{rides.slice(0, compact ? 3 : rides.length).map((ride) => <article className="ride-row" key={ride.name}><div className="ride-symbol">⌁</div><div className="ride-name"><span>{ride.day}</span><b>{ride.name}</b><small>{ride.kind}</small></div><div className="ride-stat"><b>{ride.distance}</b><span>distance</span></div><div className="ride-stat"><b>{ride.time}</b><span>moving time</span></div><div className="ride-stat"><b>{ride.climb}</b><span>elevation</span></div><span className={`effort effort-${ride.effort.toLowerCase()}`}>{ride.effort}</span></article>)}</div>;
}

function Analysis() {
  return <><div className="welcome-row"><div><span className="cycling-eyebrow">YOUR PATTERNS</span><h1>Understand the <em>work behind progress.</em></h1><p>Look across distance, time and climbing to see how your training is changing.</p></div><div className="demo-pill"><span/> Sample dashboard</div></div><div className="metrics-grid"><Metric label="4 WEEK DISTANCE" value="549" unit="km" change="18%" icon="↗"/><Metric label="AVG. RIDE" value="39" unit="km" change="7%" icon="⌁"/><Metric label="AVG. DURATION" value="1.5" unit="hrs" change="6%" icon="◷"/><Metric label="ELEVATION / 100 KM" value="1,248" unit="m" change="4%" icon="⌁"/></div><section className="panel trend-panel"><SectionHeading eyebrow="VOLUME OVER TIME" title="Distance and training time." detail="Use your own history to understand whether the workload is changing." action={<span className="chart-period-label">8 WEEKS</span>}/><div className="chart-legend"><i/> Weekly distance <span>km per week</span></div><LineChart points={weeks.map((week) => ({ label: week.label, value: week.distance }))}/></section><section className="panel analysis-notes"><SectionHeading eyebrow="OBSERVATIONS" title="What stands out."/><div className="observation-grid"><article><i>01</i><b>More regular weeks</b><p>Your recent four weeks include 18 ride days, compared with 14 in the previous four.</p></article><article><i>02</i><b>Climbing is rising</b><p>Elevation per 100 km has moved up gradually alongside your weekly distance.</p></article><article><i>03</i><b>Keep context in view</b><p>Distance alone cannot describe effort or recovery. Add heart rate or power streams when available.</p></article></div></section></>;
}

function Forecast() {
  const { recent: forecast, projected: future, average: avg } = buildDistanceForecast(weeks);
  return <><div className="welcome-row"><div><span className="cycling-eyebrow">PLANNING AHEAD</span><h1>A forecast, <em>with context.</em></h1><p>Explore a simple projection from your recent riding. It is a planning aid, not a training prescription.</p></div><div className="demo-pill"><span/> Illustrative projection</div></div><div className="forecast-callout"><span>↗</span><div><b>Projection method</b><p>The example below extends your recent 4 week average with a gentle trend. Connect activity history to build a personal model from your data.</p></div></div><section className="panel trend-panel"><SectionHeading eyebrow="WEEKLY DISTANCE · KM" title="Recent activity and projected volume." detail="The projection uses a recent average and does not account for fatigue, goals or conditions." action={<span className="chart-period-label">4 WEEKS + 4 WEEKS</span>}/><div className="chart-legend"><i/> Recorded <span>· · ·</span><i className="legend-future"/> Illustrative projection</div><LineChart points={[...forecast, ...future]} forecast height={250}/><div className="forecast-range"><span>RECENT AVG.<b>{Math.round(avg)} km / week</b></span><span>4 WEEK OUTLOOK<b>{Math.round(avg * 4)} km total</b></span><span>CONFIDENCE<b>Exploratory</b></span></div></section><section className="panel analysis-notes"><SectionHeading eyebrow="NEXT FEATURES" title="Forecasts can grow with your goals."/><div className="feature-roadmap"><span>01</span><div><b>Choose a target</b><p>Model a distance, event or climbing goal against available training history.</p></div><span>02</span><div><b>Add training signals</b><p>Bring in power, heart rate and perceived effort to add context to volume.</p></div><span>03</span><div><b>See uncertainty</b><p>Show ranges and assumptions so projections stay useful and understandable.</p></div></div></section></>;
}

function Activities() {
  return <><div className="welcome-row"><div><span className="cycling-eyebrow">YOUR RIDE LOG</span><h1>Every ride, <em>part of the picture.</em></h1><p>Browse your recent activities and the details that feed your analysis.</p></div><div className="demo-pill"><span/> Sample activities</div></div><section className="panel activities-panel"><SectionHeading eyebrow="RECENT RIDES" title="Activity history." detail="Example activity rows show how connected Strava data will be organized." action={<button className="filter-button">Last 30 days⌄</button>}/><RideList/></section><div className="forecast-callout"><span>◎</span><div><b>Bring your ride history together</b><p>Strava connection will let you sync activities and build analysis from your own training history.</p></div></div></>;
}

export default function CyclingDashboard({ view }) {
  const [range, setRange] = useState("8W");
  return <div className="cycling-app"><aside className="cycling-sidebar"><Link className="cycling-brand" href="/cycling"><span className="cycling-mark">a.</span><span>ARTEMIS<small>CYCLING</small></span></Link><div className="side-caption">YOUR TRAINING</div><nav className="cycling-nav" aria-label="Cycling navigation">{sections.map((section) => <Link key={section.href} href={section.href} className={(view === "overview" ? section.href === "/cycling" : section.href.endsWith(view)) ? "nav-selected" : ""}><span>{section.icon}</span>{section.label}{section.href === "/cycling/forecast" && <i>NEW</i>}</Link>)}</nav><div className="sidebar-bottom"><div className="strava-avatar">S</div><div><b>Strava connection</b><small>Setup required</small></div><span className="connection-dot"/></div><Link className="back-to-artemis" href="/">← Artemis home</Link></aside><main className="cycling-main"><header className="cycling-topbar"><div className="breadcrumbs">Artemis <span>/</span> Cycling <span>/</span> <b>{view === "overview" ? "Overview" : view[0].toUpperCase() + view.slice(1)}</b></div><button className="profile-button" aria-label="Profile">JD</button></header><div className="cycling-content"><div className="sample-banner"><span>ⓘ</span><p><b>Sample dashboard</b> · Every activity and metric shown here is illustrative. Connect Strava when account setup is ready.</p><Link href="/cycling/forecast">About forecasts</Link></div>{view === "overview" && <Overview range={range} setRange={setRange} />}{view === "analysis" && <Analysis/>}{view === "forecast" && <Forecast/>}{view === "activities" && <Activities/>}<footer className="cycling-footer"><span>ARTEMIS CYCLING</span><span>Activity insights are descriptive. Forecasts are exploratory.</span></footer></div></main></div>;
}
