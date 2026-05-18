import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusBadge } from '../components/admin/StatusBadge';
import { fetchUserDetail } from '../lib/adminApi';
import { formatDateTime } from '../lib/formatters';

const UserDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserDetail(id).then(setData).catch((nextError) => setError(nextError.message));
  }, [id]);

  const user = data?.user;

  return (
    <>
      <PageHeader title={user?.name || 'Пользователь'} description={user ? `${user.email} · создан ${formatDateTime(user.createdAt)}` : 'Загрузка...'} />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      {user ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <h2 className="text-lg font-black">Профиль</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div><p className="text-muted-foreground">Email</p><p className="font-bold">{user.email}</p></div>
              <div><p className="text-muted-foreground">Телефон</p><p className="font-bold">{user.phone || '—'}</p></div>
              <div><p className="text-muted-foreground">Статус</p><StatusBadge value={user.isActive ? 'active' : 'inactive'} /></div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <DataTable rows={data.venues} columns={[
              { key: 'name', label: 'Заведение', render: (row) => <Link className="font-black text-brand-purple hover:underline" to={`/venues/${row.id}`}>{row.name}</Link> },
              { key: 'city', label: 'Город', render: (row) => row.city || '—' },
              { key: 'country', label: 'Страна', render: (row) => row.country || '—' },
              { key: 'createdAt', label: 'Создано', render: (row) => formatDateTime(row.createdAt) },
            ]} />
            <DataTable rows={data.imports} columns={[
              { key: 'id', label: 'Импорт' },
              { key: 'status', label: 'Статус', render: (row) => <StatusBadge value={row.status} /> },
              { key: 'menuSource', label: 'Источник' },
              { key: 'createdAt', label: 'Создан', render: (row) => formatDateTime(row.createdAt) },
            ]} />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default UserDetailPage;
