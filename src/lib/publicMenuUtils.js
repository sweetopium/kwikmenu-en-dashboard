const UNIT_LABELS = {
  ml: 'мл',
  l: 'л',
  g: 'г',
  kg: 'кг',
  pcs: 'шт',
  portion: 'порция',
};

export const normalizeTemplateType = (value) => {
  const normalized = String(value || 'simple').trim().toLowerCase();

  if (normalized === 'simple-menu' || normalized === 'simple') {
    return 'simple';
  }

  if (normalized === 'extended' || normalized === 'extended-menu') {
    return 'extended';
  }

  if (normalized === 'premium' || normalized === 'premium-menu') {
    return 'premium';
  }

  return 'simple';
};

export const isFilled = (value) => {
  if (value === 0) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null;
};

export const getLocalizedField = (entity, field, language, fallbackLanguage) => {
  if (!entity) {
    return '';
  }

  const directTranslation = entity.translations?.[language]?.[field];
  if (isFilled(directTranslation)) {
    return directTranslation;
  }

  const shortLanguage = String(language || '').toLowerCase().split('-')[0];
  const shortTranslation = entity.translations?.[shortLanguage]?.[field];
  if (isFilled(shortTranslation)) {
    return shortTranslation;
  }

  if (fallbackLanguage && fallbackLanguage !== language) {
    const fallbackTranslation = entity.translations?.[fallbackLanguage]?.[field];
    if (isFilled(fallbackTranslation)) {
      return fallbackTranslation;
    }
  }

  return entity[field] || '';
};

export const formatMeasure = (value, unitCode) => {
  if (!isFilled(value)) {
    return '';
  }

  const normalizedUnit = unitCode ? String(unitCode).toLowerCase() : '';
  const unitLabel = UNIT_LABELS[normalizedUnit];

  return unitLabel ? `${value} ${unitLabel}` : `${value}`;
};

export const getLanguagePillLabel = (language) => {
  if (language?.flag && language.flag.length <= 4) {
    return language.flag;
  }

  if (language?.shortLabel) {
    return language.shortLabel.toUpperCase();
  }

  return String(language?.code || '??').toUpperCase();
};

export const hexToRgba = (hex, alpha) => {
  const sanitized = String(hex || '').trim().replace('#', '');
  if (![3, 6].includes(sanitized.length)) {
    return `rgba(109, 103, 235, ${alpha})`;
  }

  const expanded = sanitized.length === 3
    ? sanitized.split('').map((char) => `${char}${char}`).join('')
    : sanitized;

  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getContrastColor = (hex) => {
  const sanitized = String(hex || '').trim().replace('#', '');
  if (![3, 6].includes(sanitized.length)) {
    return '#ffffff';
  }

  const expanded = sanitized.length === 3
    ? sanitized.split('').map((char) => `${char}${char}`).join('')
    : sanitized;

  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.62 ? '#111827' : '#ffffff';
};

export const formatCurrency = (price) => {
  if (!isFilled(price)) {
    return '';
  }

  return String(price).trim();
};
