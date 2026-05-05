import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import SettingsPageHeader from "../components/settings/SettingsPageHeader";
import {
  formFieldClasses,
  primaryActionButtonClasses,
  secondaryActionButtonClasses,
} from "../lib/uiStyles";

const PLAN_OPTIONS = [
  {
    id: 'starter',
    name: 'Стартовый',
    description: 'Идеально для уютных кофеен и небольших баров.',
    monthlyPrice: 1590,
    yearlyPrice: 19080,
    badge: null,
    features: [
      'AI-импорт меню из PDF',
      'До 100 позиций',
      'Базовый QR-код',
      'Управление стоп-листом',
    ],
  },
  {
    id: 'basic',
    name: 'Базовый',
    description: 'Для активных ресторанов: стоп-листы, сезонные меню и обновления.',
    monthlyPrice: 3190,
    yearlyPrice: 38280,
    badge: 'ХИТ ПРОДАЖ',
    features: [
      'Все функции тарифа Стартовый',
      'Безлимитные позиции',
      'AI-перевод на 12 языков',
      'Кастомизация дизайна меню',
      'Аналитика сканирований',
    ],
  },
  {
    id: 'pro',
    name: 'Про',
    description: 'Для ресторанных сетей и крупных заведений.',
    monthlyPrice: 6390,
    yearlyPrice: 76680,
    badge: null,
    features: [
      'Все функции тарифа Базовый',
      'Мульти-заведения (до 5)',
      'Командный доступ (менеджеры)',
      'API и интеграции (iiko, r_keeper)',
      'Приоритетная поддержка 24/7',
    ],
  },
];

const formatRub = (value) => `${value.toLocaleString('ru-RU')} ₽`;

