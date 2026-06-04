import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusBadge } from '../components/admin/StatusBadge';
import { Button } from '../components/ui/Button';
import { fetchMenus, createAdminMenu, fetchVenues } from '../lib/adminApi';
import { formatDateTime } from '../lib/formatters';

const MenusPage = () => {
  const [data, setData] = useState({ items: [] });
  const [venues, setVenues] = useState([]);
  const [error, setError] = useState('');

  // Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [venueId, setVenueId] = useState('');
  const [status, setStatus] = useState('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMenus = () => {
    fetchMenus().then(setData).catch((nextError) => setError(nextError.message));
  };

  useEffect(() => {
    loadMenus();
    // Load venues list for Parent Venue select dropdown
    fetchVenues()
      .then((venuesData) => {
        setVenues(venuesData.items || []);
      })
      .catch(() => {});
  }, []);

  const handleCreateMenu = async (e) => {
    e.preventDefault();
    if (!name.trim() || !venueId) return;

    setIsSubmitting(true);
    setError('');
    try {
      await createAdminMenu({
        name: name.trim(),
        venueId,
        status,
      });
      setShowCreateModal(false);
      setName('');
      setVenueId('');
      setStatus('draft');
      loadMenus();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader 
        title="Меню" 
        description="Все меню платформы, статусы и размер payload." 
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Добавить меню
          </Button>
        }
      />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      <DataTable rows={data.items} columns={[
        { key: 'name', label: 'Меню', render: (row) => <Link className="font-black text-brand-purple hover:underline" to={`/menus/${row.id}/edit`}>{row.name}<span className="block text-xs text-muted-foreground">{row.owner.email}</span></Link> },
        { key: 'status', label: 'Статус', render: (row) => <StatusBadge value={row.status} /> },
        { key: 'venue', label: 'Заведение', render: (row) => <Link className="font-bold text-brand-purple hover:underline" to={`/venues/${row.venue.id}`}>{row.venue.name}</Link> },
        { key: 'categoriesCount', label: 'Категории' },
        { key: 'itemsCount', label: 'Позиции' },
        { key: 'updatedAt', label: 'Обновлено', render: (row) => formatDateTime(row.updatedAt) },
      ]} />

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-lg font-black text-foreground mb-4">Добавить меню</h3>
            <form onSubmit={handleCreateMenu} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">Название меню</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Основное меню"
                  className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">Заведение</label>
                <select
                  required
                  value={venueId}
                  onChange={(e) => setVenueId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                >
                  <option value="" disabled>Выберите заведение</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name} ({venue.owner.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">Статус</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                >
                  <option value="draft">Черновик (draft)</option>
                  <option value="active">Активно (active)</option>
                  <option value="published">Опубликовано (published)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isSubmitting || !name || !venueId}>
                  {isSubmitting ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default MenusPage;
