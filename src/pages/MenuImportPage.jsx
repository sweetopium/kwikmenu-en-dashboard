import { FileText, WandSparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import MenuImportFlow from "../components/menu-import/MenuImportFlow";
import SettingsPageHeader from "../components/settings/SettingsPageHeader";

const MenuImportPage = () => {
  const { t } = useTranslation();
  const activeVenueId = typeof window !== 'undefined' ? window.localStorage.getItem('kwikmenu-active-venue') : null;

  return (
    <div className="mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <SettingsPageHeader
        title={t('menuImportPage.header.title')}
        description={t('menuImportPage.header.description')}
        actionLabel={null}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8">
          <MenuImportFlow
            venueId={activeVenueId}
            context={{ flow: 'dashboard', trigger: 'menu_create' }}
            introTitle={t('menuImportPage.flow.introTitle')}
            introDescription={t('menuImportPage.flow.introDescription')}
            submitLabel={t('menuImportPage.flow.submitLabel')}
            successTitle={t('menuImportPage.flow.successTitle')}
            successDescription={t('menuImportPage.flow.successDescription')}
            successPrimaryLabel={t('menuImportPage.flow.successPrimaryLabel')}
            successSecondaryLabel={t('menuImportPage.flow.successSecondaryLabel')}
          />
        </section>

        <aside className="space-y-6">
          <section className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
                <WandSparkles size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{t('menuImportPage.sidebar.whatItDoes.title')}</h2>
                <p className="text-sm text-muted-foreground">{t('menuImportPage.sidebar.whatItDoes.subtitle')}</p>
              </div>
            </div>

            <div className="space-y-5 relative before:absolute before:left-[18px] before:top-3 before:bottom-3 before:w-[2px] before:bg-border/60">
              {[
                t('menuImportPage.sidebar.whatItDoes.item1'),
                t('menuImportPage.sidebar.whatItDoes.item2'),
                t('menuImportPage.sidebar.whatItDoes.item3'),
                t('menuImportPage.sidebar.whatItDoes.item4'),
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3.5 items-start relative z-10">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border/70 text-brand-purple text-sm font-bold shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="pt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item}
                  </div>
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
                <h2 className="text-lg font-bold text-foreground">{t('menuImportPage.sidebar.nextStage.title')}</h2>
                <p className="text-sm text-muted-foreground">{t('menuImportPage.sidebar.nextStage.subtitle')}</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('menuImportPage.sidebar.nextStage.description')}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default MenuImportPage;
