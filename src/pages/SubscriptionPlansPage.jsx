import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Lock } from 'lucide-react';

import { Button } from "../components/ui/button";
import SettingsPageHeader from "../components/settings/SettingsPageHeader";
import { createBillingCheckout, fetchBillingSummary } from "../lib/billingApi";
import { primaryActionButtonClasses } from "../lib/uiStyles";

const formatCurrency = (value, currency = 'USD', lng = 'en') => {
  const locale = 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
};

const planFeatures = (plan, t) => [
  t('subscription.features.venues', 'Venues: {{count}}', { count: plan.maxVenues }),
  t('subscription.features.menus', 'Menus per venue: {{count}}', { count: plan.maxMenusPerVenue }),
  t('subscription.features.items', 'Dishes per menu: {{count}}', { count: plan.maxMenuItemsPerMenu }),
  t('subscription.features.aiImports', 'AI imports per month: {{count}}', { count: plan.aiImportsPerMonth }),
  plan.translationsEnabled 
    ? t('subscription.features.translations', 'Translations up to {{count}} languages', { count: plan.maxTranslationLanguages }) 
    : t('subscription.features.translationsDisabled', 'No translations'),
  t('subscription.features.template', 'Template: {{tier}}', { tier: t(`subscription.templateTiers.${plan.maxTemplateTier}`, plan.maxTemplateTier) }),
];

