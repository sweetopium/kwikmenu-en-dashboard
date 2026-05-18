import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusBadge } from '../components/admin/StatusBadge';
import { fetchMenus } from '../lib/adminApi';
import { formatDateTime } from '../lib/formatters';

const MenusPage = () => {
  const [data, setData] = useState({ items: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMenus().then(setData).catch((nextError) => setError(nextError.message));
  }, []);

  return (
    <>
      <PageHeader title="Меню" description="Все меню платформы, статусы и размер payload." />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      <DataTable rows={data.items} columns={[
        { key: 'name', label: 'Меню', render: (row) => <span className="font-black">{row.name}<span className="block text-xs text-muted-foreground">{row.owner.email}</span></span> },
        { key: 'status', label: 'Статус', render: (row) => <StatusBadge value={row.status} /> },
        { key: 'venue', label: 'Заведение', render: (row) => <Link className="font-bold text-brand-purple hover:underline" to={`/venues/${row.venue.id}`}>{row.venue.name}</Link> },
        { key: 'categoriesCount', label: 'Категории' },
        { key: 'itemsCount', label: 'Позиции' },
        { key: 'updatedAt', label: 'Обновлено', render: (row) => formatDateTime(row.updatedAt) },
      ]} />
    </>
  );
};

export default MenusPage;
