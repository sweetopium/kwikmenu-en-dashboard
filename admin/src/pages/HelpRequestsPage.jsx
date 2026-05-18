import { useEffect, useState } from 'react';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusBadge } from '../components/admin/StatusBadge';
import { fetchHelpRequests } from '../lib/adminApi';
import { formatDateTime } from '../lib/formatters';

const HelpRequestsPage = () => {
  const [data, setData] = useState({ items: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHelpRequests().then(setData).catch((nextError) => setError(nextError.message));
  }, []);

  return (
    <>
      <PageHeader title="Заявки помощи" description="Лиды из onboarding/help, вложения меню и статус Telegram-доставки." />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      <DataTable rows={data.items} columns={[
        { key: 'name', label: 'Контакт', render: (row) => <span className="font-black">{row.name}<span className="block text-xs text-muted-foreground">{row.phone} · {row.messenger}</span></span> },
        { key: 'restaurantName', label: 'Ресторан' },
        { key: 'city', label: 'Город', render: (row) => `${row.city}, ${row.countryName}` },
        { key: 'menuSource', label: 'Меню', render: (row) => row.uploadLater ? 'Позже' : row.menuFileName || row.menuLink || row.menuSource },
        { key: 'telegramDelivered', label: 'Telegram', render: (row) => <StatusBadge value={row.telegramDelivered ? 'delivered' : 'failed'} /> },
        { key: 'createdAt', label: 'Создана', render: (row) => formatDateTime(row.createdAt) },
      ]} />
    </>
  );
};

export default HelpRequestsPage;
