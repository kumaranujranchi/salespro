const TOKEN_KEY = 'crm_auth_token';
const SESSION_USER_KEY = 'crm_session_user';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors (private mode)
  }
}

export function getStoredSessionUser<T>(): T | null {
  try {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setStoredSessionUser(user: unknown | null) {
  try {
    if (user) localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_USER_KEY);
  } catch {
    // ignore storage errors
  }
}

let redirectingToLogin = false;

// Called when the API answers 401: drop the stale session and send the user
// back to the login page.
export function handleSessionExpired() {
  setAuthToken(null);
  setStoredSessionUser(null);

  if (typeof window === 'undefined' || redirectingToLogin) return;
  if (window.location.pathname.startsWith('/login')) return;

  redirectingToLogin = true;
  window.location.href = '/login';
}
