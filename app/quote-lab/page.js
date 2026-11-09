import { requireUser } from "../../lib/require-user";
import ProtectedNav from "../protected-nav";
import QuoteLab from "./quote-lab";

export const metadata = {
  title: "Fictional quote lab — Artemis",
  description: "Test underwriting profile and quote-result storage with fictional data.",
};

export const dynamic = "force-dynamic";

export default async function QuoteLabPage() {
  await requireUser();
  return (
    <main className="workspace-shell">
      <ProtectedNav />
      <section className="workspace-heading">
        <p className="eyebrow">Testing environment</p>
        <h1>Fictional quote lab.</h1>
        <p>Save a fictional underwriting profile, create a draft request, and record a simulated result. Nothing is sent to insurers.</p>
      </section>
      <QuoteLab />
    </main>
  );
}
