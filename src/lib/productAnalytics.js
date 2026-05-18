export const PRODUCT_EVENTS_API_URL =
  import.meta.env.VITE_PRODUCT_EVENTS_API_URL || '/api/analytics/product-events';

const MAX_PROPERTY_STRING_LENGTH = 500;

const sanitizeProperties = (properties = {}) => {
  const sanitized = {};

  Object.entries(properties || {}).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (typeof value === 'string') {
      sanitized[key] = value.slice(0, MAX_PROPERTY_STRING_LENGTH);
      return;
    }

    if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
      sanitized[key] = value;
      return;
    }

    if (Array.isArray(value)) {
      sanitized[key] = value.slice(0, 25).map((item) =>
        ['string', 'number', 'boolean'].includes(typeof item) || item === null ? item : String(item)
      );
      return;
    }

    sanitized[key] = String(value).slice(0, MAX_PROPERTY_STRING_LENGTH);
  });

  return sanitized;
};

export const trackProductEvent = (eventName, {
  venueId,
  menuId,
  source = 'dashboard',
  page,
  properties = {},
} = {}) => {
  if (!eventName || typeof window === 'undefined') {
    return;
  }

  const payload = {
    eventName,
    eventVersion: 1,
    source,
    venueId: venueId || undefined,
    menuId: menuId || undefined,
    page: page || `${window.location.pathname}${window.location.search}`,
    properties: sanitizeProperties(properties),
  };

  const body = JSON.stringify(payload);

  fetch(PRODUCT_EVENTS_API_URL, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    keepalive: true,
  }).catch(() => {});
};
