import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL, setCurrentUser } from '../lib/auth';

const roleRoutes = {
  superadmin: '/admin',
  technician: '/technician',
  customer: '/book',
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
        setLoading(false);
        return;
      }
      setCurrentUser(data.user);
      const route = roleRoutes[data.user.role] || '/login';
      navigate(route, { replace: true });
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
            <Link to="/signup" className="btn btn-brand">Get started</Link>
          </div>
        </nav>
      </div>

      <div className="auth-body section">
        <div className="auth-card glass-strong">
          <div className="auth-head">
            <div className="mark"><img src="/logo.png" alt="RepairConnect" /></div>
            <h1>Welcome back</h1>
            <p>Log in to continue to your dashboard.</p>
          </div>

          {error && <div className="alert">{error}</div>}

          <form onSubmit={handleSubmit}>
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
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="form-input"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="btn btn-brand btn-full" style={{ marginTop: '8px' }} disabled={loading}>
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <div className="auth-foot">
            New to RepairConnect? <Link to="/signup">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;