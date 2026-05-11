const AUTH_API_BASE_URL = (import.meta.env.VITE_AUTH_API_BASE_URL || '').trim();

const joinUrl = (base, path) => {
  if (!base) {
    return path;
  }

  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const resolveAuthUrl = (explicitUrl, fallbackPath) => {
  const direct = (explicitUrl || '').trim();
  if (direct) {
    return direct;
  }

  return joinUrl(AUTH_API_BASE_URL, fallbackPath);
};

const parseResponsePayload = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const authRequest = async ({ url, payload }) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const result = await parseResponsePayload(response);

  if (!response.ok) {
    const message =
      result?.detail ||
      result?.message ||
      result?.error ||
      `Auth request failed with status ${response.status}`;
    throw new Error(message);
  }

  return result;
};

export const loginWithEmail = async (payload) =>
  authRequest({
    url: resolveAuthUrl(import.meta.env.VITE_AUTH_LOGIN_URL, '/api/auth/login'),
    payload,
  });

export const registerWithEmail = async (payload) =>
  authRequest({
    url: resolveAuthUrl(import.meta.env.VITE_AUTH_REGISTER_URL, '/api/auth/register'),
    payload,
  });

export const getProviderAuthUrl = (provider) => {
  const explicitUrls = {
    google: import.meta.env.VITE_AUTH_GOOGLE_URL,
    yandex: import.meta.env.VITE_AUTH_YANDEX_URL,
    mailru: import.meta.env.VITE_AUTH_MAILRU_URL,
  };

  return resolveAuthUrl(explicitUrls[provider], `/api/auth/oauth/${provider}`);
};

export const getForgotPasswordUrl = () =>
  resolveAuthUrl(import.meta.env.VITE_AUTH_FORGOT_PASSWORD_URL, '/forgot-password');

export const getPostLoginRedirect = () =>
  (import.meta.env.VITE_AUTH_POST_LOGIN_REDIRECT || '/dashboard').trim();

export const getPostRegisterRedirect = () =>
  (import.meta.env.VITE_AUTH_POST_REGISTER_REDIRECT || '/onboarding/upload').trim();
