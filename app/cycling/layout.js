import "./cycling.css";
import "./strava.css";
import { CyclingDataProvider } from "./data-provider";

export const metadata = {
  title: "Artemis Cycling — Ride data, in perspective",
  description: "Cycling activity analysis and training forecasts.",
};

export default function CyclingLayout({ children }) {
  return <CyclingDataProvider>{children}</CyclingDataProvider>;
}
