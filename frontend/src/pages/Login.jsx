import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      navigate('/gigs');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-shell">
        <aside className="auth-side">
          <img src="/images/auth.svg" alt="" />
          <div className="auth-side-copy">
            <h3>Welcome back</h3>
            <p>Log in to manage your gigs, bookings and income.</p>
          </div>
        </aside>

        <div className="auth-page">
          <h2>Log in</h2>
          <p className="auth-sub">Enter your details to access your account.</p>
          <Alert type="error" message={error} />
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <button type="submit" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>
          <p>
            No account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
