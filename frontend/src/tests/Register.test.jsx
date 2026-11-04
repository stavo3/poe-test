import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from '../pages/Register';

const mockRegister = vi.fn();

// Replace the real auth context so the test never touches the network.
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}));

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
}

describe('Register page', () => {
  beforeEach(() => mockRegister.mockReset());

  it('renders the form fields, role selector and submit button', () => {
    renderRegister();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i am a/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('blocks submission and shows an error when fields are empty', async () => {
    renderRegister();
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(screen.getByTestId('alert-error')).toHaveTextContent(/required/i);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('submits the typed details and the chosen role', async () => {
    mockRegister.mockResolvedValue({ success: true });
    renderRegister();

    await userEvent.type(screen.getByLabelText(/email/i), 'new.freelancer@example.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'StrongP@ss1');
    await userEvent.selectOptions(screen.getByLabelText(/i am a/i), 'freelancer');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(mockRegister).toHaveBeenCalledWith('new.freelancer@example.com', 'StrongP@ss1', 'freelancer');
    await waitFor(() => expect(screen.getByTestId('alert-success')).toBeInTheDocument());
  });

  it('shows the server message when registration fails (e.g. duplicate email)', async () => {
    mockRegister.mockResolvedValue({ success: false, message: 'An account with this email already exists.' });
    renderRegister();

    await userEvent.type(screen.getByLabelText(/email/i), 'taken@example.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'StrongP@ss1');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() =>
      expect(screen.getByTestId('alert-error')).toHaveTextContent('An account with this email already exists.')
    );
  });
});
