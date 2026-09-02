import React, { useEffect, useState } from 'react';
import { API_URL } from '../lib/auth';

const BillView = ({ requestId }) => {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/bill.php?request_id=${requestId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.bill) {
          setBill(d.bill);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [requestId]);

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

  const extras = bill.extras || [];
  const total = bill.total || 0;

  return (
    <div className="bill-card bill-view">
      <div className="bill-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
        <span>Bill — Order #{requestId}</span>
      </div>

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
            </div>
          ))}
        </div>
      )}

      {extras.length === 0 && (
        <div className="bill-extras">
          <div className="bill-extras-label">Extra charges</div>
          <div className="bill-no-extras">None</div>
        </div>
      )}

      <div className="bill-total">
        <span>Total</span>
        <span className="bill-total-amount">Rs {Number(total).toLocaleString()}</span>
      </div>
    </div>
  );
};

export default BillView;
