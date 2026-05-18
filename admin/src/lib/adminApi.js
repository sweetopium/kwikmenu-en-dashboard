const ADMIN_KEY_STORAGE_KEY = 'kwikmenu-admin-key';
const trimTrailingSlash = (value) => value.replace(/\/+$/, '');
const rawAdminApiBaseUrl = import.meta.env.VITE_ADMIN_API_BASE_URL;
const rawApiRootUrl = import.meta.env.VITE_ADMIN_API_ROOT;
const API_BASE_URL = rawAdminApiBaseUrl
  ? trimTrailingSlash(rawAdminApiBaseUrl)
  : rawApiRootUrl
    ? `${trimTrailingSlash(rawApiRootUrl)}/admin`
    : '/api/admin';

export const getStoredAdminKey = () => localStorage.getItem(ADMIN_KEY_STORAGE_KEY) || '';

export const storeAdminKey = (value) => {
  if (value) {
    localStorage.setItem(ADMIN_KEY_STORAGE_KEY, value);
  } else {
    localStorage.removeItem(ADMIN_KEY_STORAGE_KEY);
  }
};

const parseApiError = async (response) => {
  const text = await response.text().catch(() => '');
  if (!text) {
    throw new Error(`Admin API request failed with status ${response.status}`);
  }

  try {
    const payload = JSON.parse(text);
    throw new Error(payload.detail || payload.message || text);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(text);
    }
    throw error;
  }
};

export const adminFetch = async (path, options = {}) => {
  const key = getStoredAdminKey();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(key ? { 'X-Admin-Key': key } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    await parseApiError(response);
  }

  return response.json();
};

export const fetchOverview = (period = '7d') => adminFetch(`/overview?period=${period}`);
export const fetchUsers = () => adminFetch('/users?limit=100');
export const fetchUserDetail = (id) => adminFetch(`/users/${id}`);
export const fetchVenues = () => adminFetch('/venues?limit=100');
export const fetchVenueDetail = (id) => adminFetch(`/venues/${id}`);
export const fetchMenus = () => adminFetch('/menus?limit=100');
export const fetchImports = () => adminFetch('/imports?limit=100');
export const fetchHelpRequests = () => adminFetch('/help-requests?limit=100');
export const fetchPublicMenuAnalytics = (period = '7d') => adminFetch(`/analytics/public-menu?period=${period}`);
export const fetchProductEventAnalytics = (period = '7d') => adminFetch(`/analytics/product-events?period=${period}`);
export const fetchSystemHealth = () => adminFetch('/system/health');
