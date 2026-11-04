import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GigCard from '../components/GigCard';

const sampleGig = {
  _id: 'gig123',
  title: 'I will design a logo',
  description: 'A clean, modern logo for your brand.',
  category: 'design',
  price: 75,
  deliveryDays: 3,
  freelancer: { email: 'freelancer@example.com' },
};

describe('GigCard', () => {
  it('renders the gig title, price, category and delivery time', () => {
    render(
      <MemoryRouter>
        <GigCard gig={sampleGig} />
      </MemoryRouter>
    );

    expect(screen.getByText('I will design a logo')).toBeInTheDocument();
    expect(screen.getByText('design')).toBeInTheDocument();
    expect(screen.getByText('R75')).toBeInTheDocument();
    expect(screen.getByText('3 day delivery')).toBeInTheDocument();
    expect(screen.getByText(/freelancer@example.com/)).toBeInTheDocument();
  });

  it('links to the gig detail page', () => {
    render(
      <MemoryRouter>
        <GigCard gig={sampleGig} />
      </MemoryRouter>
    );

    const link = screen.getByText(/view details/i);
    expect(link.closest('a')).toHaveAttribute('href', '/gigs/gig123');
  });

  it('never renders raw HTML/script content even if present in the description', () => {
    const maliciousGig = { ...sampleGig, description: '<script>alert(1)</script>Nice logo' };
    render(
      <MemoryRouter>
        <GigCard gig={maliciousGig} />
      </MemoryRouter>
    );
    // React escapes text content by default; assert no script element was created.
    expect(document.querySelector('script')).toBeNull();
  });
});
