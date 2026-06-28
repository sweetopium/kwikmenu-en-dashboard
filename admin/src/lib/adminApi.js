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
    if (Array.isArray(payload)) {
      const message = payload
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return String(item);
          }
          const location = Array.isArray(item.loc) ? item.loc.join('.') : '';
          const prefix = location ? `${location}: ` : '';
          return `${prefix}${item.msg || JSON.stringify(item)}`;
        })
        .join('; ');
      throw new Error(message || text);
    }

    if (Array.isArray(payload.detail)) {
      const message = payload.detail
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return String(item);
          }
          const location = Array.isArray(item.loc) ? item.loc.join('.') : '';
          const prefix = location ? `${location}: ` : '';
          return `${prefix}${item.msg || JSON.stringify(item)}`;
        })
        .join('; ');
      throw new Error(message || text);
    }

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
    if (response.status === 401) {
      storeAdminKey('');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    await parseApiError(response);
  }

  return response.json();
};

export const fetchOverview = (period = '7d') => adminFetch(`/overview?period=${period}`);
export const fetchUsers = () => adminFetch('/users?limit=100');
export const fetchUserDetail = (id) => adminFetch(`/users/${id}`);
export const deleteUser = (id) => adminFetch(`/users/${id}`, { method: 'DELETE' });
export const bulkDeleteUsers = (userIds) => adminFetch('/users/bulk-delete', {
  method: 'POST',
  body: JSON.stringify({ userIds }),
});
export const fetchVenues = () => adminFetch('/venues?limit=100');
export const fetchVenueDetail = (id) => adminFetch(`/venues/${id}`);
export const fetchMenus = () => adminFetch('/menus?limit=100');
export const fetchMenuDetail = (id) => adminFetch(`/menus/${id}`);
export const updateMenu = (id, payload) => adminFetch(`/menus/${id}`, {
  method: 'PATCH',
  body: JSON.stringify(payload),
});
export const fetchImports = () => adminFetch('/imports?limit=100');
export const fetchHelpRequests = () => adminFetch('/help-requests?limit=100');
export const fetchPublicMenuAnalytics = (period = '7d') => adminFetch(`/analytics/public-menu?period=${period}`);
export const fetchProductEventAnalytics = (period = '7d') => adminFetch(`/analytics/product-events?period=${period}`);
export const fetchSystemHealth = () => adminFetch('/system/health');
export const fetchBillingPlans = () => adminFetch('/billing/plans');
export const updateBillingPlan = (planId, payload) => adminFetch(`/billing/plans/${planId}`, {
  method: 'PATCH',
  body: JSON.stringify(payload),
});
export const fetchBillingSubscriptions = () => adminFetch('/billing/subscriptions');
export const processBillingRenewals = () => adminFetch('/billing/process-renewals', { method: 'POST' });
export const updateUserSubscription = (userId, payload) => adminFetch(`/users/${userId}/subscription`, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const createVirtualClient = (payload) => adminFetch('/virtual-clients', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const impersonateVirtualClient = (clientId) => adminFetch(`/virtual-clients/${clientId}/impersonate`, {
  method: 'POST',
});

export const resetVirtualClient = (clientId) => adminFetch(`/virtual-clients/${clientId}/reset`, {
  method: 'POST',
});

export const activateVirtualClient = (clientId, payload) => adminFetch(`/virtual-clients/${clientId}/activate`, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const createAdminVenue = (payload) => adminFetch('/venues', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const createAdminMenu = (payload) => adminFetch('/menus', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const fetchPromoPages = () => adminFetch('/promo-pages');
export const fetchPromoPageDetail = (id) => adminFetch(`/promo-pages/${id}`);
export const createPromoPage = (payload) => adminFetch('/promo-pages', {
  method: 'POST',
  body: JSON.stringify(payload),
});
export const updatePromoPage = (id, payload) => adminFetch(`/promo-pages/${id}`, {
  method: 'PATCH',
  body: JSON.stringify(payload),
});
export const deletePromoPage = (id) => adminFetch(`/promo-pages/${id}`, {
  method: 'DELETE',
});

export const convertHtmlToJson = (html) => adminFetch('/promo-pages/convert-html', {
  method: 'POST',
  body: JSON.stringify({ html }),
});

// Email Campaigns
export const fetchCampaignSteps = () => adminFetch('/email-campaigns/steps');
export const createCampaignStep = (payload) => adminFetch('/email-campaigns/steps', {
  method: 'POST',
  body: JSON.stringify(payload),
});
export const updateCampaignStep = (id, payload) => adminFetch('/email-campaigns/steps/' + id, {
  method: 'PUT',
  body: JSON.stringify(payload),
});
export const deleteCampaignStep = (id) => adminFetch('/email-campaigns/steps/' + id, {
  method: 'DELETE',
});
export const fetchCampaignLogs = (q = '', status = '', offset = 0, limit = 50) => {
  let queryParams = `?offset=${offset}&limit=${limit}`;
  if (q) queryParams += `&q=${encodeURIComponent(q)}`;
  if (status) queryParams += `&status=${encodeURIComponent(status)}`;
  return adminFetch(`/email-campaigns/logs${queryParams}`);
};
export const sendCampaignEmailNow = (id) => adminFetch(`/email-campaigns/logs/${id}/send-now`, {
  method: 'POST',
});
export const cancelCampaignEmail = (id) => adminFetch(`/email-campaigns/logs/${id}/cancel`, {
  method: 'POST',
});
export const fetchCampaignWebhook = () => adminFetch('/email-campaigns/webhook');
export const setupCampaignWebhook = () => adminFetch('/email-campaigns/webhook/setup', {
  method: 'POST',
});



