import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DashboardShell from './DashboardShell';
import OrderJourney from './OrderJourney';
import ChatBox from './ChatBox';
import BillView from './BillView';
import { API_URL, getCurrentUser } from '../lib/auth';

const DEFAULT_VIEW = [27.7172, 85.324];

const FIND_MSGS = [
  'Scanning nearby experts…',
  'Checking verified technicians…',
  'Matching technicians with your service…',
  'Almost there…',
];

const BookingPage = () => {
  const user = getCurrentUser();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'customer') return <Navigate to="/" replace />;

  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState(null);
  const [location, setLocation] = useState(null); // {lat, lng, address}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // {request_id, service} after create_request
  const [phase, setPhase] = useState('idle'); // idle | finding | done
  const [foundOrder, setFoundOrder] = useState(null); // accepted request (technician info)
  const [msgIndex, setMsgIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [aborting, setAborting] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/services.php`)
      .then((r) => r.json())
      .then((d) => { if (alive && d.success) setServices(d.services || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Finding — keep searching until a technician actually accepts the request
  useEffect(() => {
    if (step !== 4 || !result) return;
    if (phase !== 'finding' && phase !== 'tracking') return;

    const msgTimer = phase === 'finding'
      ? setInterval(() => { setMsgIndex((i) => Math.min(i + 1, FIND_MSGS.length - 1)); }, 1600)
      : null;

    let alive = true;
    const poll = () => {
      fetch(`${API_URL}/request_status.php?request_id=${result.request_id}&user_id=${user.id}`)
        .then((r) => r.json())
        .then((d) => {
          if (!alive || !d.success || !d.request) return;
          const st = d.request.status;
          if (phase === 'finding' && ['accepted', 'departed', 'reached', 'billing'].includes(st)) {
            setFoundOrder(d.request);
            setPhase('tracking');
          } else if (phase === 'tracking') {
            if (['accepted', 'departed', 'reached', 'billing'].includes(st)) {
              setFoundOrder(d.request);
            } else if (['finished', 'cancelled', 'rejected'].includes(st)) {
              setFoundOrder(d.request);
              setPhase('done');
            }
          } else if (phase === 'finding' && ['cancelled', 'rejected'].includes(st)) {
            setFoundOrder(null);
            setPhase('done');
          }
        })
        .catch(() => {});
    };
    poll();
    const pollTimer = setInterval(poll, phase === 'finding' ? 3000 : 2000);

    return () => {
      alive = false;
      if (msgTimer) clearInterval(msgTimer);
      clearInterval(pollTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, result, phase, user.id]);

  const selected = services.find((s) => s.id === serviceId) || null;

  const resetFlow = () => {
    setResult(null);
    setServiceId(null);
    setLocation(null);
    setPhase('idle');
    setFoundOrder(null);
    setChatOpen(false);
    setMsgIndex(0);
    setStep(1);
  };

  const findTechnician = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/create_request.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          service_id: serviceId,
          latitude: location.lat,
          longitude: location.lng,
          address: location.address,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
        return;
      }
      setResult(data);
      setMsgIndex(0);
      setPhase('finding');
      setStep(4);
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const abortSearch = async () => {
    setAborting(true);
    try {
      await fetch(`${API_URL}/cancel_request.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: result.request_id, user_id: user.id }),
      });
    } catch {
      /* ignore network errors on abort */
    }
    resetFlow();
    setAborting(false);
  };

  return (
    <DashboardShell minimal>
      <div className="book-wrap">
        <div className="steps">
          {[['Choose service', 1], ['Choose location', 2], ['Confirm & find', 3]].map(([label, n]) => (
            <React.Fragment key={n}>
              {n > 1 && <span className="step-arrow">→</span>}
              <span className={`step-pill ${step === n ? 'active' : step > n ? 'done' : ''}`}>
                <span className="step-num">{step > n ? '✓' : n}</span>
                <span className="step-label">{label}</span>
              </span>
            </React.Fragment>
          ))}
        </div>

        {error && <div className="alert">{error}</div>}

        {step === 1 && (
          <div className="book-card fade-in">
            <div className="book-head">
              <h2>What do you need repaired?</h2>
              <p>Select the service you need help with.</p>
            </div>
            <div className="service-grid">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`service-card ${serviceId === s.id ? 'selected' : ''}`}
                  onClick={() => setServiceId(s.id)}
                >
                  {serviceId === s.id && (
                    <span className="check-mark">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </span>
                  )}
                  <span className="svc-badge">{s.icon}</span>
                  <b>{s.name}</b>
                  <small>{s.description}</small>
                </button>
              ))}
            </div>
            <div className="wizard-actions">
              <button className="btn btn-ghost" onClick={resetFlow}>Start over</button>
              <span className="spacer" />
              <button className="btn btn-brand btn-lg" disabled={!serviceId} onClick={() => setStep(2)}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <LocationStep
            location={location}
            setLocation={setLocation}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <div className="book-card fade-in">
            <div className="book-head">
              <h2>Confirm your request</h2>
              <p>We will start finding the right technician for you.</p>
            </div>
            <div className="sel-loc">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M12 21c-4.9-4.7-7-7.5-7-11a7 7 0 0 1 14 0c0 3.5-2.1 6.3-7 11Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <div>
                <b>{selected ? selected.name : ''}</b>
                <div style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{location ? location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : ''}</div>
              </div>
            </div>
            <div className="wizard-actions">
              <button className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
              <span className="spacer" />
              <button className="btn btn-brand btn-lg" onClick={findTechnician} disabled={loading}>
                {loading ? 'Locating…' : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
                    </svg>
                    Find Technician
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 4 && result && phase === 'finding' && (
          <div className="book-card fade-in">
            <div className="find-box">
              <div className="find-radar">
                <span className="ring r1" />
                <span className="ring r2" />
                <span className="ring r3" />
                <span className="core" />
              </div>
              <h2 className="find-title">Finding technicians…</h2>
              <p className="find-sub">
                for <b>{result.service}</b> near your location
              </p>
              <div className="find-msg">{FIND_MSGS[msgIndex]}</div>
              {location && location.address && (
                <div className="find-chips">
                  <span className="chip">{location.address}</span>
                </div>
              )}
              <button className="abort-btn" onClick={abortSearch} disabled={aborting}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                {aborting ? 'Cancelling…' : 'Abort search'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && result && foundOrder && phase === 'tracking' && (
          <div className="book-card fade-in">
            <div className="result-box" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div className="result-icon" style={{ width: 54, height: 54, fontSize: 0 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
                    {foundOrder.status === 'finished'
                      ? 'Job completed!'
                      : foundOrder.status === 'billing'
                        ? 'Technician is preparing your bill'
                        : foundOrder.status === 'reached'
                          ? 'Technician has reached you!'
                          : foundOrder.status === 'departed'
                            ? 'Technician is on the way!'
                            : 'Technician accepted your order!'}
                  </h2>
                  <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', margin: 0 }}>
                    {foundOrder.technician_name} · {foundOrder.service} · Order #{result.request_id}
                  </p>
                </div>
                <span className="live-indicator">
                  <span className="live-dot on" />
                  Live
                </span>
              </div>

              <div className="tech-row" style={{ background: 'rgba(79,70,229,0.04)', borderRadius: 14, padding: 14 }}>
                <span className="nav-avatar" style={{ borderRadius: 12 }}>
                  {(foundOrder.technician_name || 'T').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </span>
                <div style={{ flex: 1 }}>
                  <b>{foundOrder.technician_name}</b>
                  <div style={{ color: 'var(--ink-faint)', fontSize: '0.8rem' }}>{foundOrder.technician_phone}</div>
                </div>
              </div>

              <OrderJourney status={foundOrder.status} />

              {(foundOrder.status === 'billing' || foundOrder.status === 'finished') && (
                <div style={{ marginTop: 14 }}>
                  <BillView requestId={result.request_id} />
                </div>
              )}

              <div className="wizard-actions" style={{ marginTop: 16 }}>
                <button className="btn btn-ghost" onClick={() => setChatOpen(!chatOpen)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: -3 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  {chatOpen ? 'Hide chat' : 'Chat with technician'}
                </button>
                <Link to="/orders" className="btn btn-brand">View all orders</Link>
              </div>

              {chatOpen && (
                <div style={{ marginTop: 16 }}>
                  <ChatBox requestId={result.request_id} viewerId={user.id} />
                </div>
              )}

              {foundOrder.status === 'finished' && (
                <div style={{ marginTop: 18, textAlign: 'center' }}>
                  <button className="btn btn-brand" onClick={resetFlow}>Book another service</button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && result && phase === 'done' && (
          <div className="book-card fade-in">
            <div className="result-box">
              {foundOrder ? (
                <>
                  <div className="result-icon">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <h2>Technician found for your request!</h2>
                  <p>
                    Request <b>#{result.request_id}</b> · {result.service}.{' '}
                    <b>{foundOrder.technician_name}</b> accepted your job and is on the way
                    to meet you. You can chat and track the visit live.
                  </p>
                  <div className="tech-list" style={{ maxWidth: 420, margin: '0 auto' }}>
                    <div className="tech-row">
                      <span className="nav-avatar" style={{ borderRadius: 12 }}>
                        {(foundOrder.technician_name || 'T').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                      <div style={{ flex: 1 }}>
                        <b>{foundOrder.technician_name}</b>
                        <div style={{ color: 'var(--ink-faint)', fontSize: '0.8rem' }}>{foundOrder.technician_phone} · {result.service}</div>
                      </div>
                      <Link to="/orders" className="btn btn-brand btn-sm">Track order</Link>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="result-icon err">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M15 9l-6 6M9 9l6 6" />
                    </svg>
                  </div>
                  <h2>No technician could accept your request</h2>
                  <p>
                    Request <b>#{result.request_id}</b> for {result.service} was closed
                    without a match. Please try again or contact support.
                  </p>
                </>
              )}

              <div className="wizard-actions" style={{ maxWidth: 420, margin: '28px auto 0' }}>
                <button className="btn btn-ghost" onClick={resetFlow}>New request</button>
                <Link to="/orders" className="btn btn-brand">Done</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

/* ---------- Location step (Leaflet map) ---------- */
const LocationStep = ({ location, setLocation, onBack, onNext }) => {
  const mapEl = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [geoError, setGeoError] = useState('');
  const timer = useRef(null);

  useEffect(() => {
    if (!mapEl.current || map.current) return;
    const instance = L.map(mapEl.current, {
      center: DEFAULT_VIEW,
      zoom: 13,
      zoomControl: true,
    });
    L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${import.meta.env.VITE_CARTO_KEY}`, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
      maxNativeZoom: 19,
    }).addTo(instance);
    instance.on('click', (e) => pickCoordinate(e.latlng.lat, e.latlng.lng));
    map.current = instance;
    return () => {
      if (instance) { instance.remove(); map.current = null; marker.current = null; }
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !location) return;
    m.flyTo([location.lat, location.lng], 15, { duration: 0.8 });
    if (marker.current) marker.current.remove();
    marker.current = L.circleMarker([location.lat, location.lng], {
      radius: 11,
      color: '#4f46e5',
      weight: 3,
      fillColor: '#7c3aed',
      fillOpacity: 0.35,
    }).addTo(m);
  }, [location]);

  const pickCoordinate = async (lat, lng) => {
    setLocation({ lat, lng, address: '' });
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      setLocation({ lat, lng, address: data.display_name || '' });
    } catch {
      /* keep empty address */
    }
  };

  const useMyLocation = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json();
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: data.display_name || 'Your current location' });
        } catch {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: 'Your current location' });
        }
      },
      () => setGeoError('Could not fetch your location. Please search or tap the map instead.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSearch = (value) => {
    setQuery(value);
    clearTimeout(timer.current);
    if (!value.trim()) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=6`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
  };

  const chooseResult = (r) => {
    setLocation({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), address: r.display_name });
    setResults([]);
    setQuery(r.display_name);
  };

  return (
    <div className="book-card fade-in">
      <div className="book-head">
        <h2>Where do you need the service?</h2>
        <p>Search any location, tap the map, or use your current location.</p>
      </div>

      <div className="map-box" ref={mapEl} />

      <div className="map-tools">
        <div className="map-search">
          <span className="search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search any location…"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
          />
          {(searching || results.length > 0) && (
            <div className="search-results">
              {searching && <button type="button">Searching…</button>}
              {results.map((r) => (
                <button type="button" key={r.place_id} onClick={() => chooseResult(r)}>
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="btn btn-ghost" type="button" onClick={useMyLocation}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: -3 }}>
            <path d="M12 21c-4.9-4.7-7-7.5-7-11a7 7 0 0 1 14 0c0 3.5-2.1 6.3-7 11Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          Use my location
        </button>
      </div>

      {geoError && <div className="alert" style={{ marginTop: 12 }}>{geoError}</div>}

      {location ? (
        <div className="sel-loc">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 21c-4.9-4.7-7-7.5-7-11a7 7 0 0 1 14 0c0 3.5-2.1 6.3-7 11Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <div>
            <b>Selected location</b>
            <div style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
              {location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
            </div>
          </div>
        </div>
      ) : (
        <div className="sel-loc" style={{ background: 'rgba(148,163,184,0.08)', borderColor: 'rgba(148,163,184,0.3)' }}>
          No location selected yet — search, tap the map, or use your current location.
        </div>
      )}

      <div className="wizard-actions">
        <button className="btn btn-ghost" onClick={onBack}>Back</button>
        <span className="spacer" />
        <button className="btn btn-brand btn-lg" disabled={!location} onClick={onNext}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default BookingPage;