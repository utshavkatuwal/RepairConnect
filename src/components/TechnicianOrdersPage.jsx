import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import OrderJourney from './OrderJourney';
import ChatBox from './ChatBox';
import BillEditor from './BillEditor';
import BillView from './BillView';
import { API_URL, getCurrentUser } from '../lib/auth';

const STATUS_LABEL = {
  accepted: 'Accepted',
  departed: 'Departed',
  reached: 'Reached',
  billing: 'Billing',
  finished: 'Finished',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

const ACTIVE = ['accepted', 'departed', 'reached', 'billing'];

const fmtDate = (s) => {
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return s;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const navUrl = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

const TechnicianOrdersPage = () => {
  const user = getCurrentUser();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'technician') return <Navigate to="/technician" replace />;

  const [orders, setOrders] = useState([]);
  const [chatOpen, setChatOpen] = useState(null);
  const [billOpen, setBillOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const load = () => {
      fetch(`${API_URL}/orders.php?user_id=${user.id}`)
        .then((r) => r.json())
        .then((d) => {
          const all = d.success ? d.orders || [] : [];
          setOrders(all.filter((o) => o.technician_id === user.id));
        })
        .catch(() => setOrders([]));
    };
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [user.id]);

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
      if (!data.success) setErr(data.message);
    } catch {
      setErr('Unable to reach the server.');
    } finally {
      setBusy(false);
    }
  };

  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const past = orders.filter((o) => !ACTIVE.includes(o.status) && o.status !== 'recruiting');

  return (
    <DashboardShell minimal>
      <div className="tech-wrap">
        <div className="tech-top">
          <div className="tech-title">
            <h2>My orders</h2>
            <p>{active.length ? `${active.length} active order${active.length > 1 ? 's' : ''} — update the journey and chat with clients` : 'Orders you accept are listed here with live chat.'}</p>
          </div>
          <Link to="/technician" className="btn btn-ghost btn-lg">Orders</Link>
        </div>

        {err && <div className="alert">{err}</div>}

        {active.length > 0 && active.map((o) => (
          <div className="book-card fade-in" style={{ marginBottom: 20 }} key={o.id}>
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

            <OrderJourney status={o.status} canUpdate onUpdate={(s) => updateStatus(o.id, s)} />

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

        {past.length > 0 && (
          <div className="book-card">
            <div className="card-head">
              <span className="card-head-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8" /></svg>
              </span>
              <div className="ch-title">
                <h2>Past orders</h2>
                <p>Jobs you completed or that were closed</p>
              </div>
            </div>
            <div className="hist-list">
              {past.map((o) => (
                <div key={o.id} className="hist-row-wrap">
                  <div className="hist-row">
                    <span className="extra-svc-badge">{o.service_icon}</span>
                    <div className="hist-main">
                      <b>{o.service}</b>
                      <span className="hist-meta">{o.customer_name} · {fmtDate(o.created_at)}</span>
                    </div>
                    <span className={`status-badge st-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                    {o.status === 'finished' && (
                      <button className="btn btn-ghost btn-xs" onClick={() => setBillOpen(billOpen === o.id ? null : o.id)}>
                        {billOpen === o.id ? 'Hide bill' : 'View bill'}
                      </button>
                    )}
                  </div>
                  {billOpen === o.id && (
                    <div style={{ padding: '0 16px 12px' }}>
                      <BillView requestId={o.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="book-card empty-state">
            <span className="empty-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
            </span>
            <p>No orders yet. Go to <b>Orders</b> and accept a request.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default TechnicianOrdersPage;