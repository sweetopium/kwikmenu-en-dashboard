import { useEffect, useState } from 'react';
import { Activity, Building2, Eye, MenuSquare, UploadCloud, Users } from 'lucide-react';
import { PageHeader } from '../components/admin/PageHeader';
import { StatCard } from '../components/admin/StatCard';
import { StatusBadge } from '../components/admin/StatusBadge';
import { fetchOverview } from '../lib/adminApi';
import { formatNumber } from '../lib/formatters';

const OverviewPage = () => {
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    fetchOverview(period).then(setData).catch((nextError) => setError(nextError.message));
  }, [period]);

  const totals = data?.totals || {};
  const periodTotals = data?.periodTotals || {};
  const maxViews = Math.max(1, ...(data?.series || []).map((point) => point.views));

  return (
    <>
      <PageHeader
        title="Обзор платформы"
        description="Операционная сводка по пользователям, заведениям, импортам и аналитике меню."
        actions={(
          <select value={period} onChange={(event) => setPeriod(event.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-bold outline-none">
            <option value="24h">24 часа</option>
            <option value="7d">7 дней</option>
            <option value="30d">30 дней</option>
            <option value="90d">90 дней</option>
          </select>
        )}
      />

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Пользователи" value={totals.users} icon={Users} />
        <StatCard label="Заведения" value={totals.venues} icon={Building2} accent="bg-blue-50 text-blue-600" />
        <StatCard label="Активные меню" value={totals.activeMenus} icon={MenuSquare} accent="bg-emerald-50 text-emerald-600" />
        <StatCard label="Просмотры меню" value={periodTotals.publicViews} icon={Eye} accent="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black">Динамика публичных меню</h2>
              <p className="text-sm text-muted-foreground">Просмотры и уникальные посетители за период</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black">{formatNumber(periodTotals.uniqueVisitors)}</p>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">уникальных</p>
            </div>
          </div>
          <div className="flex h-64 items-end gap-2 border-b border-border/70 pb-3">
            {(data?.series || []).map((point) => (
              <div key={point.date} className="flex min-w-8 flex-1 flex-col items-center gap-2">
                <div className="flex w-full items-end justify-center gap-1">
                  <div className="w-1/2 rounded-t-md bg-brand-purple/75" style={{ height: `${Math.max(4, (point.views / maxViews) * 220)}px` }} />
                  <div className="w-1/2 rounded-t-md border border-border bg-secondary" style={{ height: `${Math.max(4, (point.uniqueVisitors / maxViews) * 220)}px` }} />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">{point.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-black">Импорты</h2>
            <div className="space-y-2">
              {Object.entries(data?.importStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between gap-3">
                  <StatusBadge value={status} />
                  <span className="font-black">{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-black">Сигналы периода</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-muted-foreground">Новые пользователи</p><p className="text-xl font-black">{formatNumber(periodTotals.newUsers)}</p></div>
              <div><p className="text-muted-foreground">Новые заведения</p><p className="text-xl font-black">{formatNumber(periodTotals.newVenues)}</p></div>
              <div><p className="text-muted-foreground">Импорты</p><p className="text-xl font-black">{formatNumber(periodTotals.imports)}</p></div>
              <div><p className="text-muted-foreground">Ошибки импортов</p><p className="text-xl font-black">{formatNumber(periodTotals.failedImports)}</p></div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><Building2 size={18} /> Топ заведений</h2>
          <div className="space-y-3">
            {(data?.topVenues || []).map((venue) => (
              <div key={venue.id} className="flex items-center justify-between gap-4 rounded-xl bg-secondary/45 px-3 py-2">
                <span className="min-w-0 truncate text-sm font-bold">{venue.name}</span>
                <span className="text-sm font-black">{formatNumber(venue.views)}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><Activity size={18} /> Product events</h2>
          <div className="space-y-3">
            {(data?.productEvents || []).map(([name, count]) => (
              <div key={name} className="flex items-center justify-between gap-4 rounded-xl bg-secondary/45 px-3 py-2">
                <span className="min-w-0 truncate text-sm font-bold">{name}</span>
                <span className="text-sm font-black">{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export default OverviewPage;
