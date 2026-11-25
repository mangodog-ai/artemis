import Link from "next/link";
import { projects } from "../lib/projects";

function ProjectVisual({ type }) {
  if (type === "cycling") {
    return <div className="hub-visual hub-cycling" aria-hidden="true"><div className="hub-visual-top"><span>WEEKLY DISTANCE</span><b>+18%</b></div><svg viewBox="0 0 320 100" preserveAspectRatio="none"><path d="M0 80 C35 72 42 81 74 61 S120 67 151 45 190 52 215 32 258 43 286 18 305 22 320 8"/><path d="M0 80 C35 72 42 81 74 61 S120 67 151 45 190 52 215 32 258 43 286 18 305 22 320 8 L320 100 L0 100Z" className="hub-chart-fill"/></svg><div className="hub-chart-labels"><span>8 WEEKS</span><span>ANALYSIS · FORECAST</span></div></div>;
  }
  if (type === "insurance") {
    return <div className="hub-visual hub-insurance" aria-hidden="true"><span className="hub-shield">✳</span><div><b>Clear comparisons</b><small>Cover · terms · context</small></div><span className="hub-visual-arrow">↗</span></div>;
  }
  return <div className="hub-visual hub-future" aria-hidden="true"><span>+</span><small>YOUR NEXT IDEA</small></div>;
}

export default function ProjectHome() {
  return (
    <main className="project-hub">
      <header className="hub-header">
        <Link href="/" className="hub-brand" aria-label="Artemis projects home"><span className="hub-brand-mark">a.</span> ARTEMIS <i>PROJECTS</i></Link>
        <span className="hub-header-note"><span/> YOUR APP WORKSPACES</span>
      </header>
      <section className="hub-intro">
        <span className="hub-eyebrow">ONE HOME · MANY IDEAS</span>
        <h1>Choose a <em>project.</em></h1>
        <p>Each app has its own front page and workspace. Pick up where you left off, or start shaping something new.</p>
      </section>
      <section className="hub-projects" aria-label="Your projects">
        {projects.map((project) => (
          <Link href={project.href} className={`hub-card hub-card-${project.visual}`} key={project.href}>
            <div className="hub-card-meta"><span>{project.number} <i>/</i> {project.category}</span><span className="hub-status"><i/>{project.status}</span></div>
            <ProjectVisual type={project.visual}/>
            <div className="hub-card-copy"><h2>{project.name}</h2><p>{project.description}</p></div>
            <div className="hub-card-action"><span>{project.action}</span><b>↗</b></div>
          </Link>
        ))}
      </section>
      <footer className="hub-footer"><span>ARTEMIS PROJECTS</span><span>Separate spaces for ideas in motion.</span></footer>
    </main>
  );
}
