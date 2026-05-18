import { statusTone } from '../../lib/formatters';
import { cn } from '../../lib/utils';

export const StatusBadge = ({ value }) => (
  <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold', statusTone(value))}>
    {value || '—'}
  </span>
);
