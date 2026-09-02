import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import BillView from './BillView';
import { API_URL, getCurrentUser } from '../lib/auth';

const ROLE_LABEL = { customer: 'Customer', technician: 'Technician', superadmin: 'Super Admin' };

const STATUS_LABEL = {
  recruiting: { label: 'Searching', cls: 'st-recruiting' },
  accepted:   { label: 'Accepted',  cls: 'st-accepted' },
  departed:   { label: 'Departed',  cls: 'st-departed' },
  reached:    { label: 'Reached',   cls: 'st-reached' },
  billing:    { label: 'Billing',   cls: 'st-billing' },
  finished:   { label: 'Finished',  cls: 'st-finished' },
  cancelled:  { label: 'Cancelled', cls: 'st-rejected' },
  rejected:   { label: 'Rejected',  cls: 'st-rejected' },
};

const fmtDate = (s) => {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return s;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const initialsOf = (name = '') =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'U';

const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

const AdminPanel = () => {
  const user = getCurrentUser();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'superadmin') return <Navigate to="/" replace />;

  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [userModal, setUserModal] = useState(null); // { mode, user } | null
  const [serviceModal, setServiceModal] = useState(null); // { mode, service } | null
  const [confirmDel, setConfirmDel] = useState(null); // { kind, id, name }
  const [saving, setSaving] = useState(false);

  const loadStats = () =>
    fetch(`${API_URL}/admin_stats.php?admin_id=${user.id}`)
      .then((r) => r.json())
      .then((d) => setStats(d.success ? d.stats : null))
      .catch(() => {});

  const loadUsers = (role) =>
    fetch(`${API_URL}/admin_users.php?admin_id=${user.id}&role=${role}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.success ? d.users || [] : []))
      .catch(() => setUsers([]));

  const loadServices = () =>
    fetch(`${API_URL}/admin_services.php?admin_id=${user.id}`)
      .then((r) => r.json())
      .then((d) => setServices(d.success ? d.services || [] : []))
      .catch(() => setServices([]));

  const loadOrders = () =>
    fetch(`${API_URL}/admin_orders.php?admin_id=${user.id}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.success ? d.orders || [] : []))
      .catch(() => setOrders([]));

  useEffect(() => {
    setLoading(true);
    setErr('');
    if (tab === 'overview') {
      Promise.all([loadStats()]).finally(() => setLoading(false));
    } else if (tab === 'technicians' || tab === 'customers') {
      Promise.all([loadUsers(tab)]).finally(() => setLoading(false));
    } else if (tab === 'services') {
      Promise.all([loadServices()]).finally(() => setLoading(false));
    } else if (tab === 'orders') {
      Promise.all([loadOrders()]).finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user.id]);

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reloadAll = () => {
    loadStats();
    loadServices();
    if (tab === 'technicians' || tab === 'customers') loadUsers(tab);
    if (tab === 'orders') loadOrders();
  };

  const saveUser = async (payload) => {
    setSaving(true);
    setErr('');
    try {
      const res = await fetch(`${API_URL}/admin_users.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, admin_id: user.id }),
      });
      const data = await res.json();
      if (!data.success) {
        setErr(data.message);
        return false;
      }
      setUserModal(null);
      reloadAll();
      return true;
    } catch {
      setErr('Unable to reach the server.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveService = async (payload) => {
    setSaving(true);
    setErr('');
    try {
      const res = await fetch(`${API_URL}/admin_services.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, admin_id: user.id }),
      });
      const data = await res.json();
      if (!data.success) {
        setErr(data.message);
        return false;
      }
      setServiceModal(null);
      reloadAll();
      return true;
    } catch {
      setErr('Unable to reach the server.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleService = async (s) => {
    const res = await fetch(`${API_URL}/admin_services.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_id: user.id, action: 'toggle', service_id: s.id, is_active: !s.is_active }),
    });
    const data = await res.json();
    if (!data.success) setErr(data.message);
    reloadAll();
  };

  const confirmDelete = async () => {
    if (!confirmDel) return;
    setSaving(true);
    setErr('');
    try {
      const { kind, id } = confirmDel;
      const ep = kind === 'user' ? 'admin_users.php' : kind === 'service' ? 'admin_services.php' : 'admin_orders.php';
      const res = await fetch(`${API_URL}/${ep}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: user.id, action: 'delete', user_id: id, service_id: id, request_id: id }),
      });
      const data = await res.json();
      if (!data.success) {
        setErr(data.message);
        setConfirmDel(null);
        return;
      }
      setConfirmDel(null);
      reloadAll();
    } catch {
      setErr('Unable to reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const adminNav = (
    <nav className="admin-tabs">
      {[
        ['overview', 'Overview'],
        ['technicians', 'Technicians'],
        ['customers', 'Customers'],
        ['services', 'Services'],
        ['orders', 'Orders'],
      ].map(([key, label]) => (
        <button key={key} className={`admin-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
          {label}
        </button>
      ))}
    </nav>
  );

  return (
    <DashboardShell minimal>
      <div className="tech-wrap">
        {adminNav}
        {err && <div className="alert">{err}</div>}

        {loading ? (
          <div className="book-card"><p style={{ color: 'var(--ink-faint)' }}>Loading…</p></div>
        ) : (
          <>
            {tab === 'overview' && (
              <OverviewTab
                stats={stats}
                services={services}
                onNewTech={() => setUserModal({ mode: 'create', user: { role: 'technician' } })}
                onNewCust={() => setUserModal({ mode: 'create', user: { role: 'customer' } })}
                onNewService={() => setServiceModal({ mode: 'create', service: null })}
              />
            )}

            {tab === 'technicians' && (
              <UsersTable
                list={users}
                role="technician"
                onAdd={() => setUserModal({ mode: 'create', user: { role: 'technician' } })}
                onEdit={(u) => setUserModal({ mode: 'edit', user: u })}
                onDelete={(u) => setConfirmDel({ kind: 'user', id: u.id, name: u.full_name })}
              />
            )}

            {tab === 'customers' && (
              <UsersTable
                list={users}
                role="customer"
                onAdd={() => setUserModal({ mode: 'create', user: { role: 'customer' } })}
                onEdit={(u) => setUserModal({ mode: 'edit', user: u })}
                onDelete={(u) => setConfirmDel({ kind: 'user', id: u.id, name: u.full_name })}
              />
            )}

            {tab === 'services' && (
              <ServicesTable
                list={services}
                onAdd={() => setServiceModal({ mode: 'create', service: null })}
                onEdit={(s) => setServiceModal({ mode: 'edit', service: s })}
                onToggle={toggleService}
                onDelete={(s) => setConfirmDel({ kind: 'service', id: s.id, name: s.name })}
              />
            )}

            {tab === 'orders' && (
              <OrdersTable list={orders} onCancel={(o) => setConfirmDel({ kind: 'order-cancel', id: o.id, name: `Order #${o.id}` })} onDelete={(o) => setConfirmDel({ kind: 'order', id: o.id, name: `Order #${o.id}` })} />
            )}
          </>
        )}
      </div>

      {userModal && (
        <UserModal
          mode={userModal.mode}
          user={userModal.user}
          services={services}
          saving={saving}
          onSave={saveUser}
          onClose={() => setUserModal(null)}
        />
      )}

      {serviceModal && (
        <ServiceModal
          mode={serviceModal.mode}
          service={serviceModal.service}
          saving={saving}
          onSave={saveService}
          onClose={() => setServiceModal(null)}
        />
      )}

      {confirmDel && (
        <Modal title="Confirm" onClose={() => setConfirmDel(null)}>
          <div className="modal-danger">
            <div className="modal-logo danger" style={{ margin: '0 auto 14px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
            </div>
            <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>
              <b>{confirmDel.name}</b>{' '}
              {confirmDel.kind === 'order-cancel'
                ? 'will be marked as cancelled.'
                : 'will be permanently deleted. This cannot be undone.'}
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={saving}>
                {saving ? 'Working…' : confirmDel.kind === 'order-cancel' ? 'Yes, cancel order' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardShell>
  );
};

/* ---------- Overview ---------- */
const OverviewTab = ({ stats, services, onNewTech, onNewCust, onNewService }) => {
  const cards = [
    ['Customers', stats?.customers || 0, 'customer'],
    ['Technicians', stats?.technicians || 0, 'technician'],
    ['Online now', stats?.online_technicians || 0, 'online'],
    ['Services', stats?.services || 0, 'service'],
    ['Open orders', stats?.open_orders || 0, 'open'],
    ['Active jobs', stats?.active_orders || 0, 'active'],
    ['Finished', stats?.finished_orders || 0, 'finished'],
    ['Cancelled', stats?.cancelled_orders || 0, 'cancelled'],
    ['Bills issued', stats?.bills || 0, 'billing'],
    ['Revenue', stats?.revenue ? `Rs ${Number(stats.revenue).toLocaleString()}` : 'Rs 0', 'revenue'],
  ];

  return (
    <>
      <div className="admin-cta">
        <div className="tech-title">
          <h2>Admin dashboard</h2>
          <p>Everything in RepairConnect is managed here.</p>
        </div>
        <div className="tech-top-actions">
          <button className="btn btn-ghost btn-sm" onClick={onNewCust}>+ Customer</button>
          <button className="btn btn-ghost btn-sm" onClick={onNewTech}>+ Technician</button>
          <button className="btn btn-brand btn-sm" onClick={onNewService}>+ Service</button>
        </div>
      </div>

      <div className="stat-grid">
        {cards.map(([label, value, key]) => (
          <div className="stat-card" key={key}>
            <span className={`stat-dot ${key}`} />
            <div>
              <b>{value}</b>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

/* ---------- Users table (technicians / customers) ---------- */
const UsersTable = ({ list, role, onAdd, onEdit, onDelete }) => {
  const isTech = role === 'technician';
  return (
    <div className="book-card fade-in">
      <div className="card-head">
        <span className="card-head-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8" /></svg>
        </span>
        <div className="ch-title">
          <h2>{isTech ? 'Technicians' : 'Customers'}</h2>
          <p>{list.length} registered</p>
        </div>
        <button className="btn btn-brand btn-sm" onClick={onAdd}>+ Add {isTech ? 'technician' : 'customer'}</button>
      </div>

      {list.length === 0 ? (
        <div className="empty-state"><p>Nothing here yet.</p></div>
      ) : (
        <div className="atable">
          {list.map((u) => (
            <div className="arow" key={u.id}>
              <span className="nav-avatar">{initialsOf(u.full_name)}</span>
              <div className="arow-main">
                <b>{u.full_name}</b>
                <span className="hist-meta">{u.email} · {u.phone}</span>
                {isTech && (
                  <div className="chip-list">
                    {u.services && u.services.length > 0 ? (
                      u.services.map((sv) => <span className="chip" key={sv}>{sv}</span>)
                    ) : (
                      <span className="chip chip-warn">No services</span>
                    )}
                    <span className={`status-badge ${u.is_online ? 'st-accepted' : 'st-rejected'}`}>
                      {u.is_online ? 'Online' : 'Offline'}
                    </span>
                    <span className="hist-meta">{u.jobs_done || 0} jobs</span>
                  </div>
                )}
              </div>
              <div className="arow-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(u)}>Edit</button>
                <button className="btn btn-sm btn-icon-danger" onClick={() => onDelete(u)} title="Delete">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- Services table ---------- */
const ServicesTable = ({ list, onAdd, onEdit, onToggle, onDelete }) => (
  <div className="book-card fade-in">
    <div className="card-head">
      <span className="card-head-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.34 15.66a5.5 5.5 0 0 0 7.78 0l3.54-3.54a5.5 5.5 0 0 0-7.78-7.78l-1.28 1.28M6.42 19.42a5.5 5.5 0 0 0 7.78-6l-3.53 3.53a2 2 0 0 1-2.83 0l-1.42-1.42a2 2 0 0 1 0-2.83l3.54-3.53a5.5 5.5 0 0 0-7.78 7.77Z" /></svg>
      </span>
      <div className="ch-title">
        <h2>Services</h2>
        <p>{list.length} total · {list.filter((s) => s.is_active).length} active</p>
      </div>
      <button className="btn btn-brand btn-sm" onClick={onAdd}>+ Add service</button>
    </div>

    {list.length === 0 ? (
      <div className="empty-state"><p>No services yet.</p></div>
    ) : (
      <div className="atable">
        {list.map((s) => (
          <div className="arow" key={s.id}>
            <span className="extra-svc-badge">{s.icon}</span>
            <div className="arow-main">
              <b>{s.name}</b>
              <span className="hist-meta">{s.description || 'No description'}</span>
            </div>
            <span className={`status-badge ${s.is_active ? 'st-finished' : 'st-rejected'}`}>
              {s.is_active ? 'Active' : 'Hidden'}
            </span>
            <div className="arow-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => onToggle(s)}>
                {s.is_active ? 'Hide' : 'Show'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit(s)}>Edit</button>
              <button className="btn btn-sm btn-icon-danger" onClick={() => onDelete(s)} title="Delete">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

/* ---------- Orders table ---------- */
const OrdersTable = ({ list, onCancel, onDelete }) => {
  const [billOpen, setBillOpen] = useState(null);
  return (
    <div className="book-card fade-in">
      <div className="card-head">
        <span className="card-head-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8" /></svg>
        </span>
        <div className="ch-title">
          <h2>Orders</h2>
          <p>{list.length} records</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty-state"><p>No orders yet.</p></div>
      ) : (
        <div className="atable">
          {list.map((o) => {
            const st = STATUS_LABEL[o.status] || { label: o.status, cls: '' };
            return (
              <div className="arow-wrap" key={o.id}>
                <div className="arow">
                  <div className="arow-main">
                    <b>{o.service} <span className="hist-meta">· #{o.id}</span></b>
                    <span className="hist-meta">
                      {o.customer_name}{o.technician_name ? ` → ${o.technician_name}` : ''} · {fmtDate(o.created_at)}
                    </span>
                    {o.address && <span className="hist-meta">{o.address}</span>}
                  </div>
                  <span className={`status-badge ${st.cls}`}>{st.label}</span>
                  <div className="arow-actions">
                    {['recruiting', 'accepted', 'departed', 'reached', 'billing'].includes(o.status) && (
                      <button className="btn btn-ghost btn-sm" onClick={() => onCancel(o)}>Cancel</button>
                    )}
                    {o.status === 'finished' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => setBillOpen(billOpen === o.id ? null : o.id)}>
                        {billOpen === o.id ? 'Hide bill' : 'View bill'}
                      </button>
                    )}
                    <button className="btn btn-sm btn-icon-danger" onClick={() => onDelete(o)} title="Delete">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                    </button>
                  </div>
                </div>
                {billOpen === o.id && (
                  <div style={{ padding: '0 16px 14px' }}>
                    <BillView requestId={o.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ---------- User create/edit modal ---------- */
const UserModal = ({ mode, user, services, saving, onSave, onClose }) => {
  const isTech = user.role === 'technician';
  const [name, setName] = useState(mode === 'edit' ? user.full_name || '' : '');
  const [email, setEmail] = useState(mode === 'edit' ? user.email || '' : '');
  const [phone, setPhone] = useState(mode === 'edit' ? user.phone || '' : '');
  const [password, setPassword] = useState('');
  const [selected, setSelected] = useState(mode === 'edit' && isTech ? new Set(user.services || []) : new Set());
  const [localErr, setLocalErr] = useState('');

  const toggleSvc = (sname) => {
    const next = new Set(selected);
    if (next.has(sname)) next.delete(sname);
    else next.add(sname);
    setSelected(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (isTech && selected.size === 0) {
      setLocalErr('Select at least one service.');
      return;
    }
    const svcIds = services.filter((s) => selected.has(s.name)).map((s) => s.id);
    const ok = await onSave({
      action: mode === 'create' ? 'create' : 'update',
      role: user.role,
      user_id: mode === 'edit' ? user.id : undefined,
      name,
      email,
      phone,
      password,
      services: isTech ? svcIds : undefined,
    });
    if (!ok) setLocalErr('Please fix the highlighted issues above.');
  };

  return (
    <Modal title={mode === 'create' ? `Add ${isTech ? 'technician' : 'customer'}` : `Edit ${isTech ? 'technician' : 'customer'}`} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-group">
          <label>Full name</label>
          <input className="form-input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Email address</label>
          <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Phone number</label>
          <input className="form-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password <span className="opt">{mode === 'edit' ? '(optional — leave blank to keep)' : ''}</span></label>
          <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={mode === 'create'} minLength={6} />
        </div>

        {isTech && (
          <div className="form-group">
            <label>Services they provide</label>
            <div className="svc-cols">
              {services.map((s) => {
                const on = selected.has(s.name);
                return (
                  <label className={`svc-opt ${on ? 'on' : ''}`} key={s.id}>
                    <input type="checkbox" checked={on} onChange={() => toggleSvc(s.name)} />
                    <span className="mini-badge">{s.icon}</span>
                    {s.name}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {localErr && <div className="alert">{localErr}</div>}

        <div className="modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-brand" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

/* ---------- Service create/edit modal ---------- */
const ServiceModal = ({ mode, service, saving, onSave, onClose }) => {
  const [name, setName] = useState(mode === 'edit' ? service.name || '' : '');
  const [description, setDescription] = useState(mode === 'edit' ? service.description || '' : '');
  const [icon, setIcon] = useState(mode === 'edit' ? service.icon || 'AC' : 'AC');
  const [active, setActive] = useState(mode === 'edit' ? !!service.is_active : true);
  const [localErr, setLocalErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const ok = await onSave({
      action: mode === 'create' ? 'create' : 'update',
      service_id: mode === 'edit' ? service.id : undefined,
      name,
      description,
      icon: icon.trim() || 'AC',
      is_active: active ? 1 : 0,
    });
    if (!ok) setLocalErr('Please fix the highlighted issues above.');
  };

  return (
    <Modal title={mode === 'create' ? 'Add service' : 'Edit service'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-group">
          <label>Service name</label>
          <input className="form-input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <input className="form-input" type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Icon (short — e.g. AC, PL, AU)</label>
          <input className="form-input" type="text" maxLength={10} value={icon} onChange={(e) => setIcon(e.target.value)} />
        </div>
        {mode === 'edit' && (
          <label className="row-toggle">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span>Service is active (visible to customers)</span>
          </label>
        )}
        {localErr && <div className="alert">{localErr}</div>}
        <div className="modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-brand" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminPanel;