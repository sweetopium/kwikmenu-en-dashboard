import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusBadge } from '../components/admin/StatusBadge';
import { Button } from '../components/ui/Button';
import { deleteUser, fetchUserDetail, fetchBillingPlans, updateUserSubscription } from '../lib/adminApi';
import { formatDateTime } from '../lib/formatters';

const formatDatetimeForInput = (isoString) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch (e) {
    return '';
  }
};

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  
  // Subscription Form State
  const [planId, setPlanId] = useState('');
  const [status, setStatus] = useState('');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState('');
  const [trialEndsAt, setTrialEndsAt] = useState('');
  const [isSavingSub, setIsSavingSub] = useState(false);
  const [subSuccess, setSubSuccess] = useState('');

  useEffect(() => {
    fetchUserDetail(id).then(setData).catch((nextError) => setError(nextError.message));
    fetchBillingPlans().then(setPlans).catch(() => {});
  }, [id]);

  const user = data?.user;

  useEffect(() => {
    if (user?.subscription) {
      const sub = user.subscription;
      setPlanId(sub.planId || '');
      setStatus(sub.status || '');
      setCurrentPeriodEnd(formatDatetimeForInput(sub.currentPeriodEnd));
      setTrialEndsAt(formatDatetimeForInput(sub.trialEndsAt));
    }
  }, [user]);

  const handleDelete = async () => {
    if (!user) {
      return;
    }
    const confirmed = window.confirm(`Удалить пользователя ${user.email}? Будут удалены его сессии, заведения и меню.`);
    if (!confirmed) {
      return;
    }
    try {
      await deleteUser(user.id);
      navigate('/users');
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  const handleSaveSubscription = async () => {
    setIsSavingSub(true);
    setError('');
    setSubSuccess('');
    try {
      const payload = {
        planId,
        status,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd).toISOString() : null,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
      };
      const updated = await updateUserSubscription(user.id, payload);
      setData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          subscription: updated
        }
      }));
      setSubSuccess('Подписка успешно сохранена!');
      setTimeout(() => setSubSuccess(''), 3000);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSavingSub(false);
    }
  };

  return (
    <>
      <PageHeader
        title={user?.name || 'Пользователь'}
        description={user ? `${user.email} · создан ${formatDateTime(user.createdAt)}` : 'Загрузка...'}
        actions={user ? <Button variant="destructive" onClick={handleDelete}><Trash2 size={16} />Удалить пользователя</Button> : null}
      />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      {user ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <h2 className="text-lg font-black">Профиль</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div><p className="text-muted-foreground">Email</p><p className="font-bold">{user.email}</p></div>
                <div><p className="text-muted-foreground">Телефон</p><p className="font-bold">{user.phone || '—'}</p></div>
                <div><p className="text-muted-foreground">Статус</p><StatusBadge value={user.isActive ? 'active' : 'inactive'} /></div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-black">Подписка и тариф</h2>
                {user.subscription && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Текущий: <span className="font-semibold text-foreground">{user.subscription.planName}</span> ({user.subscription.planCode}) · <span className="font-semibold text-foreground">{user.subscription.status}</span>
                  </p>
                )}
              </div>
              
              {subSuccess ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                  {subSuccess}
                </div>
              ) : null}

              <div className="space-y-3 text-sm">
                <label className="block text-sm font-semibold">
                  Тарифный план
                  <select
                    className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm outline-none"
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                  >
                    <option value="" disabled>Выберите тариф</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-semibold">
                  Статус подписки
                  <select
                    className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm outline-none"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="trialing">Триал (trialing)</option>
                    <option value="active">Активна (active)</option>
                    <option value="past_due">Просрочена (past_due)</option>
                    <option value="canceled">Отменена (canceled)</option>
                    <option value="unpaid">Не оплачена (unpaid)</option>
                  </select>
                </label>

                <label className="block text-sm font-semibold">
                  Окончание тарифа
                  <input
                    className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm outline-none"
                    type="datetime-local"
                    value={currentPeriodEnd}
                    onChange={(e) => setCurrentPeriodEnd(e.target.value)}
                  />
                </label>

                <label className="block text-sm font-semibold">
                  Окончание триала
                  <input
                    className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm outline-none"
                    type="datetime-local"
                    value={trialEndsAt}
                    onChange={(e) => setTrialEndsAt(e.target.value)}
                  />
                </label>
                
                <Button 
                  className="w-full mt-2" 
                  onClick={handleSaveSubscription} 
                  disabled={isSavingSub || !planId}
                >
                  {isSavingSub ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <DataTable rows={data.venues} columns={[
              { key: 'name', label: 'Заведение', render: (row) => <Link className="font-black text-brand-purple hover:underline" to={`/venues/${row.id}`}>{row.name}</Link> },
              { key: 'city', label: 'Город', render: (row) => row.city || '—' },
              { key: 'country', label: 'Страна', render: (row) => row.country || '—' },
              { key: 'createdAt', label: 'Создано', render: (row) => formatDateTime(row.createdAt) },
            ]} />
            <DataTable rows={data.imports} columns={[
              { key: 'id', label: 'Импорт' },
              { key: 'status', label: 'Статус', render: (row) => <StatusBadge value={row.status} /> },
              { key: 'menuSource', label: 'Источник' },
              { key: 'createdAt', label: 'Создан', render: (row) => formatDateTime(row.createdAt) },
            ]} />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default UserDetailPage;
