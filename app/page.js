import Link from "next/link";

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none">
        <path
          d="M18 3.5 30 8v9.3c0 7.3-4.9 12.6-12 15.2C10.9 29.9 6 24.6 6 17.3V8l12-4.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M12 19.4c1.8-3.2 3.8-4.8 6-4.8s4.2 1.6 6 4.8M18 11.2v3.4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function PolicyPreview() {
  return (
    <div className="preview-wrap" aria-label="Illustration of a life cover comparison">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="preview-card">
        <div className="preview-heading">
          <div>
            <span className="micro-label">Concept preview</span>
            <h2>Cover, side by side.</h2>
          </div>
          <span className="sparkle" aria-hidden="true">✳</span>
        </div>
        <div className="cover-amount">
          <span>Build a comparison around</span>
          <strong>Your priorities</strong>
          <div className="amount-line"><i /></div>
        </div>
        <div className="preview-options">
          <div className="option option-featured">
            <span className="option-icon">A</span>
            <span><b>Option one</b><small>Flexible cover</small></span>
            <span className="option-dot" />
          </div>
          <div className="option">
            <span className="option-icon option-icon-alt">B</span>
            <span><b>Option two</b><small>Level premium</small></span>
            <span className="option-dot" />
          </div>
        </div>
        <div className="preview-foot">
          <span className="foot-check">✓</span>
          <span>Understand the details that matter</span>
        </div>
      </div>
      <div className="floating-note">
        <span className="note-star">✦</span>
        <span><b>Clarity first</b><small>Built around you</small></span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="site-shell">
      <nav className="topbar" aria-label="Main navigation">
        <Link className="brand" href="/" aria-label="Artemis home">
          <BrandMark />
          <span>artemis</span>
        </Link>
        <div className="nav-right">
          <span className="nav-status"><i /> In the making</span>
          <Link className="login-link" href="/login">Log in <span aria-hidden="true">↗</span></Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-star">✳</span> A new way to see life cover</div>
          <h1>Life cover,<br /><em>made clearer.</em></h1>
          <p className="hero-description">
            We’re creating a more thoughtful way to explore and compare life insurance in Australia.
          </p>
          <div className="construction-pill">
            <span className="construction-icon" aria-hidden="true">✦</span>
            <span><b>We’re under construction</b><small>Something good is taking shape.</small></span>
          </div>
          <div className="hero-bottom">
            <Link className="primary-button" href="/login">
              Log in to Artemis <span aria-hidden="true">↗</span>
            </Link>
            <span className="quiet-note">For invited members</span>
          </div>
        </div>
        <PolicyPreview />
      </section>

      <footer className="site-footer">
        <span>Thoughtful cover. Clearer choices.</span>
        <span>Made for Australia <i className="footer-sun">✳</i></span>
      </footer>
    </main>
  );
}
