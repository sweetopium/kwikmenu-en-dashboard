export const HELP_REQUESTS_API_URL = import.meta.env.VITE_HELP_REQUESTS_API_URL || '/api/help-requests';

const trimString = (value) => `${value ?? ''}`.trim();

export const submitHelpRequest = async ({
  name,
  phone,
  messenger,
  countryCode,
  countryName,
  city,
  restaurantName,
  uploadLater,
  menuSource,
  menuLink = '',
  menuFile = null,
  signal,
}) => {
  const formData = new FormData();
  formData.append('name', trimString(name));
  formData.append('phone', trimString(phone));
  formData.append('messenger', trimString(messenger));
  formData.append('country_code', trimString(countryCode));
  formData.append('country_name', trimString(countryName));
  formData.append('city', trimString(city));
  formData.append('restaurant_name', trimString(restaurantName));
  formData.append('upload_later', uploadLater ? 'true' : 'false');
  formData.append('menu_source', trimString(menuSource));

  if (!uploadLater && menuSource === 'link') {
    formData.append('menu_link', trimString(menuLink));
  }

  if (!uploadLater && menuSource === 'file' && menuFile) {
    formData.append('menu_file', menuFile, menuFile.name);
  }

  const response = await fetch(HELP_REQUESTS_API_URL, {
    method: 'POST',
    body: formData,
    signal,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = payload?.detail || payload?.message || payload || `Help request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
};
