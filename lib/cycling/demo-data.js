/** Synthetic dashboard data. Replace with the authenticated activity repository. */
export const cyclingNavigation = [
  { href: "/cycling", label: "Overview", icon: "◫" },
  { href: "/cycling/analysis", label: "Analysis", icon: "⌁" },
  { href: "/cycling/forecast", label: "Forecast", icon: "↗" },
  { href: "/cycling/activities", label: "Activities", icon: "◎" },
];

export const demoWeeklyMetrics = [
  { label: "Sep 28", distance: 82, hours: 3.4, rides: 3 },
  { label: "Oct 05", distance: 104, hours: 4.1, rides: 4 },
  { label: "Oct 12", distance: 91, hours: 3.8, rides: 3 },
  { label: "Oct 19", distance: 126, hours: 5.2, rides: 4 },
  { label: "Oct 26", distance: 118, hours: 4.7, rides: 4 },
  { label: "Nov 02", distance: 143, hours: 5.8, rides: 5 },
  { label: "Nov 09", distance: 132, hours: 5.4, rides: 4 },
  { label: "Nov 16", distance: 156, hours: 6.1, rides: 5 },
];

export const demoActivities = [
  { day: "SUN, NOV 22", name: "Coastal loop", kind: "Endurance", distance: "48.6 km", time: "1h 42m", climb: "384 m", effort: "Steady" },
  { day: "FRI, NOV 20", name: "River path intervals", kind: "Intervals", distance: "32.1 km", time: "1h 08m", climb: "126 m", effort: "Hard" },
  { day: "WED, NOV 18", name: "Evening spin", kind: "Recovery", distance: "21.4 km", time: "52m", climb: "98 m", effort: "Easy" },
  { day: "TUE, NOV 17", name: "Hills above town", kind: "Climbing", distance: "56.8 km", time: "2h 16m", climb: "812 m", effort: "Moderate" },
];

/** Simple baseline projection for the sample UI, not a training plan. */
export function buildDistanceForecast(weeklyMetrics) {
  const recent = weeklyMetrics.slice(-4).map((week) => ({ label: week.label, value: week.distance }));
  const average = recent.reduce((sum, week) => sum + week.value, 0) / recent.length;
  const projected = ["Nov 23", "Nov 30", "Dec 07", "Dec 14"].map((label, index) => ({
    label,
    value: average * (1 + index * 0.025),
    projected: true,
  }));
  return { recent, projected, average };
}
