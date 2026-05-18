import { useEffect, useState } from 'react';
import { Eye, Languages, Link as LinkIcon, Users } from 'lucide-react';
import { PageHeader } from '../components/admin/PageHeader';
import { StatCard } from '../components/admin/StatCard';
import { fetchPublicMenuAnalytics } from '../lib/adminApi';
import { formatNumber } from '../lib/formatters';

const AnalyticsPage = () => {
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPublicMenuAnalytics(period).then(setData).catch((nextError) => setError(nextError.message));
  }, [period]);

  const maxViews = Math.max(1, ...(data?.series || []).map((point) => point.views));

  return (
    <>
      <PageHeader
        title="Публичная аналитика"
        description="Сводка по открытиям публичных меню, уникальным посетителям, referer и языкам."
        actions={<select value={period} onChange={(event) => setPeriod(event.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-bold outline-none"><option value="24h">24 часа</option><option value="7d">7 дней</option><option value="30d">30 дней</option><option value="90d">90 дней</option></select>}
      />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Просмотры" value={data?.totalViews} icon={Eye} />
        <StatCard label="Уникальные посетители" value={data?.uniqueVisitors} icon={Users} accent="bg-blue-50 text-blue-600" />
      </div>
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <h2 className="mb-5 text-lg font-black">Динамика</h2>
        <div className="flex h-64 items-end gap-2 border-b border-border/70 pb-3">
          {(data?.series || []).map((point) => (
            <div key={point.date} className="flex min-w-8 flex-1 flex-col items-center gap-2">
              <div className="w-full rounded-t-md bg-brand-purple/75" style={{ height: `${Math.max(4, (point.views / maxViews) * 220)}px` }} />
              <span className="text-[10px] font-bold text-muted-foreground">{point.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><LinkIcon size={18} /> Referer</h2>
          <div className="space-y-3">
            {(data?.topReferers || []).map(([name, count]) => <div key={name} className="flex justify-between gap-4 rounded-xl bg-secondary/45 px-3 py-2"><span className="truncate text-sm font-bold">{name}</span><span className="font-black">{formatNumber(count)}</span></div>)}
          </div>
        </section>
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><Languages size={18} /> Языки</h2>
          <div className="space-y-3">
            {(data?.topLanguages || []).map(([name, count]) => <div key={name} className="flex justify-between gap-4 rounded-xl bg-secondary/45 px-3 py-2"><span className="truncate text-sm font-bold">{name}</span><span className="font-black">{formatNumber(count)}</span></div>)}
          </div>
        </section>
      </div>
    </>
  );
};

export default AnalyticsPage;
