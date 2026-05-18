import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { fetchVenues } from '../lib/adminApi';
import { formatDateTime, formatNumber } from '../lib/formatters';

const VenuesPage = () => {
  const [data, setData] = useState({ items: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVenues().then(setData).catch((nextError) => setError(nextError.message));
  }, []);

  return (
    <>
      <PageHeader title="Заведения" description="Все рестораны и их публичная активность." />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      <DataTable rows={data.items} columns={[
        { key: 'name', label: 'Заведение', render: (row) => <Link className="font-black text-brand-purple hover:underline" to={`/venues/${row.id}`}>{row.name}</Link> },
        { key: 'owner', label: 'Владелец', render: (row) => <span>{row.owner.name}<span className="block text-xs text-muted-foreground">{row.owner.email}</span></span> },
        { key: 'city', label: 'Локация', render: (row) => [row.city, row.country].filter(Boolean).join(', ') || '—' },
        { key: 'menusCount', label: 'Меню' },
        { key: 'publicViews', label: 'Просмотры', render: (row) => formatNumber(row.publicViews) },
        { key: 'createdAt', label: 'Создано', render: (row) => formatDateTime(row.createdAt) },
      ]} />
    </>
  );
};

export default VenuesPage;
