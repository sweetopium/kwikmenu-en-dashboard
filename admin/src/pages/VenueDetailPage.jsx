import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusBadge } from '../components/admin/StatusBadge';
import { fetchVenueDetail } from '../lib/adminApi';
import { formatDateTime, formatNumber } from '../lib/formatters';

const VenueDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVenueDetail(id).then(setData).catch((nextError) => setError(nextError.message));
  }, [id]);

  const venue = data?.venue;

  return (
    <>
      <PageHeader title={venue?.name || 'Заведение'} description={venue ? `${data.owner.email} · ${venue.publicPath}` : 'Загрузка...'} />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      {venue ? (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><p className="text-xs font-bold uppercase text-muted-foreground">Просмотры</p><p className="mt-2 text-3xl font-black">{formatNumber(venue.publicViews)}</p></div>
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><p className="text-xs font-bold uppercase text-muted-foreground">Валюта</p><p className="mt-2 text-3xl font-black">{data.settings.currency}</p></div>
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><p className="text-xs font-bold uppercase text-muted-foreground">Публичное меню</p><div className="mt-3"><StatusBadge value={data.settings.publicMenuEnabled ? 'active' : 'disabled'} /></div></div>
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><p className="text-xs font-bold uppercase text-muted-foreground">Город</p><p className="mt-2 text-xl font-black">{venue.city || '—'}</p></div>
          </div>
          <DataTable rows={data.menus} columns={[
            { key: 'name', label: 'Меню', render: (row) => <span className="font-black">{row.name}</span> },
            { key: 'status', label: 'Статус', render: (row) => <StatusBadge value={row.status} /> },
            { key: 'categoriesCount', label: 'Категории' },
            { key: 'itemsCount', label: 'Позиции' },
            { key: 'updatedAt', label: 'Обновлено', render: (row) => formatDateTime(row.updatedAt) },
          ]} />
          <DataTable rows={data.imports} columns={[
            { key: 'id', label: 'Импорт' },
            { key: 'status', label: 'Статус', render: (row) => <StatusBadge value={row.status} /> },
            { key: 'menuSource', label: 'Источник' },
            { key: 'error', label: 'Ошибка', render: (row) => row.error || '—' },
            { key: 'createdAt', label: 'Создан', render: (row) => formatDateTime(row.createdAt) },
          ]} />
        </>
      ) : null}
    </>
  );
};

export default VenueDetailPage;
