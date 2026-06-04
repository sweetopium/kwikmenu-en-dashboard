import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, UserPlus, KeyRound, CheckCircle, RefreshCw } from 'lucide-react';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { Button } from '../components/ui/Button';
import {
  bulkDeleteUsers,
  deleteUser,
  fetchUsers,
  createVirtualClient,
  impersonateVirtualClient,
} from '../lib/adminApi';
import { formatDateTime } from '../lib/formatters';

const UsersPage = () => {
  const [data, setData] = useState({ items: [] });
  const [error, setError] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // States for virtual client creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [virtualId, setVirtualId] = useState('');
  const [virtualName, setVirtualName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = () => {
    fetchUsers().then(setData).catch((nextError) => setError(nextError.message));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const isAllSelected = data.items.length > 0 && selectedUserIds.length === data.items.length;

  const toggleUser = (userId) => {
    setSelectedUserIds((current) => (
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    ));
  };

  const toggleAll = () => {
    setSelectedUserIds(isAllSelected ? [] : data.items.map((item) => item.id));
  };

  const handleBulkDelete = async () => {
    if (!selectedUserIds.length) {
      return;
    }
    const confirmed = window.confirm(`Удалить пользователей: ${selectedUserIds.length}? Будут удалены их сессии, заведения, меню и публичная аналитика заведений.`);
    if (!confirmed) {
      return;
    }
    setIsDeleting(true);
    setError('');
    try {
      await bulkDeleteUsers(selectedUserIds);
      setSelectedUserIds([]);
      loadUsers();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteOne = async (user) => {
    const confirmed = window.confirm(`Удалить пользователя ${user.email}? Будут удалены его сессии, заведения и меню.`);
    if (!confirmed) {
      return;
    }
    setIsDeleting(true);
    setError('');
    try {
      await deleteUser(user.id);
      setSelectedUserIds((current) => current.filter((id) => id !== user.id));
      loadUsers();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const generateRandomUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleCreateVirtual = async (e) => {
    e.preventDefault();
    if (!virtualId.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      await createVirtualClient({
        id: virtualId.trim().toLowerCase(),
        name: virtualName.trim() || 'Виртуальный клиент',
      });
      setShowCreateModal(false);
      setVirtualId('');
      setVirtualName('');
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClientDashboardUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5173/dashboard';
    }
    return 'https://kwik.blockranker.co/dashboard';
  };

  const handleImpersonate = async (userId) => {
    setError('');
    try {
      const res = await impersonateVirtualClient(userId);
      if (res && res.magicUrl) {
        window.open(res.magicUrl, '_blank');
      } else {
        const dashboardUrl = getClientDashboardUrl();
        window.open(dashboardUrl, '_blank');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Пользователи"
        description="Владельцы аккаунтов, провайдеры входа и последняя активность."
        actions={
          <div className="flex gap-2">
            {selectedUserIds.length ? (
              <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeleting}>
                <Trash2 size={16} />
                Удалить выбранных: {selectedUserIds.length}
              </Button>
            ) : null}
            <Button onClick={() => {
              setVirtualId(generateRandomUuid());
              setShowCreateModal(true);
            }}>
              <UserPlus size={16} />
              Создать виртуального клиента
            </Button>
          </div>
        }
      />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      
      <DataTable
        rows={data.items}
        columns={[
          { key: 'select', label: <input type="checkbox" checked={isAllSelected} onChange={toggleAll} className="h-4 w-4 accent-brand-purple" />, render: (row) => <input type="checkbox" checked={selectedUserIds.includes(row.id)} onChange={() => toggleUser(row.id)} className="h-4 w-4 accent-brand-purple" /> },
          { key: 'name', label: 'Пользователь', render: (row) => {
            const isVirtual = row.email.endsWith('@virtual.kwikmenu.ru');
            return (
              <Link className="font-black text-brand-purple hover:underline" to={`/users/${row.id}`}>
                <span className="flex items-center gap-2">
                  {row.name}
                  {isVirtual && (
                    <span className="rounded-md bg-purple-50 dark:bg-purple-950/30 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">
                      Виртуальный
                    </span>
                  )}
                </span>
                <span className="block text-xs font-semibold text-muted-foreground">{row.email}</span>
              </Link>
            );
          }},
          { key: 'phone', label: 'Телефон', render: (row) => row.phone || '—' },
          { key: 'venuesCount', label: 'Заведений' },
          { key: 'authProviders', label: 'Вход', render: (row) => row.authProviders.join(', ') || '—' },
          { key: 'lastSeenAt', label: 'Последняя активность', render: (row) => formatDateTime(row.lastSeenAt) },
          { key: 'createdAt', label: 'Создан', render: (row) => formatDateTime(row.createdAt) },
          { key: 'actions', label: '', render: (row) => {
            const isVirtual = row.email.endsWith('@virtual.kwikmenu.ru');
            return (
              <div className="flex items-center gap-2">
                {isVirtual && (
                  <Button variant="outline" size="sm" onClick={() => handleImpersonate(row.id)}>
                    <KeyRound size={12} />
                    Войти
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleDeleteOne(row)} disabled={isDeleting}>
                  <Trash2 size={14} />
                  Удалить
                </Button>
              </div>
            );
          }},
        ]}
      />

      {/* Modal for creating a virtual client */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-lg font-black text-foreground mb-4">Создать виртуального клиента</h3>
            <form onSubmit={handleCreateVirtual} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">UUID слота / Наклейки</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={virtualId}
                    onChange={(e) => setVirtualId(e.target.value)}
                    placeholder="c2b5d491-fa89-4e41-949e-b7e127265a08"
                    className="flex-1 px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                  />
                  <Button type="button" variant="outline" onClick={() => setVirtualId(generateRandomUuid())}>
                    Ген.
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Название заведения (для превью)</label>
                <input
                  type="text"
                  value={virtualName}
                  onChange={(e) => setVirtualName(e.target.value)}
                  placeholder="Ромашка"
                  className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isSubmitting || !virtualId}>
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

export default UsersPage;
