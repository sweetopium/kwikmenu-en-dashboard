export const AUTH_ME_API_URL = import.meta.env.VITE_AUTH_ME_URL || '/api/auth/me';
export const AUTH_LOGOUT_API_URL = import.meta.env.VITE_AUTH_LOGOUT_URL || '/api/auth/logout';

const parseApiError = async (response, fallbackMessage) => {
  const text = await response.text().catch(() => '');
  if (!text) {
    throw new Error(fallbackMessage);
  }

  let message = text;
  try {
    const payload = JSON.parse(text);
    message = payload.detail || payload.message || fallbackMessage;
  } catch {}

  throw new Error(message || fallbackMessage);
};

export const fetchCurrentUser = async () => {
  const response = await fetch(AUTH_ME_API_URL, {
    credentials: 'include',
  });

  if (!response.ok) {
    await parseApiError(response, `Current user request failed with status ${response.status}`);
  }

  return response.json();
};

export const logoutSession = async () => {
  const response = await fetch(AUTH_LOGOUT_API_URL, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    await parseApiError(response, `Logout request failed with status ${response.status}`);
  }
};
