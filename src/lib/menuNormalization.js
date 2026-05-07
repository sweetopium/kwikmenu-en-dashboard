export const MENU_NORMALIZATION_API_URL = import.meta.env.VITE_MENU_NORMALIZATION_API_URL || '/api/menu-normalizations';

export const normalizeMenu = async (menu) => {
  const response = await fetch(MENU_NORMALIZATION_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ menu }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Menu normalization request failed with status ${response.status}`);
  }

  return response.json();
};
