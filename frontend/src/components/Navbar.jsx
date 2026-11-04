import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogoMark, IconMenu, IconClose } from './Icons';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/login');
  };

  const initial = (user?.email || '?').charAt(0).toUpperCase();

  return (
    <header className="navbar-shell">
      <nav className="navbar" aria-label="Main navigation">
        <Link to="/" className="brand" onClick={closeMenu}>
          <LogoMark />
          <span>HustleHub<span className="brand-plus">+</span></span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>

        <div className={`nav-links ${open ? 'is-open' : ''}`} onClick={(e) => e.target.closest('a') && closeMenu()}>
          <NavLink to="/gigs">Browse Gigs</NavLink>

          {isAuthenticated && user?.role === 'freelancer' && (
            <>
              <NavLink to="/freelancer/gigs">My Gigs</NavLink>
              <NavLink to="/freelancer/bookings">My Bookings</NavLink>
              <NavLink to="/freelancer/dashboard">Income &amp; Tax</NavLink>
            </>
          )}

          {isAuthenticated && user?.role === 'client' && <NavLink to="/client/bookings">My Bookings</NavLink>}

          <span className="nav-spacer" />

          {isAuthenticated ? (
            <>
              <span className="user-badge" data-testid="user-badge">
                <span className="avatar" aria-hidden="true">{initial}</span>
                <span className="user-badge-text">
                  {user?.email} ({user?.role})
                </span>
              </span>
              <button type="button" onClick={handleLogout} className="btn btn-outline btn-sm">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-login">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
