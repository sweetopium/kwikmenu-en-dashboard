export const VENUES_API_URL = import.meta.env.VITE_VENUES_API_URL || '/api/venues';

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

export const listVenues = async () => {
  const response = await fetch(VENUES_API_URL, {
    credentials: 'include',
  });

  if (!response.ok) {
    await parseApiError(response, `Venues request failed with status ${response.status}`);
  }

  return response.json();
};

export const createVenue = async (payload) => {
  const response = await fetch(VENUES_API_URL, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await parseApiError(response, `Venue create request failed with status ${response.status}`);
  }

  return response.json();
};
