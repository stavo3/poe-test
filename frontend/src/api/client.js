import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'https://localhost:5000/api';

const client = axios.create({ baseURL });

// Attach the JWT (if present) to every outgoing request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('hustlehub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralise 401 handling: if the token is invalid/expired, clear it so the
// UI falls back to a logged-out state rather than silently failing forever.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('hustlehub_token');
      localStorage.removeItem('hustlehub_user');
    }
    return Promise.reject(error);
  }
);

// Extracts a safe, user-facing message from an API error response without
// ever surfacing raw stack traces or internal details.
// Field-level validation messages (e.g. "Price must be a positive number.")
// are preferred over the generic "Validation failed." so users can fix the form.
export function apiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((e) => e.message).filter(Boolean).join(' ');
  }
  if (data?.message) return data.message;
  return fallback;
}

export default client;

// REFERENCES
// Axios (n.d.) ‘Axios API’. GitHub. Available at: https://axios-http.com/docs/api_intro (Accessed: 12 October 2026).
// Axios (n.d.) ‘Interceptors’. Axios documentation. Available at: https://axios-http.com/docs/interceptors (Accessed: 12 October 2026).
// MDN Web Docs (n.d.-a) ‘Window: localStorage property’. Available at: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage (Accessed: 12 October 2026).
// MDN Web Docs (n.d.-b) ‘Promise.reject()’. Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject (Accessed: 12 October 2026).
// Vite (n.d.) ‘Env Variables and Modes’. Vite documentation. Available at: https://vite.dev/guide/env-and-mode.html (Accessed: 12 October 2026)
