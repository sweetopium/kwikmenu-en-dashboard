export const MEASURE_UNITS = [
  { value: '', label: 'Не указано' },
  { value: 'ml', label: 'мл' },
  { value: 'l', label: 'л' },
  { value: 'g', label: 'г' },
  { value: 'kg', label: 'кг' },
  { value: 'pcs', label: 'шт' },
  { value: 'portion', label: 'порция' },
];

export const formatMeasure = (value, unitCode) => {
  if (!value) return '';
  if (!unitCode || unitCode === 'null') return `${value}`.trim();
  const unit = MEASURE_UNITS.find((item) => item.value === unitCode);
  return `${value} ${unit && unit.value ? unit.label : ''}`.trim();
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
