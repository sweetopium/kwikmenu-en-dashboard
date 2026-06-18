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

const jsonRequest = async (url, { method = 'GET', body } = {}, fallbackMessage) => {
  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    await parseApiError(response, fallbackMessage || `Venue request failed with status ${response.status}`);
  }

  return response.json();
};

export const listVenues = () =>
  jsonRequest(VENUES_API_URL, {}, 'Could not load venue list.');

export const createVenue = (payload) =>
  jsonRequest(VENUES_API_URL, { method: 'POST', body: payload }, 'Could not create venue.');

export const getVenue = (venueId) =>
  jsonRequest(`${VENUES_API_URL}/${venueId}`, {}, 'Could not load venue.');

export const updateVenueProfile = (venueId, payload) =>
  jsonRequest(`${VENUES_API_URL}/${venueId}/profile`, { method: 'PATCH', body: payload }, 'Could not save venue profile.');

export const getVenueSettings = (venueId) =>
  jsonRequest(`${VENUES_API_URL}/${venueId}/settings`, {}, 'Could not load venue settings.');

export const updateVenueWifi = (venueId, payload) =>
  jsonRequest(`${VENUES_API_URL}/${venueId}/wifi`, { method: 'PATCH', body: payload }, 'Could not save Wi-Fi settings.');

export const updateVenueDesign = (venueId, payload) =>
  jsonRequest(`${VENUES_API_URL}/${venueId}/design`, { method: 'PATCH', body: payload }, 'Could not save appearance settings.');

export const updateVenueQr = (venueId, payload) =>
  jsonRequest(`${VENUES_API_URL}/${venueId}/qr`, { method: 'PATCH', body: payload }, 'Could not save QR settings.');
