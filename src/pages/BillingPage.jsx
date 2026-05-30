import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Receipt, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from "../components/ui/button";
import SettingsPageHeader from "../components/settings/SettingsPageHeader";
import { cancelBillingSubscription, fetchBillingSummary, syncBillingTransaction } from "../lib/billingApi";
import { secondaryActionButtonClasses } from "../lib/uiStyles";

const formatDate = (value, lng = 'ru') => {
  if (!value) {
    return '—';
  }
  const locale = lng === 'ru' ? 'ru-RU' : 'en-US';
  return new Date(value).toLocaleDateString(locale);
};

const formatAmount = (value, currency = 'RUB', lng = 'ru') => {
  const locale = lng === 'ru' ? 'ru-RU' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
};

const BillingPage = () => {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [syncingId, setSyncingId] = useState('');

  const load = () => {
    setError('');
    fetchBillingSummary().then(setData).catch((nextError) => setError(nextError.message));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async () => {
    if (!window.confirm(t('billing.cancelConfirm', 'Отключить автопродление подписки?'))) {
      return;
    }
    setIsCancelling(true);
    setError('');
    try {
      await cancelBillingSubscription();
      load();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSync = async (paymentId) => {
    setSyncingId(paymentId);
    setError('');
    try {
      await syncBillingTransaction(paymentId);
      load();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSyncingId('');
    }
  };

  const subscription = data?.subscription;
  const usage = data?.usage;
  const canRestartSubscription = Boolean(subscription?.cancelAtPeriodEnd);

  return (
    <div className="mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <SettingsPageHeader
        title={t('billing.title', 'Биллинг')}
        description={t('billing.description', 'Тариф, автопродление и история списаний по вашему аккаунту.')}
        actionLabel={null}
      />

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] gap-6">
        <section className="bg-card border border-border/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 bg-brand-purple/5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-purple text-white flex items-center justify-center shadow-lg shadow-brand-purple/20">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-foreground">{subscription?.plan?.name || t('billing.subscription', 'Подписка')}</h2>
                <p className="text-sm text-brand-purple font-bold">
                  {t('billing.status', 'Статус')}: {subscription?.status ? t(`billing.statuses.${subscription.status}`, subscription.status) : t('common.loading', 'Загрузка...')}
                  {subscription?.cancelAtPeriodEnd ? ` · ${t('billing.autoRenewalDisabled', 'автопродление отключено')}` : ''}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-2xl font-black text-foreground">
                {subscription?.plan ? formatAmount(subscription.plan.priceAmount, subscription.plan.currency, lng) : '—'}
                <span className="text-sm text-muted-foreground font-medium"> {t('billing.perMonth', '/ мес')}</span>
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-secondary/15 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('billing.period', 'Период доступа')}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatDate(subscription?.currentPeriodStart, lng)} - {formatDate(subscription?.currentPeriodEnd, lng)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-secondary/15 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('billing.trialEnd', 'Trial / следующее окончание')}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{formatDate(subscription?.trialEndsAt || subscription?.currentPeriodEnd, lng)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground">{t('billing.limitsTitle', 'Лимиты и использование')}</h3>
              <ul className="space-y-3">
                {[
                  t('billing.limits.venuesCount', 'Заведений: {{count}} из {{max}}', { count: usage?.venuesCount ?? 0, max: usage?.maxVenues ?? '—' }),
                  t('billing.limits.aiImports', 'AI-импортов в этом месяце: {{count}} из {{max}}', { count: usage?.aiImportsUsedThisMonth ?? 0, max: usage?.aiImportsPerMonth ?? '—' }),
                  usage?.translationsEnabled 
                    ? t('billing.limits.translations', 'Переводы: до {{count}} языков', { count: usage.maxTranslationLanguages }) 
                    : t('billing.limits.translationsDisabled', 'Переводы: недоступны'),
                  t('billing.limits.templateTier', 'Шаблон: {{tier}}', { tier: subscription?.plan?.maxTemplateTier || '—' }),
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row gap-3">
              {canRestartSubscription ? (
                <Link to="/dashboard/subscription" className="sm:flex-1">
                  <Button className="w-full p-3 sm:h-12 rounded-lg font-bold">
                    Возобновить подписку
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="destructive"
                  className="sm:flex-1 p-3 sm:h-12 rounded-lg font-bold bg-red-500/10 text-red-500 border-none hover:bg-red-500/20"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  Отменить подписку
                </Button>
              )}
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                <CreditCard size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{t('billing.unitpay.title', 'UnitPay')}</h2>
                <p className="text-sm text-muted-foreground">{t('billing.unitpay.description', 'Привязка карты и последующие списания управляются через UnitPay.')}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-secondary/15 px-4 py-4">
              <p className="text-sm font-semibold text-foreground">{t('billing.unitpay.subscriptionId', 'Subscription ID')}</p>
              <p className="text-sm text-muted-foreground mt-1">{subscription?.unitpaySubscriptionId || t('billing.unitpay.notLinked', 'Пока не привязана')}</p>
            </div>
          </section>

          <section className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                <Receipt size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{t('billing.history.title', 'История платежей')}</h2>
                <p className="text-sm text-muted-foreground">{t('billing.history.description', 'Последние транзакции и ручная синхронизация статуса.')}</p>
              </div>
            </div>

            <div className="space-y-3">
              {(data?.recentTransactions || []).map((transaction) => (
                <div key={transaction.id} className="rounded-2xl border border-border/60 bg-secondary/15 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{transaction.planName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t(`billing.transactionStatus.${transaction.status}`, transaction.status)} · {t(`billing.transactionKind.${transaction.kind}`, transaction.kind)} · {formatDate(transaction.createdAt, lng)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{formatAmount(transaction.amount, transaction.currency, lng)}</p>
                    </div>
                    {transaction.status === 'pending' ? (
                      <Button
                        variant="outline"
                        className="h-9 rounded-lg"
                        onClick={() => handleSync(transaction.id)}
                        disabled={syncingId === transaction.id}
                      >
                        {syncingId === transaction.id ? t('billing.history.syncing', 'Синхронизация...') : t('billing.history.sync', 'Синхронизировать')}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              {!data?.recentTransactions?.length ? (
                <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                  {t('billing.history.empty', 'История платежей пока пуста.')}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
