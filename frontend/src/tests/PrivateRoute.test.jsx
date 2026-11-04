import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from '../components/PrivateRoute';
import { AuthProvider } from '../context/AuthContext';

function renderWithRoute(initialPath, allowedRoles) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/gigs" element={<div>Gigs Page</div>} />
          <Route
            path="/protected"
            element={
              <PrivateRoute allowedRoles={allowedRoles}>
                <div>Protected Content</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to /login when the user is not authenticated', () => {
    renderWithRoute('/protected');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders protected content when authenticated with an allowed role', () => {
    localStorage.setItem('hustlehub_token', 'fake-token');
    localStorage.setItem('hustlehub_user', JSON.stringify({ id: '1', email: 'c@example.com', role: 'client' }));

    renderWithRoute('/protected', ['client']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /gigs when authenticated but role is not allowed', () => {
    localStorage.setItem('hustlehub_token', 'fake-token');
    localStorage.setItem('hustlehub_user', JSON.stringify({ id: '1', email: 'c@example.com', role: 'client' }));

    renderWithRoute('/protected', ['freelancer']);
    expect(screen.getByText('Gigs Page')).toBeInTheDocument();
  });
});
