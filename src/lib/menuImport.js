export const MENU_IMPORT_WEBHOOK_URL = 'https://n8n.rtctrf.com/webhook-test/5fbe7bd4-d627-4315-9a1b-ad1ac1fb6617';

const FALLBACK_PROCESSING_MS = 1200;

const trimString = (value) => `${value ?? ''}`.trim();

export const buildMenuImportPreview = ({ menuSource, files, menuLink }) => {
  const fileCount = files.length;
  const detectedCategories = menuSource === 'file'
    ? Math.max(3, Math.min(9, fileCount * 2 + 1))
    : 4;
  const detectedItems = menuSource === 'file'
    ? Math.max(12, fileCount * 14)
    : 28;

  return {
    detectedCategories,
    detectedItems,
    sourceLabel: menuSource === 'file'
      ? fileCount === 1
        ? files[0].name
        : `${fileCount} файлов`
      : trimString(menuLink),
  };
};

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

  const requestStartedAt = Date.now();

  try {
    const response = await fetch(MENU_IMPORT_WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }

    let payload = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      payload = await response.json().catch(() => null);
    } else {
      await response.text().catch(() => null);
    }

    return {
      payload,
      processingDelayMs: Math.max(800, FALLBACK_PROCESSING_MS - (Date.now() - requestStartedAt)),
      transport: 'cors',
    };
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }

    await fetch(MENU_IMPORT_WEBHOOK_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors',
    });

    return {
      payload: null,
      processingDelayMs: Math.max(800, FALLBACK_PROCESSING_MS - (Date.now() - requestStartedAt)),
      transport: 'opaque',
    };
  }
};
