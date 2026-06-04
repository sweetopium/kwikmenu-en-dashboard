import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusBadge } from '../components/admin/StatusBadge';
import { Button } from '../components/ui/Button';
import { fetchVenueDetail, createAdminMenu } from '../lib/adminApi';
import { formatDateTime, formatNumber } from '../lib/formatters';

const VenueDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  // Create Menu State
  const [showCreateMenuModal, setShowCreateMenuModal] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuStatus, setNewMenuStatus] = useState('draft');
  const [isCreatingMenu, setIsCreatingMenu] = useState(false);

  const loadVenueDetail = () => {
    fetchVenueDetail(id).then(setData).catch((nextError) => setError(nextError.message));
  };

  useEffect(() => {
    loadVenueDetail();
  }, [id]);

  const venue = data?.venue;

  const handleCreateMenuSubmit = async (e) => {
    e.preventDefault();
    if (!newMenuName.trim()) return;

    setIsCreatingMenu(true);
    setError('');
    try {
      await createAdminMenu({
        name: newMenuName.trim(),
        venueId: id,
        status: newMenuStatus,
      });
      setShowCreateMenuModal(false);
      setNewMenuName('');
      setNewMenuStatus('draft');
      loadVenueDetail();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreatingMenu(false);
    }
  };

  return (
    <>
      <PageHeader title={venue?.name || 'Заведение'} description={venue ? `${data.owner.email} · ${venue.publicPath}` : 'Загрузка...'} />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      {venue ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><p className="text-xs font-bold uppercase text-muted-foreground">Просмотры</p><p className="mt-2 text-3xl font-black">{formatNumber(venue.publicViews)}</p></div>
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><p className="text-xs font-bold uppercase text-muted-foreground">Валюта</p><p className="mt-2 text-3xl font-black">{data.settings.currency}</p></div>
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><p className="text-xs font-bold uppercase text-muted-foreground">Публичное меню</p><div className="mt-3"><StatusBadge value={data.settings.publicMenuEnabled ? 'active' : 'disabled'} /></div></div>
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><p className="text-xs font-bold uppercase text-muted-foreground">Город</p><p className="mt-2 text-xl font-black">{venue.city || '—'}</p></div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">Меню</h3>
              <Button size="sm" onClick={() => setShowCreateMenuModal(true)}>
                <Plus size={16} />
                Добавить меню
              </Button>
            </div>
            <DataTable rows={data.menus} columns={[
              { key: 'name', label: 'Меню', render: (row) => <Link className="font-black text-brand-purple hover:underline" to={`/menus/${row.id}/edit`}>{row.name}</Link> },
              { key: 'status', label: 'Статус', render: (row) => <StatusBadge value={row.status} /> },
              { key: 'categoriesCount', label: 'Категории' },
              { key: 'itemsCount', label: 'Позиции' },
              { key: 'updatedAt', label: 'Обновлено', render: (row) => formatDateTime(row.updatedAt) },
            ]} />
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-black text-foreground">История импортов</h3>
            <DataTable rows={data.imports} columns={[
              { key: 'id', label: 'Импорт' },
              { key: 'status', label: 'Статус', render: (row) => <StatusBadge value={row.status} /> },
              { key: 'menuSource', label: 'Источник' },
              { key: 'error', label: 'Ошибка', render: (row) => row.error || '—' },
              { key: 'createdAt', label: 'Создан', render: (row) => formatDateTime(row.createdAt) },
            ]} />
          </div>
        </div>
      ) : null}

      {/* Create Menu Modal */}
      {showCreateMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-lg font-black text-foreground mb-4">Создать меню</h3>
            <form onSubmit={handleCreateMenuSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">Название меню</label>
                <input
                  type="text"
                  required
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  placeholder="Основное меню"
                  className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">Статус</label>
                <select
                  value={newMenuStatus}
                  onChange={(e) => setNewMenuStatus(e.target.value)}
                  className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                >
                  <option value="draft">Черновик (draft)</option>
                  <option value="active">Активно (active)</option>
                  <option value="published">Опубликовано (published)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <Button type="button" variant="ghost" onClick={() => setShowCreateMenuModal(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isCreatingMenu || !newMenuName}>
                  {isCreatingMenu ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default VenueDetailPage;
