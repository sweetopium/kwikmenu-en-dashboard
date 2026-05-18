import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { StatCard } from '../components/admin/StatCard';
import { fetchProductEventAnalytics } from '../lib/adminApi';
import { formatDateTime, formatNumber } from '../lib/formatters';

const ProductEventsPage = () => {
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState({ items: [], eventCounts: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProductEventAnalytics(period).then(setData).catch((nextError) => setError(nextError.message));
  }, [period]);

  return (
    <>
      <PageHeader
        title="Product events"
        description="События кабинета и backend-а: регистрации, публикации меню, сохранения, действия в аналитике."
        actions={<select value={period} onChange={(event) => setPeriod(event.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-bold outline-none"><option value="24h">24 часа</option><option value="7d">7 дней</option><option value="30d">30 дней</option><option value="90d">90 дней</option></select>}
      />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      <StatCard label="События за период" value={data.totalEvents} icon={Activity} />
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-black">Топ событий</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data.eventCounts || []).map(([name, count]) => <div key={name} className="rounded-xl bg-secondary/45 px-3 py-2"><p className="truncate text-sm font-bold">{name}</p><p className="text-xl font-black">{formatNumber(count)}</p></div>)}
        </div>
      </section>
      <DataTable rows={data.items || []} columns={[
        { key: 'eventName', label: 'Событие', render: (row) => <span className="font-black">{row.eventName}<span className="block text-xs text-muted-foreground">{row.source}</span></span> },
        { key: 'page', label: 'Страница', render: (row) => row.page || '—' },
        { key: 'userId', label: 'User', render: (row) => row.userId ? <span className="font-mono text-xs">{row.userId}</span> : '—' },
        { key: 'venueId', label: 'Venue', render: (row) => row.venueId ? <span className="font-mono text-xs">{row.venueId}</span> : '—' },
        { key: 'createdAt', label: 'Создано', render: (row) => formatDateTime(row.createdAt) },
      ]} />
    </>
  );
};

export default ProductEventsPage;
