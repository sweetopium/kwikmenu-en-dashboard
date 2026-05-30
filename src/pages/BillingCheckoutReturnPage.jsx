import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, LoaderCircle, TriangleAlert, XCircle } from 'lucide-react';

import SettingsPageHeader from "../components/settings/SettingsPageHeader";
import { Button } from "../components/ui/button";
import { fetchBillingSummary, syncBillingTransactionByUnitPayId } from "../lib/billingApi";
import { secondaryActionButtonClasses } from "../lib/uiStyles";

const STATUS_COPY = {
  success: {
    icon: CheckCircle2,
    iconClassName: 'text-emerald-600',
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    title: 'Подписка оформляется',
    description: 'Мы проверяем результат платежа и обновляем статус подписки в вашем кабинете.',
  },
  fail: {
    icon: XCircle,
    iconClassName: 'text-red-600',
    badgeClassName: 'border-red-200 bg-red-50 text-red-700',
    title: 'Платеж не завершен',
    description: 'Если деньги не списались, вы можете вернуться к оформлению и попробовать снова.',
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
  });

  const unitpayPaymentId = searchParams.get('paymentId') || '';
  const account = searchParams.get('account') || '';

  const copy = useMemo(() => STATUS_COPY[mode] || STATUS_COPY.success, [mode]);
  const Icon = copy.icon;

  useEffect(() => {
    if (mode !== 'success') {
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (!unitpayPaymentId) {
        setState({
          loading: false,
          error: 'UnitPay не передал paymentId. Откройте страницу биллинга и проверьте статус вручную.',
          synced: false,
          subscriptionStatus: '',
          planName: '',
          currentPeriodEnd: '',
        });
        return;
      }

      try {
        const syncResult = await syncBillingTransactionByUnitPayId(unitpayPaymentId);
        const billingSummary = await fetchBillingSummary();
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
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setState({
          loading: false,
          error: error.message || 'Не удалось синхронизировать платеж.',
          synced: false,
          subscriptionStatus: '',
          planName: '',
          currentPeriodEnd: '',
        });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [mode, unitpayPaymentId]);

  return (
    <div className="mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <SettingsPageHeader
        title={mode === 'success' ? 'Оформление подписки' : 'Возврат после оплаты'}
        description={mode === 'success'
          ? 'Редирект из UnitPay и подтверждение платежа на нашей стороне.'
          : 'Платеж не был завершен или был отменен в процессе оплаты.'}
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
                  Проверяем статус платежа и обновляем подписку...
                </div>
              ) : state.error ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm font-semibold text-red-700">
                    <TriangleAlert size={18} className="mt-0.5 shrink-0" />
                    <span>{state.error}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Если оплата уже прошла, ничего не потеряно: callback `pay` от UnitPay все равно обновит подписку на backend.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <p className="font-semibold text-foreground">
                    Платеж синхронизирован. Текущий статус подписки: <span className="text-brand-purple">{state.subscriptionStatus || 'active'}</span>
                  </p>
                  {state.planName ? (
                    <p className="text-muted-foreground">Текущий тариф: {state.planName}</p>
                  ) : null}
                  {state.currentPeriodEnd ? (
                    <p className="text-muted-foreground">Доступ оплачен до: {new Date(state.currentPeriodEnd).toLocaleDateString('ru-RU')}</p>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-secondary/15 p-5">
              <p className="text-sm text-muted-foreground">
                Вы можете вернуться к выбору тарифа и повторить оплату. Если деньги были списаны, откройте биллинг в кабинете и проверьте историю платежей.
              </p>
            </div>
          )}

          {(unitpayPaymentId || account) ? (
            <div className="rounded-2xl border border-border/60 bg-secondary/10 p-5 text-sm text-muted-foreground">
              {unitpayPaymentId ? <p>UnitPay paymentId: {unitpayPaymentId}</p> : null}
              {account ? <p>Account: {account}</p> : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/dashboard/billing" className="sm:flex-1">
              <Button className="w-full">
                Перейти в биллинг
              </Button>
            </Link>
            <Link to="/dashboard/subscription" className="sm:flex-1">
              <Button variant="outline" className={`w-full ${secondaryActionButtonClasses}`}>
                Вернуться к тарифам
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BillingCheckoutReturnPage;
