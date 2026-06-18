import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, LoaderCircle, TriangleAlert, XCircle } from 'lucide-react';

import SettingsPageHeader from "../components/settings/SettingsPageHeader";
import { Button } from "../components/ui/button";
import { fetchBillingSummary, syncBillingTransactionByStripeSessionId } from "../lib/billingApi";
import { secondaryActionButtonClasses } from "../lib/uiStyles";
import { listVenues } from "../lib/venuesApi";

const STATUS_COPY = {
  success: {
    icon: CheckCircle2,
    iconClassName: 'text-emerald-600',
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    title: 'Subscription activated',
    description: 'Stripe confirmed the payment and your subscription is being updated.',
  },
  fail: {
    icon: XCircle,
    iconClassName: 'text-red-600',
    badgeClassName: 'border-red-200 bg-red-50 text-red-700',
    title: 'Payment was not completed',
    description: 'You can return to checkout and try again.',
  },
};

const BillingCheckoutReturnPage = ({ mode = 'success' }) => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({
    loading: mode === 'success',
    error: '',
    synced: false,
    subscriptionStatus: '',
    planName: '',
    currentPeriodEnd: '',
    primaryVenueId: '',
  });

  const stripeSessionId = searchParams.get('session_id') || '';
  const statusLabel = state.subscriptionStatus === 'active'
    ? 'Active'
    : state.subscriptionStatus || 'Active';
  const managementHref = state.primaryVenueId ? `/dashboard/venues/${state.primaryVenueId}` : '/dashboard/venues';

  const copy = useMemo(() => STATUS_COPY[mode] || STATUS_COPY.success, [mode]);
  const Icon = copy.icon;

  useEffect(() => {
    if (mode !== 'success') {
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (!stripeSessionId) {
        setState({
          loading: false,
          error: 'Stripe did not return a session_id. Open Billing and check the subscription status.',
          synced: false,
          subscriptionStatus: '',
          planName: '',
          currentPeriodEnd: '',
          primaryVenueId: '',
        });
        return;
      }

      try {
        const syncResult = await syncBillingTransactionByStripeSessionId(stripeSessionId);
        const billingSummary = await fetchBillingSummary();
        const venues = await listVenues();
        if (cancelled) {
          return;
        }
        setState({
          loading: false,
          error: '',
          synced: true,
          subscriptionStatus: syncResult.subscription?.status || billingSummary.subscription?.status || '',
          planName: billingSummary.subscription?.plan?.name || '',
          currentPeriodEnd: billingSummary.subscription?.currentPeriodEnd || '',
          primaryVenueId: venues?.[0]?.id || '',
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setState({
          loading: false,
          error: error.message || 'Could not sync the payment.',
          synced: false,
          subscriptionStatus: '',
          planName: '',
          currentPeriodEnd: '',
          primaryVenueId: '',
        });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [mode, stripeSessionId]);

  return (
    <div className="mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <SettingsPageHeader
        title={mode === 'success' ? 'Subscription checkout' : 'Payment return'}
        description={mode === 'success'
          ? 'Stripe redirect and subscription confirmation.'
          : 'The payment was not completed or was canceled during checkout.'}
        actionLabel={null}
      />

      <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5">
          <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${copy.badgeClassName}`}>
            <Icon size={18} className={copy.iconClassName} />
            {copy.title}
          </div>

          <div>
            <h2 className="text-2xl font-black text-foreground">{copy.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{copy.description}</p>
          </div>

          {mode === 'success' ? (
            <div className="rounded-2xl border border-border/60 bg-secondary/15 p-5">
              {state.loading ? (
                <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
                  <LoaderCircle className="animate-spin text-brand-purple" size={18} />
                  Checking payment status and updating your subscription...
                </div>
              ) : state.error ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm font-semibold text-red-700">
                    <TriangleAlert size={18} className="mt-0.5 shrink-0" />
                    <span>{state.error}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    If the payment succeeded, the Stripe webhook will also update the subscription on the backend.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <p className="font-semibold text-foreground">
                    Payment synced. Current subscription status: <span className="text-brand-purple">{statusLabel}</span>
                  </p>
                  {state.planName ? (
                    <p className="text-muted-foreground">Current plan: {state.planName}</p>
                  ) : null}
                  {state.currentPeriodEnd ? (
                    <p className="text-muted-foreground">Access paid until: {new Date(state.currentPeriodEnd).toLocaleDateString('en-US')}</p>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-secondary/15 p-5">
              <p className="text-sm text-muted-foreground">
                You can return to plan selection and try again. If you were charged, open Billing and check your payment history.
              </p>
            </div>
          )}

          {stripeSessionId ? (
            <div className="rounded-2xl border border-border/60 bg-secondary/10 p-5 text-sm text-muted-foreground">
              <p>Stripe session: {stripeSessionId}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            {mode === 'success' && state.synced && state.subscriptionStatus === 'active' ? (
              <Link to={managementHref} className="sm:flex-1">
                <Button className="w-full h-10 sm:h-12">
                  Manage venue
                </Button>
              </Link>
            ) : (
              <Link to="/dashboard/billing" className="sm:flex-1">
                <Button className="w-full h-10 sm:h-12">
                  Go to billing
                </Button>
              </Link>
            )}
            <Link to="/dashboard/subscription" className="sm:flex-1">
              <Button variant="outline" className={`w-full ${secondaryActionButtonClasses}`}>
                Back to plans
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BillingCheckoutReturnPage;
