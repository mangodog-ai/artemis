import Link from "next/link";

export default function ProtectedNav() {
  return (
    <nav className="protected-nav" aria-label="Comparison navigation">
      <Link href="/account">Artemis</Link>
      <div>
        <Link href="/compare">New comparison</Link>
        <Link href="/comparisons">Saved comparisons</Link>
      </div>
    </nav>
  );
}
