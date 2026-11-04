import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../context/AuthContext';

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows Log in and Register links when logged out', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/log in/i)).toBeInTheDocument();
    expect(screen.getByText(/register/i)).toBeInTheDocument();
    expect(screen.queryByTestId('user-badge')).not.toBeInTheDocument();
  });

  it('shows the user badge and freelancer links when logged in as a freelancer', () => {
    localStorage.setItem('hustlehub_token', 'fake-token');
    localStorage.setItem(
      'hustlehub_user',
      JSON.stringify({ id: '1', email: 'freelancer@example.com', role: 'freelancer' })
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('user-badge')).toHaveTextContent('freelancer@example.com');
    expect(screen.getByText('My Gigs')).toBeInTheDocument();
    expect(screen.getByText(/log out/i)).toBeInTheDocument();
  });
});
