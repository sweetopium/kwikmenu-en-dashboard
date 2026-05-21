export const MEASURE_UNITS = [
  { value: '', label: 'Не указано' },
  { value: 'ml', label: 'мл' },
  { value: 'l', label: 'л' },
  { value: 'g', label: 'г' },
  { value: 'kg', label: 'кг' },
  { value: 'pcs', label: 'шт' },
  { value: 'portion', label: 'порция' },
];

export const formatMeasure = (value, unitCode, t) => {
  if (!value) return '';
  if (!unitCode || unitCode === 'null') return `${value}`.trim();
  const unit = MEASURE_UNITS.find((item) => item.value === unitCode);
  const label = t && unit ? t(`menuEditor.measureUnits.${unit.value || 'notSpecified'}`, { defaultValue: unit.label }) : (unit ? unit.label : '');
  return `${value} ${label}`.trim();
};

export const DIETARY_TAG_OPTIONS = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'gluten-free', label: 'Gluten Free' },
  { value: 'spicy', label: 'Spicy' },
  { value: 'contains-nuts', label: 'Contains Nuts' },
  { value: 'contains-dairy', label: 'Contains Dairy' },
  { value: 'caffeine-free', label: 'Caffeine Free' },
];

export const BADGE_OPTIONS = [
  { value: 'new', label: 'New', className: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
  { value: 'hit', label: 'Hit', className: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  { value: 'chefs-choice', label: "Chef's Choice", className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  { value: 'season', label: 'Season', className: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
];

export const getBadgeMeta = (badge) =>
  BADGE_OPTIONS.find((item) => item.value === badge) || null;

export const getLocalizedField = (entity, field, language, defaultLanguage = 'ru') => {
  if (!entity) return '';
  if (language === defaultLanguage) return entity[field] || '';
  return entity.translations?.[language]?.[field] || entity[field] || '';
};

export const setLocalizedField = (entity, field, value, language, defaultLanguage = 'ru') => {
  if (language === defaultLanguage) {
    return { ...entity, [field]: value };
  }

  return {
    ...entity,
    translations: {
      ...(entity.translations || {}),
      [language]: {
        ...(entity.translations?.[language] || {}),
        [field]: value,
      },
    },
  };
};

export const getAvailableHoursLabel = (availableHours) => {
  if (!availableHours?.start || !availableHours?.end) return '';
  return `${availableHours.start} - ${availableHours.end}`;
};

const parseEditorPriceValue = (value) => {
  const text = String(value || '').trim();
  if (!text) return null;

  const normalized = text.replace(/\s+/g, '').replace(',', '.');
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;

  const numeric = Number.parseFloat(match[0]);
  return Number.isFinite(numeric) ? numeric : null;
};

const formatEditorPriceValue = (value) => {
  if (!Number.isFinite(value)) return '';
  return Number.isInteger(value) ? `${value}` : value.toLocaleString('ru-RU');
};

export const getItemPriceDisplay = (item, t) => {
  const variants = Array.isArray(item?.variants) ? item.variants.filter((variant) => variant?.price) : [];
  if (!variants.length) {
    if (!item?.price) return '';
    return t ? t('menuEditor.priceValue', { price: item.price, defaultValue: `${item.price} ₽` }) : `${item.price} ₽`;
  }

  const numericPrices = variants
    .map((variant) => parseEditorPriceValue(variant.price))
    .filter((price) => price !== null);

  if (!numericPrices.length) {
    return t ? t('menuEditor.differentPrices', { defaultValue: 'Разные цены' }) : 'Разные цены';
  }

  const minPrice = Math.min(...numericPrices);
  const maxPrice = Math.max(...numericPrices);

  if (minPrice === maxPrice) {
    const formatted = formatEditorPriceValue(minPrice);
    return t ? t('menuEditor.priceValue', { price: formatted, defaultValue: `${formatted} ₽` }) : `${formatted} ₽`;
  }

  const minFormatted = formatEditorPriceValue(minPrice);
  const maxFormatted = formatEditorPriceValue(maxPrice);
  return t
    ? t('menuEditor.priceRange', { min: minFormatted, max: maxFormatted, defaultValue: `от ${minFormatted} до ${maxFormatted} ₽` })
    : `от ${minFormatted} до ${maxFormatted} ₽`;
};
