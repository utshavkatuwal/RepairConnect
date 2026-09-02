import React, { useEffect, useState } from 'react';
import { API_URL } from '../lib/auth';

const BillEditor = ({ requestId, userId, onRefresh }) => {
  const [bill, setBill] = useState(null);
  const [extras, setExtras] = useState([]);
  const [total, setTotal] = useState(0);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    // The bill is created when the technician advances to 'billing'.
    // Keep polling until it exists so it appears immediately without a refresh.
    let alive = true;
    let timer;
    const load = () => {
      fetch(`${API_URL}/bill.php?request_id=${requestId}`)
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return;
          if (d.success && d.bill) {
            setBill(d.bill);
            setExtras(d.bill.extras || []);
            setTotal(d.bill.total || 0);
            setLoading(false);
          } else {
            // no bill yet — leave loading and try again shortly
            timer = setTimeout(load, 1000);
          }
        })
        .catch(() => {
          if (!alive) return;
          setErr('Could not load bill.');
          setLoading(false);
        });
    };
    load();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const loadBill = () => {
    fetch(`${API_URL}/bill.php?request_id=${requestId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.bill) {
          setBill(d.bill);
          setExtras(d.bill.extras || []);
          setTotal(d.bill.total || 0);
        }
      })
      .catch(() => setErr('Could not load bill.'));
  };

  const addExtra = async (e) => {
    e.preventDefault();
    if (!name.trim() || !amount || Number(amount) <= 0) return;
    setAdding(true);
    setErr('');
    try {
      const res = await fetch(`${API_URL}/bill.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_extra', request_id: requestId, user_id: userId, name: name.trim(), amount: Number(amount) }),
      });
      const d = await res.json();
      if (!d.success) {
        setErr(d.message);
      } else {
        setName('');
        setAmount('');
        loadBill();
        if (onRefresh) onRefresh();
      }
    } catch {
      setErr('Unable to reach the server.');
    } finally {
      setAdding(false);
    }
  };

  const removeExtra = async (chargeId) => {
    setRemoving(chargeId);
    setErr('');
    try {
      const res = await fetch(`${API_URL}/bill.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_extra', request_id: requestId, user_id: userId, charge_id: chargeId }),
      });
      const d = await res.json();
      if (!d.success) {
        setErr(d.message);
      } else {
        loadBill();
        if (onRefresh) onRefresh();
      }
    } catch {
      setErr('Unable to reach the server.');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="bill-card">
        <span className="spinner" />
      </div>
    );
  }

  if (!bill) {
    return null;
  }

  return (
    <div className="bill-card">
      <div className="bill-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
        <span>Bill for Order #{requestId}</span>
      </div>

      {err && <div className="bill-err">{err}</div>}

      <div className="bill-line">
        <span>{bill.service_name} — service charge</span>
        <span className="bill-amount">Rs {Number(bill.service_charge).toLocaleString()}</span>
      </div>

      {extras.length > 0 && (
        <div className="bill-extras">
          <div className="bill-extras-label">Extra charges</div>
          {extras.map((ex) => (
            <div className="bill-extra-row" key={ex.id}>
              <span className="bill-extra-name">{ex.name}</span>
              <span className="bill-amount">Rs {Number(ex.amount).toLocaleString()}</span>
              <button
                className="bill-remove-btn"
                onClick={() => removeExtra(ex.id)}
                disabled={removing === ex.id}
                title="Remove charge"
              >
                {removing === ex.id ? '...' : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <form className="bill-add-form" onSubmit={addExtra}>
        <input
          className="bill-input"
          placeholder="Charge name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={adding}
          maxLength={200}
        />
        <input
          className="bill-input bill-input-amt"
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={adding}
          min="1"
          step="any"
        />
        <button className="btn btn-ghost btn-sm bill-add-btn" type="submit" disabled={adding || !name.trim() || !amount || Number(amount) <= 0}>
          {adding ? 'Adding...' : 'Add'}
        </button>
      </form>

      <div className="bill-total">
        <span>Total</span>
        <span className="bill-total-amount">Rs {Number(total).toLocaleString()}</span>
      </div>
    </div>
  );
};

export default BillEditor;
