import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { Button } from '../components/ui/Button';
import { fetchVenues, createAdminVenue, fetchUsers } from '../lib/adminApi';
import { formatDateTime, formatNumber } from '../lib/formatters';

const VenuesPage = () => {
  const [data, setData] = useState({ items: [] });
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  // Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [ownerUserId, setOwnerUserId] = useState('');
  const [city, setCity] = useState('Москва');
  const [country, setCountry] = useState('Россия');
  const [currency, setCurrency] = useState('RUB');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadVenues = () => {
    fetchVenues().then(setData).catch((nextError) => setError(nextError.message));
  };

  useEffect(() => {
    loadVenues();
    // Load users list for Owner select dropdown
    fetchUsers()
      .then((usersData) => {
        setUsers(usersData.items || []);
      })
      .catch(() => {});
  }, []);

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    if (!name.trim() || !ownerUserId) return;

    setIsSubmitting(true);
    setError('');
    try {
      await createAdminVenue({
        name: name.trim(),
        ownerUserId,
        city: city.trim() || null,
        country: country.trim() || null,
        currency,
      });
      setShowCreateModal(false);
      setName('');
      setOwnerUserId('');
      setCity('Москва');
      setCountry('Россия');
      setCurrency('RUB');
      loadVenues();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader 
        title="Заведения" 
        description="Все рестораны и их публичная активность." 
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Добавить заведение
          </Button>
        }
      />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      <DataTable rows={data.items} columns={[
        { key: 'name', label: 'Заведение', render: (row) => <Link className="font-black text-brand-purple hover:underline" to={`/venues/${row.id}`}>{row.name}</Link> },
        { key: 'owner', label: 'Владелец', render: (row) => <span>{row.owner.name}<span className="block text-xs text-muted-foreground">{row.owner.email}</span></span> },
        { key: 'city', label: 'Локация', render: (row) => [row.city, row.country].filter(Boolean).join(', ') || '—' },
        { key: 'menusCount', label: 'Меню' },
        { key: 'publicViews', label: 'Просмотры', render: (row) => formatNumber(row.publicViews) },
        { key: 'createdAt', label: 'Создано', render: (row) => formatDateTime(row.createdAt) },
      ]} />

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-lg font-black text-foreground mb-4">Добавить заведение</h3>
            <form onSubmit={handleCreateVenue} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">Название заведения</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ресторан Ромашка"
                  className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">Владелец</label>
                <select
                  required
                  value={ownerUserId}
                  onChange={(e) => setOwnerUserId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                >
                  <option value="" disabled>Выберите владельца</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">Город</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Москва"
                    className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">Страна</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Россия"
                    className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">Валюта</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                >
                  <option value="RUB">RUB (₽)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="AED">AED (Dh)</option>
                  <option value="KZT">KZT (₸)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isSubmitting || !name || !ownerUserId}>
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

export default VenuesPage;
