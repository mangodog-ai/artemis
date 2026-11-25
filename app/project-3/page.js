import Link from "next/link";

export const metadata = {
  title: "Project 3 — Artemis Projects",
  description: "A new workspace ready for your next project.",
};

export default function ProjectThreeHome() {
  return (
    <main className="site-shell project-placeholder-shell">
      <nav className="topbar" aria-label="Project navigation">
        <Link className="brand" href="/" aria-label="All Artemis projects"><span className="project-placeholder-mark">a.</span><span>artemis</span></Link>
        <Link className="login-link" href="/">All projects <span aria-hidden="true">↗</span></Link>
      </nav>
      <section className="project-placeholder">
        <span className="hub-eyebrow">PROJECT 03 · WORKSPACE</span>
        <span className="project-placeholder-icon">+</span>
        <h1>A new project, <em>starting here.</em></h1>
        <p>This is the front page for Project 3. Once the idea has a name and a goal, its tools, pages and data can grow in this space.</p>
        <Link className="primary-button" href="/">Back to all projects <span aria-hidden="true">↗</span></Link>
      </section>
      <footer className="site-footer"><span>ARTEMIS PROJECTS</span><span>Project 3 · Ready to shape</span></footer>
    </main>
  );
}
