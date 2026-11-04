import { Link } from 'react-router-dom';
import { LogoMark } from './Icons';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">
            <LogoMark size={30} />
            <span>HustleHub+</span>
          </div>
          <p>A secure marketplace connecting clients with talented freelancers.</p>
        </div>
        <div className="footer-links">
          <Link to="/gigs">Browse gigs</Link>
          <Link to="/login">Log in</Link>
          <Link to="/register">Create account</Link>
        </div>
      </div>
      <div className="footer-bottom">&copy; {new Date().getFullYear()} HustleHub+. All rights reserved.</div>
    </footer>
  );
}
