import { formatNumber } from '../../lib/formatters';

export const StatCard = ({ label, value, icon: Icon, accent = 'text-brand-purple bg-brand-purple/10' }) => (
  <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{formatNumber(value)}</p>
      </div>
      {Icon ? (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          <Icon size={20} />
        </div>
      ) : null}
    </div>
  </div>
);
