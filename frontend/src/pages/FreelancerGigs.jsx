import { useEffect, useState } from 'react';
import client, { apiErrorMessage } from '../api/client';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import StatusPill from '../components/StatusPill';
import { categoryImage, CATEGORY_LIST } from '../utils/categories';

// This object defines the default values for a new gig form.
const emptyForm = {
  title: '',
  description: '',
  category: 'other',
  price: '',
  deliveryDays: ''
};

export default function FreelancerGigs() {
  
  // the gig listings, form values, editing ID, messages, and loading state.
  const [gigs, setGigs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  
  // from the backend API. Async/await handles the asynchronous operation.
  const loadGigs = async () => {
    setLoading(true);

    try {
      const { data } = await client.get('/gigs/mine');
      setGigs(data.gigs);
    } catch (err) {
      // Displays a readable error if the request fails.
      setError(apiErrorMessage(err, 'Could not load your gigs.'));
    } finally {
      // Resets the loading state whether the request succeeds or fails.
      setLoading(false);
    }
  };

  
  // gigs when the component first mounts.
  useEffect(() => {
    loadGigs();
  }, []);

  // updates the selected form field while preserving other field values.
  const handleChange = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  // Resets the form and exits editing mode.
  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

 
  // default form submission and allows JavaScript to handle the request.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Converts price and deliveryDays from strings into numbers before sending the gig data to the backend.
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      deliveryDays: Number(form.deliveryDays),
    };

    try {
      // while POST creates a new gig.
      if (editingId) {
        await client.put(`/gigs/${editingId}`, payload);
        setSuccess('Gig updated.');
      } else {
        await client.post('/gigs', payload);
        setSuccess('Gig created.');
      }

      // Clears the form and refreshes the displayed gig listings.
      resetForm();
      loadGigs();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save gig.'));
    }
  };

  // Populates the form with the selected gig's existing information.
  // String() converts numeric values into strings for controlled inputs.
  const handleEdit = (gig) => {
    setEditingId(gig._id);

    setForm({
      title: gig.title,
      description: gig.description,
      category: gig.category,
      price: String(gig.price),
      deliveryDays: String(gig.deliveryDays),
    });
  };

  
  // using its unique identifier.
  const handleDelete = async (gigId) => {
    setError('');
    setSuccess('');

    try {
      await client.delete(`/gigs/${gigId}`);
      setSuccess('Gig deleted.');

      // Refreshes the listings after successful deletion.
      loadGigs();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete gig.'));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <span className="eyebrow">Freelancer</span>
        <h2>My Gigs</h2>
        <p>Create, edit and manage the services you offer to clients.</p>
      </div>

      {/* Displays error and success messages using the reusable
          Alert component defined in this project. */}
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="manage-grid">
        {/* use state values and onChange handlers to manage user input. */}
        <form onSubmit={handleSubmit} className="gig-form card">
          <h3>{editingId ? 'Edit gig' : 'Create a new gig'}</h3>

          <label htmlFor="title">Title</label>
          <input
            id="title"
            value={form.title}
            onChange={handleChange('title')}
            maxLength={120}
            required
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={handleChange('description')}
            maxLength={2000}
            required
          />

          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={form.category}
            onChange={handleChange('category')}
          >
            {/*  Array.map() generates a option element for each available gig category. */}
            {CATEGORY_LIST.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <label htmlFor="price">Price (ZAR)</label>
          <input
            id="price"
            type="number"
            min="1"
            value={form.price}
            onChange={handleChange('price')}
            required
          />

          <label htmlFor="deliveryDays">Delivery time (days)</label>
          <input
            id="deliveryDays"
            type="number"
            min="1"
            max="90"
            value={form.deliveryDays}
            onChange={handleChange('deliveryDays')}
            required
          />

          <div className="form-actions">
            {/* Conditional rendering changes the button label
                depending on whether the user is editing or creating a gig. */}
            <button type="submit">
              {editingId ? 'Save changes' : 'Create gig'}
            </button>

            {editingId && (
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <section>
          <h3>Your listings</h3>

          {/* conditional rendering displays loading, empty, or populated listing states. */}
          {loading ? (
            <p className="loading-text">Loading…</p>
          ) : gigs.length === 0 ? (
            <EmptyState>You haven't created any gigs yet.</EmptyState>
          ) : (
            <ul className="gig-list">
              {/* Array.map() renders each gig as a list item. The unique ID is used as the React key. */}
              {gigs.map((gig) => (
                <li key={gig._id} className="gig-list-item">
                  <div className="gig-list-main">
                    <img className="gig-thumb" src={categoryImage(gig.category)} alt="" loading="lazy" />
                    <div>
                      <strong className="gig-list-title">{gig.title}</strong>
                      <div className="gig-list-sub">
                        <span>R{gig.price}</span>
                        <StatusPill status={gig.isActive ? 'active' : 'inactive'} />
                      </div>
                    </div>
                  </div>

                  {/* Event handlers connect the Edit and Delete buttons
                      to their respective functions. */}
                  <div className="gig-list-actions">
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => handleEdit(gig)}>
                      Edit
                    </button>

                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(gig._id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

// REFERENCES
 
//Axios (n.d.) 'Axios API documentation'.
 // Available at: https://axios-http.com/docs/api_intro
  // Accessed: 31 August 2026.
 
 // MDN Web Docs (n.d.) 'Array.prototype.map()'.
 // Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
   // Accessed: 31 August 2026.
 
 //MDN Web Docs (n.d.) 'Event: preventDefault() method'.
 // Available at: https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault
   // Accessed: 31 August 2026.
 
 
 // React (n.d.) 'useEffect'.
 // Available at: https://react.dev/reference/react/useEffect
  // Accessed: 01 Ocobter 2026.
 
 //React (n.d.) 'useState'.
 // Available at:https://react.dev/reference/react/useState
 // Accessed: 01 October 2026.

