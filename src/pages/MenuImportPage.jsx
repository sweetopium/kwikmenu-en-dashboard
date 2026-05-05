import { FileText, WandSparkles } from 'lucide-react';

import MenuImportFlow from "../components/menu-import/MenuImportFlow";
import SettingsPageHeader from "../components/settings/SettingsPageHeader";

const MenuImportPage = () => {
  return (
    <div className="mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <SettingsPageHeader
        title="Новое меню"
        description="Отдельный экран импорта для рабочего кабинета. Пока без БД: отправляем исходники в webhook и показываем полный visual flow."
        actionLabel={null}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8">
          <MenuImportFlow
            context={{ flow: 'dashboard', trigger: 'menu_create' }}
            introTitle="Импортируйте меню"
            introDescription="Поддерживаем PDF, фотографии и ссылку на облако или сайт. После отправки покажем состояние обработки и переводим в существующий редактор."
            submitLabel="Создать черновик меню"
            successTitle="Импорт завершен"
            successDescription="Webhook принял исходники. Для текущего прототипа открываем существующий демо-редактор, пока без сохранения новой сущности меню."
            successPrimaryLabel="Открыть демо-редактор"
            successPrimaryTo="/dashboard/menu/main"
            successSecondaryLabel="Загрузить другой файл"
          />
        </section>

        <aside className="space-y-6">
          <section className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
                <WandSparkles size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Что делает импорт</h2>
                <p className="text-sm text-muted-foreground">Пока только front-flow и webhook dispatch.</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                'Принимаем PDF, фотографии или ссылку на меню.',
                'Отправляем данные в n8n webhook без локального сохранения.',
                'Показываем статусы загрузки, обработки, успеха и ошибки.',
                'После успеха переводим в существующий демо-редактор.',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-border/60 bg-secondary/15 px-4 py-4 text-sm leading-relaxed text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Следующий этап</h2>
                <p className="text-sm text-muted-foreground">Когда появится backend-модель меню.</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              Затем сюда добавим реальный `menu_id`, polling или job-status и переход не в демо, а в конкретный распознанный черновик.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default MenuImportPage;
