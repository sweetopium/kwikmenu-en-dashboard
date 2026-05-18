import { useEffect, useState } from 'react';
import { DatabaseZap, ShieldCheck, TriangleAlert } from 'lucide-react';
import { PageHeader } from '../components/admin/PageHeader';
import { StatCard } from '../components/admin/StatCard';
import { StatusBadge } from '../components/admin/StatusBadge';
import { fetchSystemHealth } from '../lib/adminApi';
import { formatDateTime } from '../lib/formatters';

const SystemPage = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSystemHealth().then(setData).catch((nextError) => setError(nextError.message));
  }, []);

  return (
    <>
      <PageHeader title="Система" description="Состояние backend, admin access и операционные ошибки." />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Ошибки импортов" value={data?.failedImports} icon={TriangleAlert} accent="bg-red-50 text-red-600" />
        <StatCard label="Ошибки Telegram" value={data?.telegramFailures} icon={TriangleAlert} accent="bg-amber-50 text-amber-600" />
        <StatCard label="DB check" value={data?.status === 'ok' ? 1 : 0} icon={DatabaseZap} />
      </div>
      {data ? (
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><ShieldCheck size={18} /> Admin access</h2>
          <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-muted-foreground">Статус</p><StatusBadge value={data.status} /></div>
            <div><p className="text-muted-foreground">Окружение</p><p className="font-black">{data.appEnv}</p></div>
            <div><p className="text-muted-foreground">Ключ настроен</p><p className="font-black">{data.adminKeyConfigured ? 'Да' : 'Нет'}</p></div>
            <div><p className="text-muted-foreground">IP allowlist</p><p className="font-black">{data.adminAllowedIps}</p></div>
            <div><p className="text-muted-foreground">Проверено</p><p className="font-black">{formatDateTime(data.checkedAt)}</p></div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default SystemPage;
