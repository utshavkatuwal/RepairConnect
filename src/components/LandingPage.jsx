import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Icon = ({ path, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

const features = [
  {
    title: 'Verified technicians',
    desc: 'Background-checked pros with verified certificates, so you know exactly who is coming to your home.',
    icon: 'M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10zM9 12l2 2 4-4',
  },
  {
    title: 'Smart matching',
    desc: 'Tell us what broke. The right specialist for the job gets your request — no cold calls, no guesswork.',
    icon: 'M21 12a9 9 0 1 1-9-9M21 3l-9 9M15 3h6v6',
  },
  {
    title: 'Live job tracking',
    desc: 'Follow every step — from accepted, on the way, to work in progress — in real time.',
    icon: 'M12 8v4l2 2M21 12a9 9 0 1 1-9-9M21 3v6h-6',
  },
  {
    title: 'In-app chat',
    desc: 'Settle details, share photos, and ask questions without ever exchanging phone numbers.',
    icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z',
  },
  {
    title: 'Transparent pricing',
    desc: 'See the estimate up front. Pay securely in-app only after the job is done right.',
    icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  },
  {
    title: 'Ratings that matter',
    desc: 'Real reviews from real jobs. Choose with confidence or get matched with top-rated pros.',
    icon: 'M11.05 4.9l1.4-2.8a.8.8 0 0 1 1.43 0l1.4 2.8 3.13.46a.8.8 0 0 1 .44 1.36l-2.26 2.2.53 3.12a.8.8 0 0 1-1.16.84L12 11.9l-2.8 1.48a.8.8 0 0 1-1.16-.84l.53-3.12-2.26-2.2a.8.8 0 0 1 .44-1.36l3.3-.46z',
  },
];

const steps = [
  {
    num: '01',
    title: 'Create a request',
    desc: 'Pick a service, describe the problem, add a photo and your preferred time.',
  },
  {
    num: '02',
    title: 'Get matched',
    desc: 'Available specialists with the right skills in your area see it instantly.',
  },
  {
    num: '03',
    title: 'Done & paid',
    desc: 'The technician fixes it, you approve, and payment releases securely.',
  },
];

const JobTracker = ({ dot, label }) => (
  <div className="viz-row">
    <span className={`dot ${dot}`} />
    <span>{label}</span>
  </div>
);

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="page">
      <div className="bg-scene">
        <div className="orb orb-indigo" />
        <div className="orb orb-pink" />
        <div className="orb orb-cyan" />
        <div className="orb orb-amber" />
      </div>
      <div className="bg-grid" />

      <div className="nav-wrap">
        <nav className="nav glass">
          <Link to="/" className="brand">
            <span className="brand-mark"><img src="/logo.png" alt="RepairConnect" /></span>
            RepairConnect
          </Link>
          <div className="nav-actions">
            <Link to="/login" className="ghost-link">Log in</Link>
            <Link to="/signup" className="btn btn-brand nav-desktop-logout">Get started</Link>
            <button
              className={`nav-hamburger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </nav>
      </div>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-actions">
          <Link to="/login" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Log in</Link>
          <Link to="/signup" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Get started</Link>
        </div>
      </div>

      <header className="hero section">
        <div className="hero-copy">
          <h1>
            <span className="ln">Repairs, done</span>
            <span className="ln"><span className="grad">right, right</span> on time.</span>
          </h1>
          <p>
            Describe the problem once — a verified specialist with the exact skills you
            need picks it up and comes to you. Track, chat, and pay, all in one place.
          </p>
          <div className="hero-ctas">
            <Link to="/signup" className="btn btn-brand btn-lg">
              Request a repair
            </Link>
            <Link to="/signup" className="btn btn-ghost btn-lg">
              Join as technician
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <b>12,400+</b>
              <span>jobs completed</span>
            </div>
            <div className="stat">
              <b>820+</b>
              <span>verified pros</span>
            </div>
            <div className="stat">
              <b style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11.05 4.9l1.4-2.8a.8.8 0 0 1 1.43 0l1.4 2.8 3.13.46a.8.8 0 0 1 .44 1.36l-2.26 2.2.53 3.12a.8.8 0 0 1-1.16.84L12 11.9l-2.8 1.48a.8.8 0 0 1-1.16-.84l.53-3.12-2.26-2.2a.8.8 0 0 1 .44-1.36l3.3-.46z" />
                </svg>
                4.8
              </b>
              <span>average rating</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="viz-card glass-strong">
            <div className="viz-top">
              <span className="viz-avatar">RS</span>
              <div className="who">
                <b>Ram Sharma</b>
                <span>AC &amp; Refrigeration Specialist</span>
              </div>
              <span className="badge-accept">Accepted</span>
            </div>
            <JobTracker dot="step-done" label="Request matched — AC Repair" />
            <JobTracker dot="step-done" label="Scheduled — Today, 2:00 PM" />
            <JobTracker dot="step-on" label="Technician on the way" />
            <div className="viz-meta">
              <span className="chip">Birtamode</span>
              <span className="chip">~8 min away</span>
            </div>
          </div>

          <div className="viz-float vf-rating glass-strong">
            <Icon path="M11.05 4.9l1.4-2.8a.8.8 0 0 1 1.43 0l1.4 2.8 3.13.46a.8.8 0 0 1 .44 1.36l-2.26 2.2.53 3.12a.8.8 0 0 1-1.16.84L12 11.9l-2.8 1.48a.8.8 0 0 1-1.16-.84l.53-3.12-2.26-2.2a.8.8 0 0 1 .44-1.36l3.3-.46z" size={18} />
            <div>
              <div className="big">4.9</div>
              <div className="lbl">128 reviews</div>
            </div>
          </div>

          <div className="viz-float vf-earn glass-strong">
            <div>
              <div className="big">₹2,500</div>
              <div className="lbl">Estimate approved</div>
            </div>
          </div>
        </div>
      </header>

      <div className="logo-strip section">
        <span className="logo-chip">AC Repair</span>
        <span className="logo-chip">Plumbing</span>
        <span className="logo-chip">Electrical</span>
        <span className="logo-chip">Appliance</span>
        <span className="logo-chip">Carpentry</span>
        <span className="logo-chip">Mobile &amp; Laptop</span>
      </div>

      <div className="sec-head section">
        <span className="eyebrow">Why RepairConnect</span>
        <h2>Everything a repair should be</h2>
        <p>Simple to request, simple to track, simple to trust.</p>
      </div>

      <div className="feat-grid section">
        {features.map((f, i) => (
          <div key={i} className="feat-card glass">
            <div className="feat-icon">
              <Icon path={f.icon} />
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="sec-head section">
        <span className="eyebrow">How it works</span>
        <h2>From broken to fixed in three steps</h2>
      </div>

      <div className="steps-grid section">
        {steps.map((s, i) => (
          <div key={i} className="step-card glass">
            <span className="step-num">{s.num}</span>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="cta-band">
        <h2>Something broken? We know a person.</h2>
        <p>
          Join thousands of homes and businesses that get repairs handled in
          hours, not days.
        </p>
        <Link to="/signup" className="btn btn-white btn-lg">
          Start a request — it's free
        </Link>
      </div>

      <footer className="footer">
        <div className="footer-inner">
          <span>© 2026 RepairConnect</span>
          <div className="mini-links">
            <a href="#/login">Help</a>
            <a href="#/signup">Become a pro</a>
            <a href="#/login">Privacy</a>
            <a href="#/login">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;