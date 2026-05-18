import { PageHeader } from '../components/admin/PageHeader';

const BillingPage = () => (
  <>
    <PageHeader title="Биллинг" description="Место для тарифов, trial, active_until и ручного управления подписками." />
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <h2 className="text-lg font-black">Модель подписок пока не заведена</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        На фронте уже есть страницы billing/subscription, но в backend-моделях сейчас нет отдельной таблицы подписок.
        Следующий шаг: добавить workspace/subscription модель и вывести здесь тариф, статус, trial, дату окончания и историю платежных событий.
      </p>
    </div>
  </>
);

export default BillingPage;
