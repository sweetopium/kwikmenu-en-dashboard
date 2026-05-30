const parseApiError = async (response, fallbackMessage) => {
  const text = await response.text().catch(() => '');
  if (!text) {
    throw new Error(fallbackMessage);
  }

  try {
    const payload = JSON.parse(text);
    throw new Error(payload.detail || payload.message || fallbackMessage);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(text);
    }
    throw error;
  }
};

export const createMenuItemImageUploadUrl = async ({ filename, contentType }) => {
  const response = await fetch('/api/media/menu-item-image/upload-url', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename, contentType }),
  });

  if (!response.ok) {
    await parseApiError(response, `Media request failed with status ${response.status}`);
  }

  return response.json();
};

export const uploadFileToPresignedUrl = async ({ uploadUrl, headers, file }) => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body: file,
  });

  if (!response.ok) {
    throw new Error('Не удалось загрузить изображение в хранилище.');
  }
};
