import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client, { apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import { categoryImage } from '../utils/categories';
import { IconCheck } from '../components/Icons';

export default function GigDetail() {
  // Reads the gig ID from the current URL.
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [gig, setGig] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  // Retrieve gig details when the component mounts or the gig ID changes.
  useEffect(() => {
    let active = true;
    setLoading(true);

    client
      .get(`/gigs/${id}`)
      .then(({ data }) => {
        if (active) setGig(data.gig);
      })
      .catch((err) => {
        if (active) {
          setError(apiErrorMessage(err, 'Gig not found.'));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Handles the booking form submission.
  const handleBook = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    // Redirects unauthenticated users to the login page.
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setBooking(true);

    try {
      const { data } = await client.post('/bookings', {
        gigId: id,
        note
      });

      setSuccess(`Booking confirmed! Reference: ${data.transaction.reference}`);
      setNote('');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not complete booking.'));
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <p className="page loading-text">Loading…</p>;

  if (error && !gig) {
    return (
      <div className="page">
        <Alert type="error" message={error} />
      </div>
    );
  }

  if (!gig) return null;

  // Determines whether the currently logged-in user owns this gig.
  const isOwnGig = user && gig.freelancer && user.id === gig.freelancer._id;

  return (
    <div className="page gig-detail">
      <div className="detail-grid">
        <div className="detail-main">
          <div className="detail-hero">
            <img src={categoryImage(gig.category)} alt="" />
          </div>

          <p className="gig-category">{gig.category}</p>
          <h2>{gig.title}</h2>
          <p>{gig.description}</p>

          {gig.freelancer?.email && (
            <div className="seller">
              <span className="avatar" aria-hidden="true">{gig.freelancer.email.charAt(0).toUpperCase()}</span>
              <p>
                <small>Freelancer</small>
                Offered by {gig.freelancer.email}
              </p>
            </div>
          )}
        </div>

        <aside className="booking-panel">
          <p className="gig-price detail-price">
            R{gig.price}
          </p>
          <p className="detail-sub">{gig.deliveryDays} day delivery</p>

          <ul className="perk-list">
            <li><IconCheck /> Fixed, transparent price</li>
            <li><IconCheck /> Delivered in {gig.deliveryDays} day{gig.deliveryDays === 1 ? '' : 's'}</li>
            <li><IconCheck /> Booking reference provided</li>
          </ul>

          <Alert type="error" message={error} />
          <Alert type="success" message={success} />

          {(!user || user.role === 'client') && !isOwnGig && (
            <form onSubmit={handleBook} className="booking-form">
              <label htmlFor="note">Note to freelancer (optional)</label>

              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
              />

              <button type="submit" disabled={booking}>
                {booking ? 'Booking…' : isAuthenticated ? 'Book this gig' : 'Log in to book'}
              </button>
            </form>
          )}

          {user?.role === 'freelancer' && !isOwnGig && (
            <p className="hint">Only clients can book gigs.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

// REFERENCES
 
 // Axios (n.d.) 'Axios API documentation'.
 // Available at: https://axios-http.com/docs/api_intro
// Accessed: 09 October 2026.
 
 // MDN Web Docs (n.d.) 'Event: preventDefault() method'.
 // Available at: https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault
 // Accessed: 09 October 2026.
 
 // React (n.d.) 'useEffect'.
 // Available at: https://react.dev/reference/react/useEffect
 // Accessed: 11 October 2026.

 // React (n.d.) 'useState'.
 // Available at:https://react.dev/reference/react/useState
 // Accessed: 11 October 2026.

 // React Router (n.d.) 'useNavigate'.
// Available at: https://reactrouter.com/api/hooks/useNavigate
 // Accessed: 12 October 2026..

 // React Router (n.d.) 'useParams'.
 //Available at: https://reactrouter.com/api/hooks/useParams
// Accessed: 12 October 2026.
 
