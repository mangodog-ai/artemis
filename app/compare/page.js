import { requireUser } from "../../lib/require-user";
import ComparisonForm from "./comparison-form";
import ProtectedNav from "../protected-nav";

export const metadata = {
  title: "Compare cover — Artemis",
  description: "Compare verified Australian life cover product information.",
};

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  await requireUser();

  return (
    <main className="workspace-shell">
      <ProtectedNav />
      <section className="workspace-heading">
        <p className="eyebrow">A considered comparison</p>
        <h1>Set your assumptions.</h1>
        <p>
          Compare verified product details. A premium appears only when a
          provider source contains an exact match for every assumption.
        </p>
      </section>
      <ComparisonForm />
    </main>
  );
}
