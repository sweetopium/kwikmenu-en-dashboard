const DEMO_API_BASE_URL = import.meta.env.VITE_DEMO_API_BASE_URL || '/api/demo';
const DEMO_TOKEN_STORAGE_KEY = 'kwikmenu-demo-token';

export const getStoredDemoToken = () => {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.localStorage.getItem(DEMO_TOKEN_STORAGE_KEY) || '';
};

export const storeDemoToken = (token) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.localStorage.setItem(DEMO_TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(DEMO_TOKEN_STORAGE_KEY);
  }
};

const parseApiError = async (response, fallbackMessage) => {
  const text = await response.text().catch(() => '');
  if (!text) {
    throw new Error(fallbackMessage);
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(text);
  }

  throw new Error(payload.detail || payload.message || fallbackMessage);
};

export const verifyDemoToken = async (token) => {
  const response = await fetch(`${DEMO_API_BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    await parseApiError(response, 'Invalid demo token');
  }

  return response.json();
};

export const submitDemoMenuImport = async ({
  token,
  menuSource,
  files = [],
  menuLink = '',
  restaurantName = '',
  contactPhone = '',
  city = '',
  country = '',
  currency = 'USD',
  signal,
}) => {
  const formData = new FormData();
  formData.append('menu_source', menuSource);

  files.forEach((file) => {
    formData.append('files', file, file.name);
  });

  if (menuSource === 'link') {
    formData.append('menu_link', menuLink.trim());
  }
  if (restaurantName.trim()) formData.append('restaurant_name', restaurantName.trim());
  if (contactPhone.trim()) formData.append('contact_phone', contactPhone.trim());
  if (city.trim()) formData.append('city', city.trim());
  if (country.trim()) formData.append('country', country.trim());
  if (currency.trim()) formData.append('currency', currency.trim().toUpperCase());

  const response = await fetch(`${DEMO_API_BASE_URL}/imports`, {
    method: 'POST',
    headers: { 'X-Demo-Token': token },
    body: formData,
    signal,
  });

  if (!response.ok) {
    await parseApiError(response, `Demo import failed with status ${response.status}`);
  }

  return response.json();
};

export const pollDemoMenuImport = async (id, { token, signal } = {}) => {
  const response = await fetch(`${DEMO_API_BASE_URL}/imports/${id}`, {
    headers: { 'X-Demo-Token': token },
    signal,
  });

  if (!response.ok) {
    await parseApiError(response, `Demo import status failed with status ${response.status}`);
  }

  return response.json();
};

export const getTemporaryMenu = async (id, { signal } = {}) => {
  const response = await fetch(`${DEMO_API_BASE_URL}/tmp/${id}`, { signal });

  if (!response.ok) {
    await parseApiError(response, `Temporary menu request failed with status ${response.status}`);
  }

  return response.json();
};
