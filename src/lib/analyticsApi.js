export const ANALYTICS_API_URL = import.meta.env.VITE_ANALYTICS_API_URL || '/api/analytics';

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

export const getVenueAnalyticsOverview = async ({ venueId, period = '7d' }) => {
  const url = new URL(`${ANALYTICS_API_URL}/venues/${venueId}/overview`, window.location.origin);
  url.searchParams.set('period', period);

  const response = await fetch(url.pathname + url.search, {
    credentials: 'include',
  });

  if (!response.ok) {
    await parseApiError(response, `Analytics request failed with status ${response.status}`);
  }

  return response.json();
};
