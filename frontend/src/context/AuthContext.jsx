import { createContext, useContext, useState, useCallback } from 'react';
import client, { apiErrorMessage } from '../api/client';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem('hustlehub_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser());
  const [token, setToken] = useState(localStorage.getItem('hustlehub_token'));

  const persist = (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    if (nextUser && nextToken) {
      localStorage.setItem('hustlehub_user', JSON.stringify(nextUser));
      localStorage.setItem('hustlehub_token', nextToken);
    } else {
      localStorage.removeItem('hustlehub_user');
      localStorage.removeItem('hustlehub_token');
    }
  };

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await client.post('/auth/login', { email, password });
      persist(data.user, data.token);
      return { success: true };
    } catch (err) {
      return { success: false, message: apiErrorMessage(err, 'Login failed.') };
    }
  }, []);

  const register = useCallback(async (email, password, role) => {
    try {
      await client.post('/auth/register', { email, password, role });
      return { success: true };
    } catch (err) {
      return { success: false, message: apiErrorMessage(err, 'Registration failed.') };
    }
  }, []);

  const logout = useCallback(() => {
    persist(null, null);
  }, []);

  const value = { user, token, isAuthenticated: Boolean(token), login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
