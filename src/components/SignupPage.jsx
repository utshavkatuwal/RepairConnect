import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../lib/auth';

const RoleIcon = ({ role }) => {
  if (role === 'customer') {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
      </svg>
    );
  }
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
};

const SignupPage = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await fetch(`${API_URL}/services.php`);
        const data = await res.json();
        if (data.success) setServices(data.services || []);
      } catch {
        /* services unavailable */
      } finally {
        setServicesLoading(false);
      }
    };
    loadServices();
  }, []);

  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (userType === 'technician' && selectedServices.length === 0) {
      setError('Please choose at least one service you provide.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/signup.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          role: userType,
          services: selectedServices,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
        setLoading(false);
        return;
      }
      setSuccess(data.message);
      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err) {
      setError('Unable to reach the server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="bg-scene">
        <div className="orb orb-indigo" />
        <div className="orb orb-pink" />
        <div className="orb orb-cyan" />
        <div className="orb orb-amber" />
      </div>
      <div className="bg-grid" />

      <div className="nav-wrap">
        <nav className="nav glass">
          <Link to="/" className="brand">
            <span className="brand-mark"><img src="/logo.png" alt="RepairConnect" /></span>
            RepairConnect
          </Link>
          <div className="nav-actions">
            <Link to="/login" className="ghost-link">Log in</Link>
            <Link to="/signup" className="btn btn-brand">Get started</Link>
          </div>
        </nav>
      </div>

      <div className="auth-body section">
        <div className="auth-card glass-strong">
          <div className="auth-head">
            <div className="mark"><img src="/logo.png" alt="RepairConnect" /></div>
            <h1>Create your account</h1>
            <p>Free forever for customers and technicians.</p>
          </div>

          {error && <div className="alert">{error}</div>}
          {success && (
            <div className="alert" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857' }}>
              {success} Redirecting to login…
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>I am a</label>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-option ${userType === 'customer' ? 'active' : ''}`}
                  onClick={() => setUserType('customer')}
                >
                  <div className="r-icon"><RoleIcon role="customer" /></div>
                  <div className="r-title">Customer</div>
                </button>
                <button
                  type="button"
                  className={`role-option ${userType === 'technician' ? 'active' : ''}`}
                  onClick={() => setUserType('technician')}
                >
                  <div className="r-icon"><RoleIcon role="technician" /></div>
                  <div className="r-title">Technician</div>
                </button>
              </div>
            </div>

            {userType === 'technician' && (
              <div className="form-group">
                <label>Services you provide</label>
                {servicesLoading ? (
                  <p className="form-hint">Loading services…</p>
                ) : (
                  <>
                    <div className="service-picker">
                      {services.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className={`svc-chip ${selectedServices.includes(s.id) ? 'selected' : ''}`}
                          onClick={() => toggleService(s.id)}
                        >
                          <span className="svc-badge">{s.icon}</span>
                          {s.name}
                        </button>
                      ))}
                    </div>
                    <p className="form-hint">Select all services you can handle.</p>
                  </>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                className="form-input"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                className="form-input"
                type="tel"
                placeholder="+977 98-XXXX-XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="form-input"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="btn btn-brand btn-full" style={{ marginTop: '8px' }} disabled={loading}>
              {loading ? 'Creating account…' : userType === 'customer' ? 'Sign up as customer' : 'Sign up as technician'}
            </button>
          </form>

          <div className="auth-foot">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;