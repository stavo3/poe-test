import { useEffect, useState } from 'react';
import client, { apiErrorMessage } from '../api/client';
import GigCard from '../components/GigCard';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import { CATEGORY_LIST } from '../utils/categories';

const CATEGORIES = ['', ...CATEGORY_LIST];

export default function Gigs() {
  // These variables store the gig listings, selected category,
  // error message, and loading status.
  const [gigs, setGigs] = useState([]);
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Get requests retrieve data from the backend API. The optional category is sent as a query parameter.
  const fetchGigs = async (cat) => {
    setLoading(true);
    setError('');

    try {
      const { data } = await client.get('/gigs', {
        params: cat ? { category: cat } : {}
      });
      setGigs(data.gigs);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load gigs.'));
    } finally {
      setLoading(false);
    }
  };

  // Runs when the component mounts and whenever the category changes.
  useEffect(() => {
    fetchGigs(category);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <div className="page">
      <div className="page-header">
        <span className="eyebrow">Marketplace</span>
        <h2>Browse Gigs</h2>
        <p>Discover services from talented freelancers and book in a few clicks.</p>
      </div>

      <Alert type="error" message={error} />

      <div className="chip-row" role="group" aria-label="Filter by category">
        {CATEGORIES.map((c) => (
          <button
            key={c || 'all'}
            type="button"
            className={`chip ${category === c ? 'is-active' : ''}`}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c ? c : 'All categories'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="gig-grid" aria-busy="true">
          <p className="loading-text" style={{ gridColumn: '1 / -1', margin: 0 }}>Loading gigs…</p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" />
          ))}
        </div>
      ) : gigs.length === 0 ? (
        <EmptyState>No gigs found.</EmptyState>
      ) : (
        <div className="gig-grid">
          {gigs.map((gig) => (
            <GigCard key={gig._id} gig={gig} />
          ))}
        </div>
      )}
    </div>
  );
}

// REFERENCES
 
// Axios (n.d.) 'Axios API documentation'.
 // Available at: https://axios-http.com/docs/api_intro
 // Accessed: 05 October 2026.

 // MDN Web Docs (n.d.) 'Array.prototype.map()'.
 //Available at:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
 // Accessed: 05 October 2026.

 // React (n.d.) 'useEffect'.
 // Available at: https://react.dev/reference/react/useEffect
// Accessed: 07 October 2026.
 
 // React (n.d.) 'useState'.
 // Available at: https://react.dev/reference/react/useState
 // Accessed: 06 October 2026. 

