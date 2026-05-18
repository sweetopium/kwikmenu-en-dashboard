import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { fetchUsers } from '../lib/adminApi';
import { formatDateTime } from '../lib/formatters';

const UsersPage = () => {
  const [data, setData] = useState({ items: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers().then(setData).catch((nextError) => setError(nextError.message));
  }, []);

  return (
    <>
      <PageHeader title="Пользователи" description="Владельцы аккаунтов, провайдеры входа и последняя активность." />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      <DataTable
        rows={data.items}
        columns={[
          { key: 'name', label: 'Пользователь', render: (row) => <Link className="font-black text-brand-purple hover:underline" to={`/users/${row.id}`}>{row.name}<span className="block text-xs font-semibold text-muted-foreground">{row.email}</span></Link> },
          { key: 'phone', label: 'Телефон', render: (row) => row.phone || '—' },
          { key: 'venuesCount', label: 'Заведений' },
          { key: 'authProviders', label: 'Вход', render: (row) => row.authProviders.join(', ') || '—' },
          { key: 'lastSeenAt', label: 'Последняя активность', render: (row) => formatDateTime(row.lastSeenAt) },
          { key: 'createdAt', label: 'Создан', render: (row) => formatDateTime(row.createdAt) },
        ]}
      />
    </>
  );
};

export default UsersPage;
