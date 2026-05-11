export const PUBLIC_MENU_API_URL = import.meta.env.VITE_PUBLIC_MENU_API_URL || '/api/public/m';

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

export const getPublicVenueMenus = async (venueId) => {
  const response = await fetch(`${PUBLIC_MENU_API_URL}/${venueId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    await parseApiError(response, `Public menu request failed with status ${response.status}`);
  }

  return response.json();
};
