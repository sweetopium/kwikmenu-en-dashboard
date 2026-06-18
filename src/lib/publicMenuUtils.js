const UNIT_LABELS = {
  ru: {
    ml: 'ml',
    l: 'l',
    g: 'g',
    kg: 'kg',
    pcs: 'pcs',
    portion: 'portion',
  },
  en: {
    ml: 'ml',
    l: 'l',
    g: 'g',
    kg: 'kg',
    pcs: 'pcs',
    portion: 'portion',
  },
};

const CURRENCY_SYMBOLS = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'DH',
  TRY: '₺',
  KZT: '₸',
  UZS: "so'm",
  BYN: 'Br',
  GEL: '₾',
  AMD: '֏',
  KGS: 'KGS',
  AZN: '₼',
  CNY: '¥',
  JPY: '¥',
};

export const normalizeTemplateType = (value) => {
  const normalized = String(value || 'simple').trim().toLowerCase();

  if (normalized === 'simple-menu' || normalized === 'simple' || normalized === 'classic') {
    return 'simple';
  }

  if (normalized === 'extended' || normalized === 'extended-menu' || normalized === 'minimal') {
    return 'extended';
  }

  if (normalized === 'premium' || normalized === 'premium-menu' || normalized === 'accent') {
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

export const formatMeasure = (value, unitCode, language = 'en') => {
  if (!isFilled(value)) {
    return '';
  }

  const normalizedUnit = unitCode ? String(unitCode).toLowerCase() : '';
  const lang = String(language || 'en').toLowerCase().split('-')[0];
  const labels = UNIT_LABELS[lang] || UNIT_LABELS.en;
  const unitLabel = labels[normalizedUnit];

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

const translationHasVisibleValues = (translation) => {
  if (!translation || typeof translation !== 'object') {
    return false;
  }

  return Object.values(translation).some((value) => isFilled(value));
};

const objectHasLanguageContent = (value, languageCode, shortLanguageCode) => {
  if (!value) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => objectHasLanguageContent(item, languageCode, shortLanguageCode));
  }

  if (typeof value !== 'object') {
    return false;
  }

  if (value.translations) {
    const directTranslation = value.translations[languageCode];
    const shortTranslation = value.translations[shortLanguageCode];

    if (translationHasVisibleValues(directTranslation) || translationHasVisibleValues(shortTranslation)) {
      return true;
    }
  }

  return Object.values(value).some((nestedValue) => objectHasLanguageContent(nestedValue, languageCode, shortLanguageCode));
};

export const getVisibleMenuLanguages = (payload, defaultLanguage = 'en') => {
  const configuredLanguages = payload?.languages || [];

  if (!configuredLanguages.length) {
    return [];
  }

  return configuredLanguages.filter((language) => {
    const code = String(language?.code || '').trim().toLowerCase();
    if (!code) {
      return false;
    }

    if (code === String(defaultLanguage || 'en').trim().toLowerCase()) {
      return true;
    }

    const shortCode = code.split('-')[0];
    return objectHasLanguageContent(payload, code, shortCode);
  });
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

export const getCurrencySymbol = (currencyCode) => {
  const normalizedCode = String(currencyCode || '').trim().toUpperCase();
  return CURRENCY_SYMBOLS[normalizedCode] || normalizedCode || '';
};

export const formatCurrency = (price, currencyCode = 'USD') => {
  if (!isFilled(price)) {
    return { amount: '', symbol: '' };
  }

  const rawPrice = String(price).trim();
  const configuredSymbol = getCurrencySymbol(currencyCode);
  const symbolMatch = rawPrice.match(/[₽$€£¥₺₾֏₼]|so'm|DH|Br|KGS/iu);
  const amount = rawPrice
    .replace(/[₽$€£¥₺₾֏₼]/g, '')
    .replace(/so'm/giu, '')
    .replace(/DH/giu, '')
    .replace(/Br/giu, '')
    .replace(/KGS/giu, '')
    .trim();

  return {
    amount: amount || rawPrice,
    symbol: symbolMatch?.[0] || configuredSymbol,
  };
};