const SubscriptionPlansPage = () => {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const [data, setData] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compliance checkboxes
  const [agreeOffer, setAgreeOffer] = useState(false);
  const [agreeRecurring, setAgreeRecurring] = useState(false);

  // Refs for scroll guides
  const checkoutSectionRef = useRef(null);
  const featuredCardRef = useRef(null);

  useEffect(() => {
    fetchBillingSummary()
      .then((result) => {
        setData(result);
        setSelectedPlanId(result.subscription.plan.id);
      })
      .catch((nextError) => setError(nextError.message));
  }, []);

  // Center scroll on featured recommended plan card on load
  useEffect(() => {
    if (data && typeof window !== 'undefined' && window.innerWidth < 1024) {
      const timer = setTimeout(() => {
        featuredCardRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [data]);

  const selectedPlan = useMemo(
    () => data?.plans?.find((plan) => plan.id === selectedPlanId) || data?.plans?.[0],
    [data, selectedPlanId]
  );

  const isCurrentSelected = useMemo(
    () => data?.subscription?.plan?.id === selectedPlanId,
    [data, selectedPlanId]
  );

  const canPurchaseSelectedPlan = useMemo(
    () => Boolean(selectedPlan) && (!isCurrentSelected || Boolean(data?.subscription?.cancelAtPeriodEnd)),
    [data, isCurrentSelected, selectedPlan]
  );

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
    setAgreeOffer(false);
    setAgreeRecurring(false);

    // Smooth scroll down to checkout compliance form on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        checkoutSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleCheckout = async () => {
    if (!selectedPlan) {
      return;
    }
    if (!canPurchaseSelectedPlan) {
      return;
    }
    if (!agreeOffer || !agreeRecurring) {
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
      setError(t('subscription.checkoutErrorStripe', 'Could not start the payment session. Please try again later or contact support.'));
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <SettingsPageHeader
        title={t('subscription.title', 'Subscription')}
        description={t('subscription.description', 'Choose the plan that applies to your account and all venues.')}
        actionLabel={null}
      />

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      {/* Swipeable pricing row on mobile with vertical padding to prevent clipping of top badges/shadows */}
      <section className="flex lg:grid gap-6 lg:grid-cols-3 overflow-x-auto lg:overflow-x-visible py-5 lg:py-0 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:-mx-8 sm:px-8">
        {(data?.plans || []).map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const isCurrent = data?.subscription?.plan?.id === plan.id;
          const isFeatured = plan.code === 'pro';

          return (
            <article
              key={plan.id}
              ref={isFeatured ? featuredCardRef : null}
              className={`relative flex flex-col rounded-3xl border p-6 transition-all duration-300 snap-center shrink-0 w-[290px] xs:w-[320px] lg:w-auto hover:-translate-y-1.5 hover:shadow-xl ${
                isFeatured
                  ? 'border-brand-purple/60 bg-gradient-to-b from-[#1c1430] to-[#0f0a1c] text-white shadow-[0_24px_60px_-20px_rgba(117,90,255,0.4)]'
                  : isSelected
                    ? 'border-brand-purple/40 bg-card shadow-[0_20px_50px_-38px_rgba(109,103,235,0.42)]'
                    : 'border-border/60 bg-card hover:border-brand-purple/25 shadow-[0_18px_60px_-42px_rgba(109,103,235,0.05)]'
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-purple to-[#8b5cf6] px-4 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-brand-purple/35 whitespace-nowrap">
                  {t('subscription.recommended', 'Recommended')}
                </div>
              )}

              <div className="space-y-4 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className={`text-2xl font-black tracking-tight ${isFeatured ? 'text-white' : 'text-foreground'}`}>{plan.name}</h2>
                      {isFeatured && <Sparkles size={18} className="text-brand-purple shrink-0 animate-pulse" />}
                    </div>
                    <p className={`text-xs sm:text-sm mt-1 ${isFeatured ? 'text-white/70' : 'text-muted-foreground'}`}>{plan.description}</p>
                  </div>
                  {isCurrent ? (
                    <div className="rounded-full bg-brand-purple/20 border border-brand-purple/30 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-brand-purple">
                      {t('subscription.planCurrent', 'Current')}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-end gap-2 border-b pb-4 border-border/10">
                  <span className={`text-4xl font-black ${isFeatured ? 'text-white' : 'text-foreground'}`}>
                    {formatCurrency(plan.priceAmount, plan.currency, lng)}
                  </span>
                  <span className={`pb-1 text-xs font-semibold ${isFeatured ? 'text-white/60' : 'text-muted-foreground'}`}>{t('billing.perMonth', '/ mo')}</span>
                </div>

                <ul className="space-y-3 pt-2">
                  {planFeatures(plan, t).map((feature) => (
                    <li key={feature} className={`flex items-center gap-2.5 text-xs sm:text-sm ${isFeatured ? 'text-white/90' : 'text-muted-foreground'}`}>
                      <CheckCircle2 size={16} className={`shrink-0 ${isFeatured ? 'text-brand-purple' : 'text-emerald-500'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPlan(plan.id)}
                className={`mt-6 rounded-lg border px-4 py-3 text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  isSelected
                    ? 'border-brand-purple bg-brand-purple text-white shadow-md shadow-brand-purple/25 hover:opacity-95'
                    : isFeatured
                      ? 'border-brand-purple/20 bg-brand-purple/10 text-white hover:bg-brand-purple/20'
                      : 'border-border/60 bg-background hover:bg-secondary text-foreground'
                }`}
              >
                {isSelected ? t('subscription.planSelected', 'Selected') : t('subscription.planSelect', 'Select plan')}
              </button>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple shadow-sm">
                <ShieldCheck size={24} />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-black text-foreground">{t('subscription.howItWorks.title', 'Secure payments')}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t('subscription.howItWorks.description', 'Payments are processed by a certified provider. All transactions are protected with SSL encryption and PCI DSS compliant infrastructure.')}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-purple/10 bg-brand-purple/5 p-4 text-xs sm:text-sm text-brand-purple leading-relaxed">
              {t('subscription.howItWorks.warning', 'The subscription renews automatically every 30 days. You can change your plan or cancel auto-renewal at any time from your dashboard.')}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/40 text-muted-foreground/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Lock size={14} className="text-emerald-500" />
              <span>SSL Secured 256-bit</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>PCI DSS Compliant</span>
            </div>
          </div>
        </div>

        <div ref={checkoutSectionRef} className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-brand-purple" />
              <h2 className="text-lg font-black text-foreground">{t('subscription.checkout.title', 'Checkout')}</h2>
            </div>

            <div className="rounded-2xl border border-border/60 bg-secondary/20 px-4 py-4 space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('subscription.checkout.selectedPlan', 'Selected plan')}</p>
              <div className="flex items-center justify-between">
                <p className="text-base font-extrabold text-foreground">{selectedPlan?.name || '—'}</p>
                <p className="text-base font-black text-brand-purple">
                  {selectedPlan ? formatCurrency(selectedPlan.priceAmount, selectedPlan.currency, lng) : '—'}
                </p>
              </div>
            </div>

            {canPurchaseSelectedPlan && selectedPlan ? (
              <div className="space-y-4 pt-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeOffer}
                    onChange={(e) => setAgreeOffer(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-border text-brand-purple focus:ring-brand-purple/30 accent-brand-purple"
                  />
                  <span className="text-xs sm:text-sm text-muted-foreground leading-normal">
                    {t('subscription.checkout.agreeOffer')}{' '}
                    <a
                      href="https://kwikme.nu/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-purple font-bold hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t('subscription.checkout.agreeOfferLink')}
                    </a>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeRecurring}
                    onChange={(e) => setAgreeRecurring(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-border text-brand-purple focus:ring-brand-purple/30 accent-brand-purple"
                  />
                  <span className="text-xs sm:text-sm text-muted-foreground leading-normal">
                    {t('subscription.checkout.agreeRecurring', {
                      price: formatCurrency(selectedPlan.priceAmount, selectedPlan.currency, lng),
                    })}
                  </span>
                </label>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            {!canPurchaseSelectedPlan ? (
              <Button className="w-full h-12 rounded-lg text-sm font-black bg-secondary text-muted-foreground border border-border/50 cursor-not-allowed" disabled>
                {t('subscription.checkout.btnActive', 'Current plan is active')}
              </Button>
            ) : (
              <Button
                className={`${primaryActionButtonClasses} w-full h-12 rounded-lg`}
                onClick={handleCheckout}
                disabled={!selectedPlan || isSubmitting || !agreeOffer || !agreeRecurring}
              >
                {isSubmitting ? (
                  t('subscription.checkout.btnProceeding', 'Opening checkout...')
                ) : (
                  <>
                    <Lock size={16} className="mr-2" />
                    {isCurrentSelected && data?.subscription?.cancelAtPeriodEnd
                      ? 'Restart subscription'
                      : t('subscription.checkout.btnProceed', 'Proceed to payment')}
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </Button>
            )}

            <div className="flex items-center justify-center gap-2 text-muted-foreground/60 text-[10px] font-extrabold uppercase tracking-widest text-center">
              <span>{t('subscription.checkout.securePaymentNotice', 'Secure SSL connection · PCI DSS')}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SubscriptionPlansPage;
