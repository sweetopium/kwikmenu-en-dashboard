import { FileText, WandSparkles } from 'lucide-react';

import MenuImportFlow from "../components/menu-import/MenuImportFlow";
import SettingsPageHeader from "../components/settings/SettingsPageHeader";

const MenuImportPage = () => {
  const activeVenueId = typeof window !== 'undefined' ? window.localStorage.getItem('kwikmenu-active-venue') : null;

  return (
    <div className="mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <SettingsPageHeader
        title="Новое меню"
        description="Экран импорта для рабочего кабинета. Отправляем исходники в backend job, сохраняем результат и открываем черновик меню."
        actionLabel={null}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8">
          <MenuImportFlow
            venueId={activeVenueId}
            context={{ flow: 'dashboard', trigger: 'menu_create' }}
            introTitle="Импортируйте меню"
            introDescription="Поддерживаем PDF, фотографии и прямую ссылку на PDF-файл. После обработки сохраним черновик меню и откроем его в редакторе."
            submitLabel="Создать черновик меню"
            successTitle="Импорт завершен"
            successDescription="Backend job принял исходники, собрал итоговый JSON, сохранил меню и подготовил его к редактированию."
            successPrimaryLabel="Открыть редактор"
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
                <p className="text-sm text-muted-foreground">Работает через backend import job и polling.</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                'Принимаем PDF, фотографии или прямую ссылку на PDF.',
                'Создаем backend job и сохраняем исходники локально.',
                'Показываем статусы загрузки, обработки, успеха и ошибки через polling.',
                'После успеха создаем черновик меню и открываем редактор.',
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
                <p className="text-sm text-muted-foreground">Текущий контур уже сохраняет меню и venue на backend.</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              Следующим шагом сюда добавим историю импортов, повторные загрузки и выбор целевого заведения прямо перед запуском job.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default MenuImportPage;
