import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setSubmitting(true);
    const result = await register(email, password, role);
    setSubmitting(false);

    if (result.success) {
      setSuccess('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1200);
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
            <h3>Start your journey</h3>
            <p>Hire great talent or turn your skills into income.</p>
          </div>
        </aside>

        <div className="auth-page">
          <h2>Create an account</h2>
          <p className="auth-sub">It only takes a minute to get set up.</p>
          <Alert type="error" message={error} />
          <Alert type="success" message={success} />
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
              autoComplete="new-password"
            />
            <small>At least 8 characters, with uppercase, lowercase, a number, and a symbol.</small>

            <label htmlFor="role">I am a…</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="client">Client (I want to hire)</option>
              <option value="freelancer">Freelancer (I want to sell gigs)</option>
            </select>

            <button type="submit" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Register'}
            </button>
          </form>
          <p>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
