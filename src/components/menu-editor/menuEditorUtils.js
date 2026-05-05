export const MEASURE_UNITS = [
  { value: 'ml', label: 'мл' },
  { value: 'l', label: 'л' },
  { value: 'g', label: 'г' },
  { value: 'kg', label: 'кг' },
  { value: 'pcs', label: 'шт' },
  { value: 'portion', label: 'порция' },
];

export const formatMeasure = (value, unitCode) => {
  if (!value) return '';
  const unit = MEASURE_UNITS.find((item) => item.value === unitCode);
  return `${value} ${unit ? unit.label : ''}`.trim();
};
