import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import { API_URL, getCurrentUser, setCurrentUser, clearCurrentUser } from '../lib/auth';

const STATUS_MAP = {
  recruiting:  { label: 'Searching',   cls: 'st-search' },
  accepted:    { label: 'Accepted',    cls: 'st-accepted' },
  departed:    { label: 'Departed',    cls: 'st-departed' },
  reached:     { label: 'Reached',     cls: 'st-reached' },
  billing:     { label: 'Billing',     cls: 'st-billing' },
  finished:    { label: 'Finished',    cls: 'st-finished' },
  cancelled:   { label: 'Cancelled',   cls: 'st-rejected' },
  rejected:    { label: 'Rejected',    cls: 'st-rejected' },
};

const roleLabel = {
  superadmin: 'Super Admin',
  technician: 'Technician',
  customer: 'Customer',
};

const initialsOf = (name = '') =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'U';

const fmtDate = (s) => {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return s;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);

  const [showSupport, setShowSupport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadHistory = () => {
    setHistLoading(true);
    fetch(`${API_URL}/my_requests.php?user_id=${user.id}`)
      .then((r) => r.json())
      .then((d) => setHistory(d.success ? d.requests || [] : []))
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProfileErr('');
    setProfileMsg('');
    try {
      const res = await fetch(`${API_URL}/update_profile.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, name, email, phone, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setProfileErr(data.message);
        return;
      }
      setCurrentUser(data.user);
      setName(data.user.name);
      setEmail(data.user.email);
      setPhone(data.user.phone);
      setPassword('');
      setProfileMsg(data.message);
    } catch {
      setProfileErr('Unable to reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await fetch(`${API_URL}/delete_account.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
    } catch {
      /* ignore network errors */
    }
    clearCurrentUser();
    navigate('/', { replace: true });
  };

  if (!user) return null;

  const initials = initialsOf(user.name);
  const role = roleLabel[user.role] || user.role;

  return (
    <DashboardShell minimal>
      <div className="settings-wrap">
        {/* Profile header */}
        <div className="profile-card">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-main">
            <h2>{user.name}</h2>
            <p>{user.email} · {user.phone}</p>
          </div>
          <span className="welcome-role">{role}</span>
        </div>

        <div className="settings-grid">
          {/* Credentials */}
          <div className="book-card fade-in">
            <div className="card-head">
              <span className="card-head-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
              </span>
              <div className="ch-title">
                <h2>Edit credentials</h2>
                <p>Update your name, email, phone or password</p>
              </div>
            </div>

            {profileMsg && <div className="alert" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857' }}>{profileMsg}</div>}
            {profileErr && <div className="alert">{profileErr}</div>}

            <form onSubmit={saveProfile}>
              <div className="form-group">
                <label htmlFor="s-name">Full name</label>
                <input id="s-name" className="form-input" type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="s-email">Email address</label>
                <input id="s-email" className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="s-phone">Phone number</label>
                <input id="s-phone" className="form-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="s-pass">New password <span className="opt">(optional)</span></label>
                <input id="s-pass" className="form-input" type="password" placeholder="Leave empty to keep current password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button className="btn btn-brand" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>

          <div className="settings-col">
            {/* Booking history */}
            <div className="book-card fade-in">
              <div className="card-head">
                <span className="card-head-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8" /></svg>
                </span>
                <div className="ch-title">
                  <h2>Order history</h2>
                  <p>{histLoading ? 'Loading…' : history.length > 0 ? `${history.length} order${history.length > 1 ? 's' : ''} so far` : 'No orders yet'}</p>
                </div>
              </div>

              {histLoading ? (
                <p style={{ color: 'var(--ink-faint)', fontSize: '0.9rem' }}>Loading your requests…</p>
              ) : history.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8" /></svg>
                  </span>
                  <p>No orders yet.</p>
                </div>
              ) : (
                <div className="hist-list">
                  {history.map((h) => {
                    const st = STATUS_MAP[h.status] || { label: h.status, cls: '' };
                    return (
                      <div className="hist-row" key={h.id}>
                        <span className="extra-svc-badge">{h.service_icon || ''}</span>
                        <div className="hist-main">
                          <b>{h.service}</b>
                          <span className="hist-meta">Request #{h.id} · {fmtDate(h.created_at)}</span>
                          {h.address && <span className="hist-meta">{h.address}</span>}
                        </div>
                        <span className={`status-badge ${st.cls}`}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Support + delete */}
            <div className="book-card fade-in">
              <div className="card-head">
                <span className="card-head-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></svg>
                </span>
                <div className="ch-title">
                  <h2>Help & account</h2>
                  <p>We are here if you need us</p>
                </div>
              </div>
              <div className="mini-actions">
                <button className="btn btn-ghost btn-full" onClick={() => setShowSupport(true)}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, verticalAlign: -3 }}>
                    <path d="M4 13a8 8 0 0 1 16 0" />
                    <path d="M19 13v3a2 2 0 0 1-2 2h-1v3H8v-5" />
                    <path d="M4 13H2a2 2 0 0 0 0 4h2" />
                  </svg>
                  Support
                </button>
                <button className="btn btn-danger btn-full" onClick={() => setShowDelete(true)}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, verticalAlign: -3 }}>
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                  Delete account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support modal */}
      {showSupport && (
        <div className="modal-overlay" onClick={() => setShowSupport(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-logo">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13a8 8 0 0 1 16 0" /><path d="M19 13v3a2 2 0 0 1-2 2h-1v3H8v-5" /><path d="M4 13H2a2 2 0 0 0 0 4h2" /></svg>
              </div>
              <h2>Support</h2>
              <p>We are here to help. Reach us any time.</p>
              <button className="modal-close" onClick={() => setShowSupport(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <a className="contact-row" href="tel:+9779700159343">
                <span className="contact-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                </span>
                <div>
                  <b>Contact</b>
                  <span className="contact-value">+977 9700-159343</span>
                </div>
              </a>
              <a className="contact-row" href="mailto:info@utshavkatuwal.com.np">
                <span className="contact-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                </span>
                <div>
                  <b>Email</b>
                  <span className="contact-value">info@utshavkatuwal.com.np</span>
                </div>
              </a>
            </div>
            <button className="btn btn-brand btn-full" onClick={() => setShowSupport(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Delete account confirm modal */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal-card modal-danger" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-logo danger">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
              </div>
              <h2>Delete account?</h2>
              <p>All your bookings and data will be permanently removed. This cannot be undone.</p>
              <button className="modal-close" onClick={() => setShowDelete(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowDelete(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={deleteAccount} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default SettingsPage;