import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_LIST, categoryImage } from '../utils/categories';
import { IconShield, IconChart, IconBolt, IconCheck, IconArrow, IconSearch, IconWallet, IconUsers } from '../components/Icons';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <span className="eyebrow">Freelance marketplace</span>
            <h1>
              Welcome to <span className="grad">HustleHub+</span>
            </h1>
            <p className="hero-lead">A secure marketplace connecting clients with freelancers.</p>
            <div className="home-actions">
              <Link to="/gigs" className="button-link btn-lg">
                Browse Gigs <IconArrow width={18} height={18} />
              </Link>
              {!isAuthenticated && (
                <Link to="/register" className="button-link secondary btn-lg">Get Started</Link>
              )}
            </div>
            <ul className="trust-row">
              <li><IconCheck /> Secure by design</li>
              <li><IconCheck /> Fixed-price gigs</li>
              <li><IconCheck /> Built-in tax estimates</li>
            </ul>
          </div>
          <div className="hero-art">
            <img src="/images/hero.svg" alt="HustleHub+ dashboard showing bookings, income and freelancer ratings" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="section-head">
          <h2>Explore popular categories</h2>
          <p>From design to development, find the right talent for whatever you are building.</p>
        </div>
        <div className="cat-grid">
          {CATEGORY_LIST.map((c) => (
            <Link key={c} to="/gigs" className="cat-tile">
              <img src={categoryImage(c)} alt="" loading="lazy" />
              <span>{c}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="section-head">
          <h2>How it works</h2>
          <p>Getting work done takes three simple steps.</p>
        </div>
        <div className="steps">
          <div className="step">
            <h3>Find a gig</h3>
            <p>Browse services from freelancers and filter by the category you need.</p>
          </div>
          <div className="step">
            <h3>Book with confidence</h3>
            <p>Pick a gig, add a note for the freelancer and confirm your booking in one click.</p>
          </div>
          <div className="step">
            <h3>Track everything</h3>
            <p>Clients follow their bookings while freelancers watch income and estimated tax.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="section-head">
          <h2>Built for clients and freelancers</h2>
          <p>Everything you need to hire, earn and stay in control.</p>
        </div>
        <div className="features">
          <div className="feature">
            <span className="icon-bubble"><IconShield /></span>
            <h3>Secure and private</h3>
            <p>Protected sign-in and role-based access keep your account and bookings safe.</p>
          </div>
          <div className="feature">
            <span className="icon-bubble green"><IconChart /></span>
            <h3>Income and tax dashboard</h3>
            <p>Freelancers get clear charts of monthly income and a progressive tax estimate.</p>
          </div>
          <div className="feature">
            <span className="icon-bubble orange"><IconBolt /></span>
            <h3>Fast, simple booking</h3>
            <p>Transparent prices and delivery times so you know exactly what to expect.</p>
          </div>
          <div className="feature">
            <span className="icon-bubble"><IconSearch /></span>
            <h3>Easy discovery</h3>
            <p>Clean category browsing helps clients find the right service quickly.</p>
          </div>
          <div className="feature">
            <span className="icon-bubble green"><IconWallet /></span>
            <h3>Clear pricing</h3>
            <p>Every gig shows its full price up front, with no hidden surprises.</p>
          </div>
          <div className="feature">
            <span className="icon-bubble orange"><IconUsers /></span>
            <h3>Two roles, one platform</h3>
            <p>Hire as a client or sell your skills as a freelancer from the same account system.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band">
        <div className="cta-inner">
          <h2>Ready to get started?</h2>
          <p>Join HustleHub+ today and connect with the right people for your next project.</p>
          <div className="home-actions">
            <Link to="/gigs" className="btn btn-light btn-lg">Browse Gigs</Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn btn-ghost-light btn-lg">Create an account</Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
