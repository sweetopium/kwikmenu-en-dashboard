export const MENU_IMPORT_API_URL = import.meta.env.VITE_MENU_IMPORT_API_URL || '/api/menu-imports';

const trimString = (value) => `${value ?? ''}`.trim();

export const submitMenuImport = async ({
  menuSource,
  files = [],
  menuLink = '',
  context = {},
}) => {
  const formData = new FormData();

  formData.append('menu_source', menuSource);
  formData.append('submitted_at', new Date().toISOString());

  files.forEach((file) => {
    formData.append('files', file, file.name);
  });

  if (menuSource === 'link') {
    formData.append('menu_link', trimString(menuLink));
  }

  Object.entries(context).forEach(([key, value]) => {
    const normalized = trimString(value);
    if (normalized) {
      formData.append(key, normalized);
    }
  });

  const response = await fetch(MENU_IMPORT_API_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Menu import request failed with status ${response.status}`);
  }

  return response.json();
};

export const pollMenuImportStatus = async (jobId) => {
  const response = await fetch(`${MENU_IMPORT_API_URL}/${jobId}`);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Menu import status request failed with status ${response.status}`);
  }

  return response.json();
};
