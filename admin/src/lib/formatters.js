export const formatNumber = (value) => Number(value || 0).toLocaleString('ru-RU');

export const formatDateTime = (value) => {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export const statusTone = (status) => {
  if (['active', 'published', 'completed', 'ok'].includes(status)) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (['failed', 'error'].includes(status)) {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  if (['processing', 'queued', 'accepted'].includes(status)) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  return 'bg-secondary text-muted-foreground border-border';
};
