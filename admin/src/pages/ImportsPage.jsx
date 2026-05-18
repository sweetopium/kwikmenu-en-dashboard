import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusBadge } from '../components/admin/StatusBadge';
import { fetchImports } from '../lib/adminApi';
import { formatDateTime } from '../lib/formatters';

const ImportsPage = () => {
  const [data, setData] = useState({ items: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchImports().then(setData).catch((nextError) => setError(nextError.message));
  }, []);

  return (
    <>
      <PageHeader title="Импорты меню" description="Очередь распознавания меню, ошибки, fallback и результаты." />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      <DataTable rows={data.items} columns={[
        { key: 'id', label: 'Job', render: (row) => <span className="font-mono text-xs">{row.id}</span> },
        { key: 'status', label: 'Статус', render: (row) => <StatusBadge value={row.status} /> },
        { key: 'user', label: 'Пользователь', render: (row) => <span className="font-bold">{row.user.email}</span> },
        { key: 'venue', label: 'Заведение', render: (row) => row.venue ? <Link className="font-bold text-brand-purple hover:underline" to={`/venues/${row.venue.id}`}>{row.venue.name}</Link> : '—' },
        { key: 'counts', label: 'Результат', render: (row) => `${row.categoryCount || 0} кат. / ${row.itemCount || 0} поз.` },
        { key: 'usedFallback', label: 'Fallback', render: (row) => row.usedFallback ? 'Да' : 'Нет' },
        { key: 'createdAt', label: 'Создан', render: (row) => formatDateTime(row.createdAt) },
      ]} />
    </>
  );
};

export default ImportsPage;
