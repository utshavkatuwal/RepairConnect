import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, clearCurrentUser } from '../lib/auth';

const roleLabel = {
  superadmin: 'Super Admin',
  technician: 'Technician',
  customer: 'Customer',
};

const roleHome = {
  superadmin: '/admin',
  technician: '/technician',
  customer: '/book',
};

const initialsOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

const DashboardShell = ({ children, minimal = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const initials = initialsOf(user.name);
  const role = roleLabel[user.role] || user.role;
  const home = roleHome[user.role] || '/';

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    clearCurrentUser();
    closeMenu();
    navigate('/', { replace: true });
  };

  const active = (path) => (location.pathname.startsWith(path) ? ' active' : '');

  const links = [];
  if (user.role === 'customer') {
    links.push(
      { to: '/book', label: 'New order', cls: 'brand-link' },
      { to: '/orders', label: 'My orders' },
      { to: '/settings', label: 'Settings' },
    );
  } else if (user.role === 'technician') {
    links.push(
      { to: '/technician', label: 'Orders' },
      { to: '/tech-orders', label: 'My orders' },
      { to: '/settings', label: 'Settings' },
    );
  }

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
        <nav className="nav">
          <Link to={home} className="brand">
            <span className="brand-mark"><img src="/logo.png" alt="RepairConnect" /></span>
            RepairConnect
          </Link>
          <div className="nav-actions">
            {user.role === 'customer' && (
              <>
                <Link to="/book" className="btn btn-brand btn-sm">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  New order
                </Link>
                <Link to="/orders" className="btn btn-ghost btn-sm" title="My orders">My orders</Link>
                <Link to="/settings" className="btn btn-ghost btn-sm" title="Settings">Settings</Link>
              </>
            )}
            {user.role === 'technician' && (
              <>
                <Link to="/technician" className="btn btn-ghost btn-sm" title="Available orders">Orders</Link>
                <Link to="/tech-orders" className="btn btn-ghost btn-sm" title="My orders">My orders</Link>
                <Link to="/settings" className="btn btn-ghost btn-sm" title="Settings">Settings</Link>
              </>
            )}
            <div className="nav-user">
              <span className="nav-avatar">{initials}</span>
              <div className="nav-user-meta">
                <b>{user.name}</b>
                <span>{role}</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm nav-desktop-logout" onClick={handleLogout}>
              Log out
            </button>
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
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={`mobile-menu-link${active(l.to)}${l.cls ? ' ' + l.cls : ''}`} onClick={closeMenu}>
              {l.label}
            </Link>
          ))}
          <button className="mobile-menu-link mobile-menu-link-btn" onClick={handleLogout}>Log out</button>
        </div>
        <div className="mobile-menu-foot">
          <span className="nav-avatar">{initials}</span>
          <div className="nav-user-meta">
            <b>{user.name}</b>
            <span>{role}</span>
          </div>
        </div>
      </div>

      <div className="dash-body section">
        {!minimal && (
          <div className="welcome">
            <Link to={home} className="welcome-avatar" style={{ textDecoration: 'none' }}>{initials}</Link>
            <div className="welcome-copy">
              <h1>
                Welcome, <span className="grad">{user.name}</span>
              </h1>
              <p>
                {user.email}
                <span className="welcome-dot">•</span>
                <span className="welcome-role">{role}</span>
              </p>
            </div>
          </div>
        )}

        <main className="dash-content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardShell;