import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import OrderJourney from './OrderJourney';
import ChatBox from './ChatBox';
import BillView from './BillView';
import { API_URL, getCurrentUser } from '../lib/auth';

const STATUS_LABEL = {
  recruiting: 'Searching',
  accepted: 'Accepted',
  departed: 'Technician departed',
  reached: 'Technician reached',
  billing: 'Preparing bill',
  finished: 'Finished',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

const fmtDate = (s) => {
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return s;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const ACTIVE = ['accepted', 'departed', 'reached', 'billing'];

const OrdersPage = () => {
  const user = getCurrentUser();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'customer') return <Navigate to="/" replace />;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(null);
  const [billOpen, setBillOpen] = useState(null);

  useEffect(() => {
    const load = () => {
      fetch(`${API_URL}/orders.php?user_id=${user.id}`)
        .then((r) => r.json())
        .then((d) => setOrders(d.success ? d.orders || [] : []))
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    };
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [user.id]);

  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const past = orders.filter((o) => !ACTIVE.includes(o.status));

  return (
    <DashboardShell minimal>
      <div className="tech-wrap">
        <div className="tech-top">
          <div className="tech-title">
            <h2>My orders</h2>
            <p>{active.length ? `${active.length} active order${active.length > 1 ? 's' : ''} · follow the technician live` : 'Track your repair orders and chat with technicians.'}</p>
          </div>
          <Link to="/book" className="btn btn-brand btn-lg">New order</Link>
        </div>

        {loading ? (
          <div className="book-card"><p style={{ color: 'var(--ink-faint)' }}>Loading your orders…</p></div>
        ) : orders.length === 0 ? (
          <div className="book-card empty-state">
            <span className="empty-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8" /></svg>
            </span>
            <p>No orders yet. Tap <b>New order</b> to request a technician.</p>
          </div>
        ) : (
          <>
            {active.map((o) => (
              <div className="book-card fade-in" style={{ marginBottom: 20 }} key={o.id}>
                <div className="ao-head">
                  <span className="extra-svc-badge">{o.service_icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b>{o.service} · #{o.id}</b>
                    <span className="hist-meta">Ordered {fmtDate(o.created_at)}</span>
                  </div>
                  <span className={`status-badge st-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                </div>

                <div className="ao-body">
                  <div className="ao-line">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21c-4.9-4.7-7-7.5-7-11a7 7 0 0 1 14 0c0 3.5-2.1 6.3-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                    {o.address || `${o.latitude}, ${o.longitude}`}
                  </div>
                  {o.technician_name && (
                    <div className="ao-line">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
                      <b>{o.technician_name}</b> · {o.technician_phone}
                    </div>
                  )}
                </div>

                <OrderJourney status={o.status} />

                {(o.status === 'reached' || o.status === 'billing' || o.status === 'finished') && (
                  <BillView requestId={o.id} />
                )}

                <div className="ao-foot">
                  <button className="btn btn-ghost btn-sm" onClick={() => setChatOpen(chatOpen === o.id ? null : o.id)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: -3 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    {chatOpen === o.id ? 'Hide chat' : 'Chat with technician'}
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
                    <p>Completed and closed requests</p>
                  </div>
                </div>
                <div className="hist-list">
                  {past.map((o) => (
                    <div key={o.id} className="hist-row-wrap">
                      <div className="hist-row">
                        <span className="extra-svc-badge">{o.service_icon}</span>
                        <div className="hist-main">
                          <b>{o.service}</b>
                          <span className="hist-meta">Order #{o.id} · {fmtDate(o.created_at)}</span>
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
          </>
        )}
      </div>
    </DashboardShell>
  );
};

export default OrdersPage;