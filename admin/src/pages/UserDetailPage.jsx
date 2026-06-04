import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Trash2, KeyRound, CheckCircle, RefreshCw } from 'lucide-react';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusBadge } from '../components/admin/StatusBadge';
import { Button } from '../components/ui/Button';
import {
  deleteUser,
  fetchUserDetail,
  fetchBillingPlans,
  updateUserSubscription,
  impersonateVirtualClient,
  resetVirtualClient,
  activateVirtualClient,
  createAdminVenue,
} from '../lib/adminApi';
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

  // Virtual Client States
  const [isResetting, setIsResetting] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activateEmail, setActivateEmail] = useState('');
  const [activatePassword, setActivatePassword] = useState('');
  const [activateName, setActivateName] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  // Create Venue State
  const [showCreateVenueModal, setShowCreateVenueModal] = useState(false);
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueCity, setNewVenueCity] = useState('Москва');
  const [newVenueCountry, setNewVenueCountry] = useState('Россия');
  const [newVenueCurrency, setNewVenueCurrency] = useState('RUB');
  const [isCreatingVenue, setIsCreatingVenue] = useState(false);

  useEffect(() => {
    fetchUserDetail(id).then(setData).catch((nextError) => setError(nextError.message));
    fetchBillingPlans().then(setPlans).catch(() => {});
  }, [id]);

  const user = data?.user;
  const isVirtual = user?.email?.endsWith('@virtual.kwikmenu.ru');

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

  const getClientDashboardUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5173/dashboard';
    }
    return 'https://kwik.blockranker.co/dashboard';
  };

  const handleImpersonate = async () => {
    setError('');
    try {
      const res = await impersonateVirtualClient(id);
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

  const handleResetSlot = async () => {
    const confirmed = window.confirm(
      'Вы уверены, что хотите сбросить этот слот? Все меню, импорты и настройки заведения будут удалены, а его данные будут сброшены до базовых. Сам слот останется активным.'
    );
    if (!confirmed) return;

    setIsResetting(true);
    setError('');
    try {
      await resetVirtualClient(id);
      const refreshed = await fetchUserDetail(id);
      setData(refreshed);
      alert('Слот успешно очищен и сброшен!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleActivateSubmit = async (e) => {
    e.preventDefault();
    if (!activateEmail || !activatePassword) return;

    setIsActivating(true);
    setError('');
    try {
      await activateVirtualClient(id, {
        email: activateEmail,
        password: activatePassword,
        name: activateName || undefined,
      });
      setShowActivateModal(false);
      setActivateEmail('');
      setActivatePassword('');
      setActivateName('');
      const refreshed = await fetchUserDetail(id);
      setData(refreshed);
      alert('Клиент успешно активирован!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsActivating(false);
    }
  };

  const handleCreateVenueSubmit = async (e) => {
    e.preventDefault();
    if (!newVenueName.trim()) return;

    setIsCreatingVenue(true);
    setError('');
    try {
      await createAdminVenue({
        name: newVenueName.trim(),
        ownerUserId: id,
        city: newVenueCity.trim() || null,
        country: newVenueCountry.trim() || null,
        currency: newVenueCurrency,
      });
      setShowCreateVenueModal(false);
      setNewVenueName('');
      setNewVenueCity('Москва');
      setNewVenueCountry('Россия');
      setNewVenueCurrency('RUB');
      const refreshed = await fetchUserDetail(id);
      setData(refreshed);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreatingVenue(false);
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
              <h2 className="text-lg font-black flex items-center justify-between">
                Профиль
                {isVirtual && (
                  <span className="rounded-md bg-purple-50 dark:bg-purple-950/30 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">
                    Виртуальный
                  </span>
                )}
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                <div><p className="text-muted-foreground">Email</p><p className="font-bold">{user.email}</p></div>
                <div><p className="text-muted-foreground">Телефон</p><p className="font-bold">{user.phone || '—'}</p></div>
                <div><p className="text-muted-foreground">Статус</p><StatusBadge value={user.isActive ? 'active' : 'inactive'} /></div>
              </div>

              {isVirtual && (
                <div className="mt-5 pt-4 border-t border-border/70 space-y-2">
                  <Button variant="outline" className="w-full flex items-center justify-center gap-1.5" onClick={handleImpersonate}>
                    <KeyRound size={14} />
                    Войти в кабинет (Impersonate)
                  </Button>
                  <Button variant="outline" className="w-full flex items-center justify-center gap-1.5" onClick={() => setShowActivateModal(true)}>
                    <CheckCircle size={14} />
                    Активировать клиента
                  </Button>
                  <Button variant="ghost" className="w-full flex items-center justify-center gap-1.5 text-zinc-500 hover:text-red-600" onClick={handleResetSlot} disabled={isResetting}>
                    <RefreshCw size={14} className={isResetting ? 'animate-spin' : ''} />
                    Сбросить заведение и меню
                  </Button>
                </div>
              )}
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
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-foreground">Заведения</h3>
                <Button size="sm" onClick={() => setShowCreateVenueModal(true)}>
                  Добавить заведение
                </Button>
              </div>
              <DataTable rows={data.venues} columns={[
                { key: 'name', label: 'Заведение', render: (row) => <Link className="font-black text-brand-purple hover:underline" to={`/venues/${row.id}`}>{row.name}</Link> },
                { key: 'city', label: 'Город', render: (row) => row.city || '—' },
                { key: 'country', label: 'Страна', render: (row) => row.country || '—' },
                { key: 'createdAt', label: 'Создано', render: (row) => formatDateTime(row.createdAt) },
              ]} />
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-black text-foreground">Импорты</h3>
              <DataTable rows={data.imports} columns={[
                { key: 'id', label: 'Импорт' },
                { key: 'status', label: 'Статус', render: (row) => <StatusBadge value={row.status} /> },
                { key: 'menuSource', label: 'Источник' },
                { key: 'createdAt', label: 'Создан', render: (row) => formatDateTime(row.createdAt) },
              ]} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Create Venue Modal */}
      {showCreateVenueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-lg font-black text-foreground mb-4">Создать заведение</h3>
            <form onSubmit={handleCreateVenueSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">Название заведения</label>
                <input
                  type="text"
                  required
                  value={newVenueName}
                  onChange={(e) => setNewVenueName(e.target.value)}
                  placeholder="Кафе Ромашка"
                  className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">Город</label>
                  <input
                    type="text"
                    value={newVenueCity}
                    onChange={(e) => setNewVenueCity(e.target.value)}
                    placeholder="Москва"
                    className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">Страна</label>
                  <input
                    type="text"
                    value={newVenueCountry}
                    onChange={(e) => setNewVenueCountry(e.target.value)}
                    placeholder="Россия"
                    className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">Валюта</label>
                <select
                  value={newVenueCurrency}
                  onChange={(e) => setNewVenueCurrency(e.target.value)}
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
                <Button type="button" variant="ghost" onClick={() => setShowCreateVenueModal(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isCreatingVenue || !newVenueName}>
                  {isCreatingVenue ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activation Modal */}
      {showActivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-lg font-black text-foreground mb-4">Активировать клиента</h3>
            <form onSubmit={handleActivateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Реальный Email клиента</label>
                <input
                  type="email"
                  required
                  value={activateEmail}
                  onChange={(e) => setActivateEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Новый Пароль</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={activatePassword}
                  onChange={(e) => setActivatePassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Имя / Название (Необязательно)</label>
                <input
                  type="text"
                  value={activateName}
                  onChange={(e) => setActivateName(e.target.value)}
                  placeholder="Иван Петров"
                  className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <Button type="button" variant="ghost" onClick={() => setShowActivateModal(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isActivating || !activateEmail || !activatePassword}>
                  {isActivating ? 'Активация...' : 'Активировать'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UserDetailPage;
