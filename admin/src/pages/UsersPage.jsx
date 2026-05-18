import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { Button } from '../components/ui/Button';
import { bulkDeleteUsers, deleteUser, fetchUsers } from '../lib/adminApi';
import { formatDateTime } from '../lib/formatters';

const UsersPage = () => {
  const [data, setData] = useState({ items: [] });
  const [error, setError] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

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

  return (
    <>
      <PageHeader
        title="Пользователи"
        description="Владельцы аккаунтов, провайдеры входа и последняя активность."
        actions={selectedUserIds.length ? (
          <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeleting}>
            <Trash2 size={16} />
            Удалить выбранных: {selectedUserIds.length}
          </Button>
        ) : null}
      />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      <DataTable
        rows={data.items}
        columns={[
          { key: 'select', label: <input type="checkbox" checked={isAllSelected} onChange={toggleAll} className="h-4 w-4 accent-brand-purple" />, render: (row) => <input type="checkbox" checked={selectedUserIds.includes(row.id)} onChange={() => toggleUser(row.id)} className="h-4 w-4 accent-brand-purple" /> },
          { key: 'name', label: 'Пользователь', render: (row) => <Link className="font-black text-brand-purple hover:underline" to={`/users/${row.id}`}>{row.name}<span className="block text-xs font-semibold text-muted-foreground">{row.email}</span></Link> },
          { key: 'phone', label: 'Телефон', render: (row) => row.phone || '—' },
          { key: 'venuesCount', label: 'Заведений' },
          { key: 'authProviders', label: 'Вход', render: (row) => row.authProviders.join(', ') || '—' },
          { key: 'lastSeenAt', label: 'Последняя активность', render: (row) => formatDateTime(row.lastSeenAt) },
          { key: 'createdAt', label: 'Создан', render: (row) => formatDateTime(row.createdAt) },
          { key: 'actions', label: '', render: (row) => <Button variant="ghost" size="sm" onClick={() => handleDeleteOne(row)} disabled={isDeleting}><Trash2 size={14} />Удалить</Button> },
        ]}
      />
    </>
  );
};

export default UsersPage;
