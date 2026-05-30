import { useEffect, useState } from 'react';

import { PageHeader } from '../components/admin/PageHeader';
import { Button } from '../components/ui/Button';
import { fetchBillingPlans, fetchBillingSubscriptions, processBillingRenewals, updateBillingPlan } from '../lib/adminApi';
import { formatDateTime } from '../lib/formatters';

const toPlanUpdatePayload = (plan) => ({
  name: plan.name,
  description: plan.description,
  priceAmount: plan.priceAmount,
  currency: plan.currency,
  billingPeriod: plan.billingPeriod,
  isActive: plan.isActive,
  isPublic: plan.isPublic,
  sortOrder: plan.sortOrder,
  maxVenues: plan.maxVenues,
  maxMenusPerVenue: plan.maxMenusPerVenue,
  maxMenuItemsPerMenu: plan.maxMenuItemsPerMenu,
  aiImportsPerMonth: plan.aiImportsPerMonth,
  publicMenuEnabled: plan.publicMenuEnabled,
  translationsEnabled: plan.translationsEnabled,
  maxTranslationLanguages: plan.maxTranslationLanguages,
  analyticsEnabled: plan.analyticsEnabled,
  qrCustomizationEnabled: plan.qrCustomizationEnabled,
  menuDesignCustomizationEnabled: plan.menuDesignCustomizationEnabled,
  maxTemplateTier: plan.maxTemplateTier,
  prioritySupportEnabled: plan.prioritySupportEnabled,
});

const BillingPage = () => {
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState('');
  const [savingPlanId, setSavingPlanId] = useState('');
  const [renewalResult, setRenewalResult] = useState(null);

  const load = () => {
    setError('');
    Promise.all([fetchBillingPlans(), fetchBillingSubscriptions()])
      .then(([planRows, subscriptionRows]) => {
        setPlans(planRows);
        setSubscriptions(subscriptionRows.items || []);
      })
      .catch((nextError) => setError(nextError.message));
  };

  useEffect(() => {
    load();
  }, []);

  const updateDraft = (planId, patch) => {
    setPlans((current) => current.map((plan) => (plan.id === planId ? { ...plan, ...patch } : plan)));
  };

  const handleSave = async (plan) => {
    setSavingPlanId(plan.id);
    setError('');
    try {
      await updateBillingPlan(plan.id, toPlanUpdatePayload(plan));
      load();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSavingPlanId('');
    }
  };

  const handleRenewals = async () => {
    setError('');
    try {
      const result = await processBillingRenewals();
      setRenewalResult(result);
      load();
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Биллинг"
        description="Тарифы в БД, их цены и лимиты, плюс текущие подписки пользователей."
        actions={<Button onClick={handleRenewals}>Запустить продления</Button>}
      />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      {renewalResult ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          Продления: processed {renewalResult.processed}, created {renewalResult.created}, failed {renewalResult.failed}, skipped {renewalResult.skipped}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        {plans.map((plan) => (
          <section key={plan.id} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-black">{plan.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{plan.code}</p>
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-semibold">
                Цена / мес
                <input
                  className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2"
                  type="number"
                  value={plan.priceAmount}
                  onChange={(event) => updateDraft(plan.id, { priceAmount: Number(event.target.value) })}
                />
              </label>
              <label className="text-sm font-semibold">
                Лимит заведений
                <input
                  className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2"
                  type="number"
                  value={plan.maxVenues}
                  onChange={(event) => updateDraft(plan.id, { maxVenues: Number(event.target.value) })}
                />
              </label>
              <label className="text-sm font-semibold">
                Меню / заведение
                <input
                  className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2"
                  type="number"
                  value={plan.maxMenusPerVenue}
                  onChange={(event) => updateDraft(plan.id, { maxMenusPerVenue: Number(event.target.value) })}
                />
              </label>
              <label className="text-sm font-semibold">
                Позиций / меню
                <input
                  className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2"
                  type="number"
                  value={plan.maxMenuItemsPerMenu}
                  onChange={(event) => updateDraft(plan.id, { maxMenuItemsPerMenu: Number(event.target.value) })}
                />
              </label>
              <label className="text-sm font-semibold">
                AI-импортов / мес
                <input
                  className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2"
                  type="number"
                  value={plan.aiImportsPerMonth}
                  onChange={(event) => updateDraft(plan.id, { aiImportsPerMonth: Number(event.target.value) })}
                />
              </label>
              <label className="text-sm font-semibold">
                Языков перевода
                <input
                  className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2"
                  type="number"
                  value={plan.maxTranslationLanguages}
                  onChange={(event) => updateDraft(plan.id, { maxTranslationLanguages: Number(event.target.value) })}
                />
              </label>
              <label className="text-sm font-semibold">
                Template tier
                <select
                  className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2"
                  value={plan.maxTemplateTier}
                  onChange={(event) => updateDraft(plan.id, { maxTemplateTier: event.target.value })}
                >
                  <option value="basic">basic</option>
                  <option value="extended">extended</option>
                  <option value="premium">premium</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['isActive', 'Активен'],
                ['isPublic', 'Публичный'],
                ['translationsEnabled', 'Переводы'],
                ['analyticsEnabled', 'Аналитика'],
                ['qrCustomizationEnabled', 'QR кастомизация'],
                ['menuDesignCustomizationEnabled', 'Дизайн меню'],
                ['prioritySupportEnabled', 'Priority support'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(plan[key])}
                    onChange={(event) => updateDraft(plan.id, { [key]: event.target.checked })}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <Button onClick={() => handleSave(plan)} disabled={savingPlanId === plan.id}>
              {savingPlanId === plan.id ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <h2 className="text-lg font-black">Подписки</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-3 pr-4">Пользователь</th>
                <th className="pb-3 pr-4">Тариф</th>
                <th className="pb-3 pr-4">Статус</th>
                <th className="pb-3 pr-4">Период до</th>
                <th className="pb-3 pr-4">Последний платеж</th>
                <th className="pb-3 pr-4">UnitPay</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id} className="border-t border-border/50">
                  <td className="py-3 pr-4">
                    <div className="font-bold">{subscription.name}</div>
                    <div className="text-xs text-muted-foreground">{subscription.email}</div>
                  </td>
                  <td className="py-3 pr-4">{subscription.planName}</td>
                  <td className="py-3 pr-4">{subscription.status}</td>
                  <td className="py-3 pr-4">{formatDateTime(subscription.currentPeriodEnd)}</td>
                  <td className="py-3 pr-4">
                    {subscription.lastPaymentStatus || '—'}
                    <div className="text-xs text-muted-foreground">{formatDateTime(subscription.lastPaymentAt)}</div>
                  </td>
                  <td className="py-3 pr-4">{subscription.unitpaySubscriptionId || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

export default BillingPage;
