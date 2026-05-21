import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

import { Button } from "../components/ui/button";
import SettingsPageHeader from "../components/settings/SettingsPageHeader";
import { createBillingCheckout, fetchBillingSummary } from "../lib/billingApi";
import { primaryActionButtonClasses } from "../lib/uiStyles";

const formatRub = (value, currency = 'RUB', lng = 'ru') => {
  const locale = lng === 'ru' ? 'ru-RU' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
};

const planFeatures = (plan, t) => [
  t('subscription.features.venues', 'Заведений: {{count}}', { count: plan.maxVenues }),
  t('subscription.features.menus', 'Меню на заведение: {{count}}', { count: plan.maxMenusPerVenue }),
  t('subscription.features.items', 'Блюд на меню: {{count}}', { count: plan.maxMenuItemsPerMenu }),
  t('subscription.features.aiImports', 'AI-импортов в месяц: {{count}}', { count: plan.aiImportsPerMonth }),
  plan.translationsEnabled 
    ? t('subscription.features.translations', 'Переводы до {{count}} языков', { count: plan.maxTranslationLanguages }) 
    : t('subscription.features.translationsDisabled', 'Без переводов'),
  t('subscription.features.template', 'Шаблон: {{tier}}', { tier: plan.maxTemplateTier }),
];

const SubscriptionPlansPage = () => {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const [data, setData] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBillingSummary()
      .then((result) => {
        setData(result);
        setSelectedPlanId(result.subscription.plan.id);
      })
      .catch((nextError) => setError(nextError.message));
  }, []);

  const selectedPlan = useMemo(
    () => data?.plans?.find((plan) => plan.id === selectedPlanId) || data?.plans?.[0],
    [data, selectedPlanId]
  );

  const handleCheckout = async () => {
    if (!selectedPlan) {
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const result = await createBillingCheckout(selectedPlan.code);
      if (result.redirectUrl) {
        window.location.assign(result.redirectUrl);
        return;
      }
      setError(t('subscription.checkoutErrorUnitpay', 'UnitPay не вернул redirectUrl для оплаты.'));
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <SettingsPageHeader
        title={t('subscription.title', 'Подписка')}
        description={t('subscription.description', 'Выберите тариф, который будет применяться ко всему аккаунту и всем вашим заведениям.')}
        actionLabel={null}
      />

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {(data?.plans || []).map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const isCurrent = data?.subscription?.plan?.id === plan.id;
          const isFeatured = plan.code === 'business';

          return (
            <article
              key={plan.id}
              className={`relative flex flex-col rounded-3xl border p-5 transition-all ${
                isFeatured
                  ? 'border-[#2a1e44] bg-[#171126] text-white shadow-[0_24px_70px_-36px_rgba(117,90,255,0.65)]'
                  : isSelected
                    ? 'border-brand-purple/40 bg-card shadow-[0_20px_50px_-38px_rgba(109,103,235,0.42)]'
                    : 'border-border/60 bg-card shadow-[0_18px_60px_-42px_rgba(109,103,235,0.1)]'
              }`}
            >
              <div className="space-y-4 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className={`text-2xl font-black tracking-tight ${isFeatured ? 'text-white' : 'text-foreground'}`}>{plan.name}</h2>
                    <p className={`text-sm mt-1 ${isFeatured ? 'text-white/70' : 'text-muted-foreground'}`}>{plan.description}</p>
                  </div>
                  {isCurrent ? (
                    <div className="rounded-full bg-brand-purple px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
                      {t('subscription.planCurrent', 'Текущий')}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-black ${isFeatured ? 'text-white' : 'text-foreground'}`}>
                    {formatRub(plan.priceAmount, plan.currency, lng)}
                  </span>
                  <span className={`pb-1 text-sm ${isFeatured ? 'text-white/60' : 'text-muted-foreground'}`}>{t('billing.perMonth', '/ мес')}</span>
                </div>

                <ul className="space-y-3">
                  {planFeatures(plan, t).map((feature) => (
                    <li key={feature} className={`flex items-center gap-2 text-sm ${isFeatured ? 'text-white/85' : 'text-muted-foreground'}`}>
                      <CheckCircle2 size={16} className={isFeatured ? 'text-brand-purple' : 'text-green-600'} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-black transition-all ${
                  isSelected
                    ? 'border-brand-purple bg-brand-purple text-white'
                    : isFeatured
                      ? 'border-white/15 bg-white/5 text-white hover:bg-white/10'
                      : 'border-border/60 bg-background hover:bg-secondary'
                }`}
              >
                {isSelected ? t('subscription.planSelected', 'Выбран') : t('subscription.planSelect', 'Выбрать тариф')}
              </button>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
        <div className="rounded-3xl border border-border/60 bg-card p-5 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-foreground">{t('subscription.howItWorks.title', 'Как работает оплата')}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {t('subscription.howItWorks.description', 'Первый платеж создаёт и привязывает подписку в UnitPay. Последующие списания выполняются по сохранённому `subscriptionId`.')}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-purple/15 bg-brand-purple/5 p-4 text-sm text-brand-purple/90 leading-relaxed">
            {t('subscription.howItWorks.warning', 'На тестовом проекте UnitPay не отправляет `subscriptionId` в callback. Поэтому полный сценарий автосписаний проверяется на боевом проекте с небольшой суммой.')}
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card p-5 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <Sparkles size={18} className="text-brand-purple" />
            <h2 className="text-lg font-extrabold text-foreground">{t('subscription.checkout.title', 'Оформление')}</h2>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/15 px-4 py-4">
            <p className="text-sm font-semibold text-foreground">{t('subscription.checkout.selectedPlan', 'Выбранный тариф')}</p>
            <p className="text-sm text-muted-foreground mt-1">{selectedPlan?.name || '—'}</p>
          </div>

          <Button className={`${primaryActionButtonClasses} w-full h-12`} onClick={handleCheckout} disabled={!selectedPlan || isSubmitting}>
            {isSubmitting ? t('subscription.checkout.btnProceeding', 'Переходим к оплате...') : t('subscription.checkout.btnProceed', 'Перейти к оплате')}
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default SubscriptionPlansPage;
