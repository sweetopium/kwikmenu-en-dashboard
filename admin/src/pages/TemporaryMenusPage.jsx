import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusBadge } from '../components/admin/StatusBadge';
import { fetchTemporaryMenus } from '../lib/adminApi';
import { formatDateTime } from '../lib/formatters';

const TemporaryMenusPage = () => {
  const [data, setData] = useState({ items: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTemporaryMenus().then(setData).catch((nextError) => setError(nextError.message));
  }, []);

  return (
    <>
      <PageHeader title="Временные меню" description="Демо-распознавания из /magic и публичные временные ссылки /tmp/:id." />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      <DataTable rows={data.items} columns={[
        { key: 'id', label: 'ID', render: (row) => <span className="font-mono text-xs">{row.id}</span> },
        { key: 'status', label: 'Статус', render: (row) => <StatusBadge value={row.status} /> },
        {
          key: 'venue',
          label: 'Заведение',
          render: (row) => (
            <div>
              <p className="font-bold text-foreground">{row.restaurantName || 'Demo venue'}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{[row.city, row.country].filter(Boolean).join(', ') || '—'}</p>
            </div>
          ),
        },
        { key: 'contactPhone', label: 'Телефон', render: (row) => row.contactPhone || '—' },
        { key: 'currency', label: 'Валюта', render: (row) => row.currency || '—' },
        { key: 'counts', label: 'Результат', render: (row) => `${row.categoryCount || 0} кат. / ${row.itemCount || 0} поз.` },
        {
          key: 'publicPath',
          label: 'Ссылка',
          render: (row) => row.status === 'completed' ? (
            <a href={row.publicPath} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-brand-purple hover:underline">
              {row.publicPath}
              <ExternalLink size={13} />
            </a>
          ) : '—',
        },
        {
          key: 'sources',
          label: 'Файлы',
          render: (row) => {
            const sources = row.sources || [];
            if (!sources.length) return '—';

            return (
              <div className="flex flex-col gap-1">
                {sources.slice(0, 4).map((source) => {
                  const label = `${source.isGenerated ? 'PDF: ' : ''}${source.name}`;
                  return source.publicUrl ? (
                    <a
                      key={source.id || source.name}
                      href={source.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="max-w-[220px] truncate text-xs font-bold text-brand-purple hover:underline"
                      title={label}
                    >
                      {label}
                    </a>
                  ) : (
                    <span key={source.id || source.name} className="max-w-[220px] truncate text-xs text-muted-foreground" title={label}>
                      {label}
                    </span>
                  );
                })}
                {sources.length > 4 ? <span className="text-[11px] text-muted-foreground">+{sources.length - 4}</span> : null}
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

export default TemporaryMenusPage;
