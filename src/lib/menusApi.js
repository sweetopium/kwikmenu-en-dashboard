export const MENUS_API_URL = import.meta.env.VITE_MENUS_API_URL || '/api/menus';

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

export const listMenus = async ({ venueId } = {}) => {
  const url = new URL(MENUS_API_URL, window.location.origin);
  if (venueId) {
    url.searchParams.set('venue_id', venueId);
  }

  const response = await fetch(url.pathname + url.search, {
    credentials: 'include',
  });

  if (!response.ok) {
    await parseApiError(response, `Menus request failed with status ${response.status}`);
  }

  return response.json();
};

export const getMenu = async (menuId) => {
  const response = await fetch(`${MENUS_API_URL}/${menuId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    await parseApiError(response, `Menu request failed with status ${response.status}`);
  }

  return response.json();
};

export const updateMenu = async (menuId, payload) => {
  const response = await fetch(`${MENUS_API_URL}/${menuId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await parseApiError(response, `Menu update request failed with status ${response.status}`);
  }

  return response.json();
};

export const publishMenu = async (menuId) => {
  const response = await fetch(`${MENUS_API_URL}/${menuId}/publish`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    await parseApiError(response, `Menu publish request failed with status ${response.status}`);
  }

  return response.json();
};

export const unpublishMenu = async (menuId) => {
  const response = await fetch(`${MENUS_API_URL}/${menuId}/unpublish`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    await parseApiError(response, `Menu unpublish request failed with status ${response.status}`);
  }

  return response.json();
};
