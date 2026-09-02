import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import OrderJourney from './OrderJourney';
import ChatBox from './ChatBox';
import BillEditor from './BillEditor';
import { API_URL, getCurrentUser } from '../lib/auth';

const ACTIVE_STATUSES = ['accepted', 'departed', 'reached', 'billing'];

const STATUS_LABEL = {
  recruiting: 'Available',
  accepted: 'Accepted',
  departed: 'Departed',
  reached: 'Reached',
  billing: 'Billing',
  finished: 'Finished',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

const timeAgo = (s) => {
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return '';
  const sec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return d.toLocaleDateString();
};

const navUrl = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

const TechnicianPanel = () => {
  const user = getCurrentUser();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'technician') return <Navigate to="/login" replace />;

  const [online, setOnline] = useState(null); // null = loading actual status from server
  const [toggling, setToggling] = useState(false);
  const [available, setAvailable] = useState([]);
  const [active, setActive] = useState([]);
  const [chatOpen, setChatOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Keep technician online across page refreshes — restore status from the server
  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/tech_status.php?user_id=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setOnline(d.success ? Boolean(d.online) : false);
      })
      .catch(() => { if (alive) setOnline(false); });
    return () => { alive = false; };
  }, [user.id]);

  const fetchOrders = async () => {
    try {
      const [av, al] = await Promise.all([
        fetch(`${API_URL}/available_orders.php?user_id=${user.id}`).then((r) => r.json()),
        fetch(`${API_URL}/orders.php?user_id=${user.id}`).then((r) => r.json()),
      ]);
      if (av.success) setAvailable(av.orders || []);
      if (al.success) {
        setActive((al.orders || []).filter((o) => ACTIVE_STATUSES.includes(o.status)));
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (online !== true) {
      setAvailable([]);
      setActive([]);
      return;
    }
    fetchOrders();
    const t = setInterval(fetchOrders, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const toggleOnline = async () => {
    if (online === null) return;
    setToggling(true);
    setErr('');
    try {
      const res = await fetch(`${API_URL}/tech_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, online: !online }),
      });
      const data = await res.json();
      if (!data.success) {
        setErr(data.message);
        return;
      }
      setOnline(Boolean(data.online));
      setChatOpen(null);
      if (data.online) {
        setAvailable([]);
        setActive([]);
      }
    } catch {
      setErr('Unable to reach the server.');
    } finally {
      setToggling(false);
    }
  };

  const acceptOrder = async (id) => {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch(`${API_URL}/accept_order.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: id, user_id: user.id }),
      });
      const data = await res.json();
      if (!data.success) {
        setErr(data.message);
        return;
      }
      fetchOrders();
    } catch {
      setErr('Unable to reach the server.');
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (id, status) => {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch(`${API_URL}/update_order_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: id, user_id: user.id, status }),
      });
      const data = await res.json();
      if (!data.success) {
        setErr(data.message);
        return;
      }
      fetchOrders();
    } catch {
      setErr('Unable to reach the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardShell minimal>
      <div className="tech-wrap">
        <div className="tech-top">
          <div className="tech-title">
            <h2>Technician dashboard</h2>
            <p>
              {online
                ? `You are online — ${available.length} order${available.length !== 1 ? 's' : ''} open right now.`
                : 'Go online to see live orders from customers near you.'}
            </p>
          </div>
          <button className={`btn ${online ? 'btn-ghost' : 'btn-brand'} btn-lg`} onClick={toggleOnline} disabled={toggling || online === null}>
            <span className={`live-dot ${online ? 'on' : ''}`} />
            {toggling ? 'Please wait…' : online ? 'Go offline' : 'Go online'}
          </button>
        </div>

        {err && <div className="alert">{err}</div>}

        {online === null ? (
          <div className="book-card offline-card fade-in">
            <div className="offline-icon">
              <span className="spinner" />
            </div>
            <h3>Loading your status…</h3>
          </div>
        ) : !online ? (
          <div className="book-card offline-card fade-in">
            <div className="offline-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect width="16" height="11" x="4" y="6" rx="2" />
                <path d="M8 11h8M8 15h4" />
              </svg>
            </div>
            <h3>You are offline</h3>
            <p>Orders only appear while you are online. Tap <b>Go online</b> to start receiving live customer requests.</p>
          </div>
        ) : (
          <>
            <div className="book-card fade-in">
              <div className="card-head">
                <span className="card-head-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                </span>
                <div className="ch-title">
                  <h2>Available orders</h2>
                  <p>New customer requests — accept to get connected in chat</p>
                </div>
              </div>

              {available.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
                  </span>
                  <p>No open orders right now. New requests will appear here live.</p>
                </div>
              ) : (
                <div className="order-grid">
                  {available.map((o) => (
                    <div className="avail-order" key={o.id}>
                      <div className="ao-head">
                        <span className="extra-svc-badge">{o.service_icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b>{o.service}</b>
                          <span className="hist-meta">Requested {timeAgo(o.created_at)}</span>
                        </div>
                        <span className="status-badge st-recruiting">New</span>
                      </div>
                      <div className="ao-body">
                        <div className="ao-line">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21c-4.9-4.7-7-7.5-7-11a7 7 0 0 1 14 0c0 3.5-2.1 6.3-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                          {o.customer_name}
                        </div>
                        <div className="ao-line">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                          {o.address || `${o.latitude}, ${o.longitude}`}
                        </div>
                      </div>
                      <div className="ao-foot">
                        <button className="btn btn-brand btn-sm" onClick={() => acceptOrder(o.id)} disabled={busy}>
                          Accept order
                        </button>
                        {o.latitude && o.longitude && (
                          <a className="btn btn-ghost btn-sm" href={navUrl(o.latitude, o.longitude)} target="_blank" rel="noreferrer">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="book-card fade-in" style={{ marginTop: 20 }}>
              <div className="card-head">
                <span className="card-head-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <div className="ch-title">
                  <h2>My active orders</h2>
                  <p>{active.length ? `${active.length} order${active.length > 1 ? 's' : ''} in progress` : 'Nothing in progress yet'}</p>
                </div>
              </div>

              {active.length === 0 ? (
                <div className="empty-state">
                  <p>Accept an order above and it will appear here with chat.</p>
                </div>
              ) : (
                <div className="order-grid">
                  {active.map((o) => (
                    <div className="avail-order" key={o.id}>
                      <div className="ao-head">
                        <span className="extra-svc-badge">{o.service_icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b>{o.service} · #{o.id}</b>
                          <span className="hist-meta">{o.customer_name} · {o.customer_phone}</span>
                        </div>
                        <span className={`status-badge st-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                      </div>
                      <div className="ao-body">
                        <div className="ao-line">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                          {o.address || `${o.latitude}, ${o.longitude}`}
                        </div>
                        {o.latitude && o.longitude && (
                          <a className="nav-btn" href={navUrl(o.latitude, o.longitude)} target="_blank" rel="noreferrer">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11 22 2l-9 19-2-8-8-2z" /></svg>
                            Navigate to customer
                          </a>
                        )}
                      </div>

                      <OrderJourney
                        status={o.status}
                        canUpdate
                        onUpdate={(s) => updateStatus(o.id, s)}
                      />

                      {(o.status === 'reached' || o.status === 'billing') && (
                        <BillEditor requestId={o.id} userId={user.id} onRefresh={fetchOrders} />
                      )}

                      <div className="ao-foot">
                        <button className="btn btn-ghost btn-sm" onClick={() => setChatOpen(chatOpen === o.id ? null : o.id)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: -3 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                          {chatOpen === o.id ? 'Hide chat' : 'Chat with customer'}
                        </button>
                      </div>

                      {chatOpen === o.id && (
                        <div style={{ marginTop: 12 }}>
                          <ChatBox requestId={o.id} viewerId={user.id} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
};

export default TechnicianPanel;