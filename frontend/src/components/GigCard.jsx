import { Link } from 'react-router-dom';
import { categoryImage } from '../utils/categories';

export default function GigCard({ gig, actions }) {
  const email = gig.freelancer?.email;

  return (
    <div className="gig-card" data-testid="gig-card">
      <div className="gig-card-media">
        {/* Decorative category illustration (alt is empty on purpose). */}
        <img src={categoryImage(gig.category)} alt="" loading="lazy" />
        <span className="gig-category">{gig.category}</span>
      </div>

      <div className="gig-card-body">
        <h3>{gig.title}</h3>

        <p className="gig-description">{gig.description}</p>

        {email && (
          <p className="gig-freelancer">
            <span className="avatar avatar-sm" aria-hidden="true">{email.charAt(0).toUpperCase()}</span>
            <span>By {email}</span>
          </p>
        )}

        <div className="gig-meta">
          <span className="gig-price">R{gig.price}</span>
          <span className="gig-delivery">{gig.deliveryDays} day delivery</span>
        </div>

        <div className="gig-card-footer">
          <Link to={`/gigs/${gig._id}`} className="gig-link">View details</Link>
          {actions}
        </div>
      </div>
    </div>
  );
}

// REFERENCES
 
 // MDN Web Docs (n.d.) 'Template literals'.
 //Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
// Accessed: 14 August 2026.
 
 // MDN Web Docs (n.d.) 'Optional chaining (?.)'.
 //Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
// Accessed: 14 August 2026.
 
 // React (n.d.) 'Passing props to a component'.
 // Available at: https://react.dev/learn/passing-props-to-a-component
// Accessed: 17 August 2026.
 
 //React Router (n.d.) 'Link'.
 //Available at: https://reactrouter.com/api/components/Link
// Accessed: 17 August 2026.
 