const SubscriptionPlansPage = () => {
  const [selectedPlanId, setSelectedPlanId] = useState('basic');
  const selectedPlan = useMemo(
    () => PLAN_OPTIONS.find((plan) => plan.id === selectedPlanId) || PLAN_OPTIONS[1],
    [selectedPlanId]
  );

  // Вынесли рендер карточки в отдельную функцию, чтобы не дублировать код
  // для мобильной (1 карточка) и десктопной (3 карточки) версий.
  const renderPlanCard = (plan) => {
    const isSelected = selectedPlanId === plan.id;
    const isFeatured = plan.id === 'basic';

    return (
      <article
        key={plan.id}
        className={`relative flex flex-col h-full rounded-3xl border p-4 sm:p-5 transition-all animate-in fade-in zoom-in-95 duration-300 ${
          isFeatured
            ? 'border-[#2a1e44] bg-[#171126] text-white shadow-[0_24px_70px_-36px_rgba(117,90,255,0.65)] z-10'
            : isSelected
              ? 'border-brand-purple/40 bg-card shadow-[0_20px_50px_-38px_rgba(109,103,235,0.42)]'
              : 'border-border/60 bg-card shadow-[0_18px_60px_-42px_rgba(109,103,235,0.1)]'
        }`}
      >
        <div className="flex flex-col flex-grow space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isFeatured ? 'text-white' : 'text-foreground'}`}>
                {plan.name}
              </h2>
              {plan.badge && (
                <div className="shrink-0 rounded-full bg-brand-purple px-2 py-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide text-white shadow-lg shadow-brand-purple/30">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={10} />
                    {plan.badge}
                  </span>
                </div>
              )}
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed ${isFeatured ? 'text-white/70' : 'text-muted-foreground'}`}>
              {plan.description}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className={`text-3xl sm:text-4xl font-black tracking-tight ${isFeatured ? 'text-white' : 'text-foreground'}`}>
                {plan.monthlyPrice}
              </span>
              <span className={`text-lg font-bold ${isFeatured ? 'text-white/50' : 'text-muted-foreground'}`}>₽</span>
              <span className={`text-sm font-semibold ${isFeatured ? 'text-white/50' : 'text-muted-foreground'}`}>
                / мес
              </span>
            </div>
            <p className="text-sm font-bold text-brand-purple">
              Итого {formatRub(plan.yearlyPrice)} за год
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setSelectedPlanId(plan.id)}
            className={`h-10 sm:h-11 w-full rounded-xl text-sm font-bold transition-all mt-2 ${
              isFeatured
                ? 'bg-white text-foreground hover:bg-white/95'
                : isSelected
                  ? 'bg-brand-purple text-white hover:bg-brand-purple/90'
                  : 'bg-background text-foreground border border-border/60 hover:bg-secondary/30 shadow-sm'
            }`}
          >
            {isSelected ? 'Тариф выбран' : 'Выбрать тариф'}
            {!isSelected && <ArrowRight size={16} className="ml-2" />}
          </Button>

          <div className="space-y-2.5 pt-3 mt-auto">
            <h3 className={`text-xs font-extrabold uppercase tracking-wide ${isFeatured ? 'text-white/85' : 'text-foreground'}`}>
              Что включено:
            </h3>
            <ul className="space-y-2">
              {plan.features.slice(0, 5).map((feature) => (
                <li
                  key={feature}
                  className={`flex items-start gap-2 text-xs sm:text-sm leading-relaxed ${
                    isFeatured ? 'text-white/80' : 'text-muted-foreground'
                  }`}
                >
                  <CheckCircle2
                    size={14}
                    className={`mt-0.5 shrink-0 ${isFeatured ? 'text-brand-purple' : 'text-brand-purple'}`}
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <SettingsPageHeader
        title="Подписка"
        description="Отдельный экран выбора тарифа и привязки карты. Пока это visual state, без логики оплаты."
        actionLabel={null}
      />

      <section className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6 shadow-sm">
        <div className="mb-5 sm:mb-6 flex items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-foreground">Выберите тариф</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Выберите план перед привязкой карты.</p>
          </div>
          <span className="hidden sm:inline-flex shrink-0 whitespace-nowrap rounded-full bg-brand-purple/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-purple">
            14 дней бесплатно
          </span>
        </div>

        {/* МОБИЛЬНАЯ ВЕРСИЯ: Табы для переключения (видна только до lg) */}
        <div className="flex lg:hidden w-full bg-secondary/30 p-1.5 rounded-2xl mb-5">
          {PLAN_OPTIONS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${
                selectedPlanId === plan.id
                  ? 'bg-brand-purple text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <span className="text-base sm:text-lg font-black">{plan.monthlyPrice} ₽</span>
              <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">{plan.name}</span>
            </button>
          ))}
        </div>

        {/* МОБИЛЬНАЯ ВЕРСИЯ: Карточка (рендерится только одна, видна только до lg) */}
        <div className="block lg:hidden" key={`mobile-view-${selectedPlan.id}`}>
          {renderPlanCard(selectedPlan)}
        </div>

        {/* ДЕСКТОПНАЯ ВЕРСИЯ: Сетка из 3 карточек (видна только от lg и выше) */}
        <div className="hidden lg:grid gap-4 lg:grid-cols-3">
          {PLAN_OPTIONS.map((plan) => renderPlanCard(plan))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="rounded-3xl border border-border/60 bg-card p-5 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
              <CreditCard size={20} />
            </div>
            <div className="pt-0.5">
              <h2 className="text-lg sm:text-xl font-extrabold text-foreground">Привязка карты</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Мок экрана оплаты. Никакой логики здесь пока нет.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">Номер карты</Label>
              <Input value="4242 4242 4242 4242" readOnly className={formFieldClasses} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">Имя держателя</Label>
              <Input value="Tatyana Vasilieva" readOnly className={formFieldClasses} />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">Срок</Label>
                <Input value="08/28" readOnly className={formFieldClasses} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">CVC</Label>
                <Input value="321" readOnly className={formFieldClasses} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-purple/15 bg-brand-purple/5 p-3 sm:p-4 text-xs sm:text-sm text-brand-purple/80 flex items-start gap-2.5">
            <Lock size={16} className="mt-0.5 shrink-0 text-brand-purple" />
            <span className="leading-relaxed">Данные карты здесь только как заглушка для визуала. Позже сюда можно будет подключить CloudPayments, YooKassa или Stripe.</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Button className={`${primaryActionButtonClasses} flex-1 p-3 h-11 sm:h-12 w-full`}>
              Запустить бесплатный период
            </Button>
            <Button variant="outline" className={`flex-1 p-3  h-11 sm:h-12 w-full ${secondaryActionButtonClasses}`}>
              Привязать карту позже
            </Button>
          </div>
        </div>

        <aside className="rounded-3xl border border-border/60 bg-card p-5 sm:p-8 shadow-sm space-y-5 lg:sticky lg:top-24 self-start">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-purple text-white shadow-md shadow-brand-purple/20">
              <ShieldCheck size={20} />
            </div>
            <div className="pt-0.5">
              <h2 className="text-lg sm:text-xl font-extrabold text-foreground">Итог подписки</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Выбранный тариф и условия запуска.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/15 p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Тариф</p>
                <p className="text-xl sm:text-2xl font-black text-foreground mt-0.5 truncate">{selectedPlan.name}</p>
              </div>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-brand-purple/10 px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-brand-purple">
                14 дней бесплатно
              </span>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-2.5">
              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <span className="text-muted-foreground">Ежемесячно</span>
                <span className="font-bold text-foreground">{formatRub(selectedPlan.monthlyPrice)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <span className="text-muted-foreground">За год</span>
                <span className="font-bold text-brand-purple">{formatRub(selectedPlan.yearlyPrice)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <span className="text-muted-foreground">Первое списание</span>
                <span className="font-bold text-foreground">через 14 дней</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <p className="text-sm font-bold text-foreground">Что произойдёт дальше:</p>
            <ul className="space-y-2.5">
              {[
                'Подтвердите выбранный тариф',
                'Привяжите карту для автопродления',
                'Сразу после активации откроются функции',
              ].map((step) => (
                <li key={step} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-purple" />
                  <span className="leading-snug">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default SubscriptionPlansPage;