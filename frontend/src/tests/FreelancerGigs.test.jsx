import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FreelancerGigs from '../pages/FreelancerGigs';
import client from '../api/client';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual('../api/client');
  return {
    ...actual,
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  };
});

const existingGig = {
  _id: 'g1',
  title: 'Logo design',
  description: 'I will design a logo for your brand',
  category: 'design',
  price: 150,
  deliveryDays: 3,
  isActive: true,
};

async function fillGigForm({ title, description, price, days }) {
  await userEvent.type(screen.getByLabelText('Title'), title);
  await userEvent.type(screen.getByLabelText('Description'), description);
  await userEvent.type(screen.getByLabelText(/price/i), price);
  await userEvent.type(screen.getByLabelText(/delivery time/i), days);
}
describe('FreelancerGigs page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.get.mockResolvedValue({ data: { gigs: [] } });
  });

  it('shows an empty state when the freelancer has no gigs', async () => {
    render(<FreelancerGigs />);
    expect(await screen.findByText(/haven't created any gigs yet/i)).toBeInTheDocument();
  });

  it('lists the freelancer\'s existing gigs', async () => {
    client.get.mockResolvedValue({ data: { gigs: [existingGig] } });
    render(<FreelancerGigs />);
    expect(await screen.findByText('Logo design')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('creates a gig, sending price and delivery days as numbers', async () => {
    client.post.mockResolvedValue({ data: { message: 'Gig created.' } });
    render(<FreelancerGigs />);
    await screen.findByText(/haven't created any gigs yet/i);

    await fillGigForm({ title: 'Logo design', description: 'I will design a logo for you', price: '150', days: '3' });
    await userEvent.click(screen.getByRole('button', { name: /create gig/i }));

    await waitFor(() =>
      expect(client.post).toHaveBeenCalledWith('/gigs', {
        title: 'Logo design',
        description: 'I will design a logo for you',
        category: 'other',
        price: 150,
        deliveryDays: 3,
      })
    );
    expect(await screen.findByTestId('alert-success')).toHaveTextContent(/gig created/i);
  });

  it('shows the specific validation message from the API, not just "Validation failed."', async () => {
    client.post.mockRejectedValue({
      response: {
        status: 400,
        data: {
          message: 'Validation failed.',
          errors: [{ field: 'description', message: 'Description must be 10-2000 characters.' }],
        },
      },
    });
    render(<FreelancerGigs />);
    await screen.findByText(/haven't created any gigs yet/i);

    await fillGigForm({ title: 'Logo', description: 'short', price: '100', days: '3' });
    await userEvent.click(screen.getByRole('button', { name: /create gig/i }));

    expect(await screen.findByTestId('alert-error')).toHaveTextContent('Description must be 10-2000 characters.');
  });

  it('deletes a gig when Delete is clicked', async () => {
    client.get.mockResolvedValue({ data: { gigs: [existingGig] } });
    client.delete.mockResolvedValue({ data: { message: 'Gig deleted.' } });
    render(<FreelancerGigs />);

    await userEvent.click(await screen.findByRole('button', { name: /delete/i }));

    await waitFor(() => expect(client.delete).toHaveBeenCalledWith('/gigs/g1'));
    expect(await screen.findByTestId('alert-success')).toHaveTextContent(/gig deleted/i);
  });
});

