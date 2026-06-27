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
        {
          key: 'sources',
          label: 'Файлы',
          render: (row) => {
            const sources = row.sources || [];
            if (!sources.length) return '—';

            return (
              <div className="flex flex-col gap-1">
                {sources.slice(0, 3).map((source) => source.publicUrl ? (
                  <a
                    key={source.id || source.name}
                    href={source.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="max-w-[220px] truncate text-xs font-bold text-brand-purple hover:underline"
                    title={source.name}
                  >
                    {source.name}
                  </a>
                ) : (
                  <span key={source.id || source.name} className="max-w-[220px] truncate text-xs text-muted-foreground" title={source.name}>
                    {source.name}
                  </span>
                ))}
                {sources.length > 3 ? <span className="text-[11px] text-muted-foreground">+{sources.length - 3}</span> : null}
              </div>
            );
          },
        },
        { key: 'usedFallback', label: 'Fallback', render: (row) => row.usedFallback ? 'Да' : 'Нет' },
        { key: 'createdAt', label: 'Создан', render: (row) => formatDateTime(row.createdAt) },
      ]} />
    </>
  );
};

export default ImportsPage;
