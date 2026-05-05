import { CreditCard, Download, Receipt, Save, ShieldCheck } from 'lucide-react';

import { Button } from "../components/ui/button";
import SettingsPageHeader from "../components/settings/SettingsPageHeader";
import { secondaryActionButtonClasses } from "../lib/uiStyles";

const BillingPage = () => {
  return (
    <div className="mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <SettingsPageHeader
        title="Биллинг"
        description="Тариф, платежи и документы по подписке вашего кабинета."
        actionLabel="Обновить способ оплаты"
        actionIcon={Save}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] gap-6">
        <section className="bg-card border border-border/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 bg-brand-purple/5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-purple text-white flex items-center justify-center shadow-lg shadow-brand-purple/20">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-foreground">PRO Тариф</h2>
                <p className="text-sm text-brand-purple font-bold">Активен до 24.06.2026</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-2xl font-black text-foreground">990 ₽ <span className="text-sm text-muted-foreground font-medium">/ мес</span></p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground">Что входит в тариф:</h3>
              <ul className="space-y-3">
                {[
                  'Неограниченное количество блюд и категорий',
                  'Кастомизация дизайна QR-кодов и меню',
                  'Приоритетная поддержка 24/7',
                  'Аналитика просмотров и кликов',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className={`flex-1 ${secondaryActionButtonClasses}`}>
                Квитанции и чеки
              </Button>
              <Button variant="destructive" className="flex-1 h-10 sm:h-12 rounded-lg font-bold bg-red-500/10 text-red-500 border-none hover:bg-red-500/20">
                Отменить подписку
              </Button>
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
                <h2 className="text-lg font-bold text-foreground">Способ оплаты</h2>
                <p className="text-sm text-muted-foreground">Основная карта для продления тарифа.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-secondary/15 px-4 py-4">
              <p className="text-sm font-semibold text-foreground">Visa •••• 4242</p>
              <p className="text-sm text-muted-foreground mt-1">Списание 24 числа каждого месяца</p>
            </div>

            <Button variant="outline" className={`w-full ${secondaryActionButtonClasses}`}>
              Сменить карту
            </Button>
          </section>

          <section className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                <Receipt size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Документы</h2>
                <p className="text-sm text-muted-foreground">Доступ к последним счетам и закрывающим документам.</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                ['Март 2026', 'Счёт и чек'],
                ['Февраль 2026', 'Счёт и чек'],
                ['Январь 2026', 'Счёт и чек'],
              ].map(([period, type]) => (
                <div key={period} className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-secondary/15 px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{period}</p>
                    <p className="text-xs text-muted-foreground mt-1">{type}</p>
                  </div>
                  <button className="w-10 h-10 rounded-lg border border-border/60 bg-background hover:bg-secondary transition-colors flex items-center justify-center text-muted-foreground">
                    <Download size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
