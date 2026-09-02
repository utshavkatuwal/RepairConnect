import React from 'react';

const STEPS = [
  { key: 'departed', label: 'Departed' },
  { key: 'reached', label: 'Reached' },
  { key: 'billing', label: 'Billing' },
  { key: 'finished', label: 'Finished' },
];

const ORDER_FLOW = { accepted: 'departed', departed: 'reached', reached: 'billing', billing: 'finished' };

const OrderJourney = ({ status, canUpdate, onUpdate }) => {
  const currentIdx = STEPS.findIndex((s) => s.key === status);
  const nextStep = ORDER_FLOW[status];

  return (
    <div className="journey">
      <div className="journey-steps">
        {STEPS.map((s, i) => {
          const done = currentIdx >= i;
          const isCurrent = s.key === status;
          return (
            <div key={s.key} className={`jstep ${done ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
              <span className="jcircle">
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className="jlabel">{s.label}</span>
              {i < STEPS.length - 1 && <span className={`jline ${currentIdx > i ? 'done' : ''}`} />}
            </div>
          );
        })}
      </div>
      {canUpdate && nextStep && (
        <button
          className="btn btn-brand btn-sm"
          type="button"
          onClick={() => onUpdate(nextStep)}
        >
          Mark as {STEPS.find((s) => s.key === nextStep).label}
        </button>
      )}
    </div>
  );
};

export default OrderJourney;