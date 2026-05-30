import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Store, Wifi, Paintbrush, ShieldCheck,
  Save, MapPin, CreditCard,
  ExternalLink, Image as ImageIcon
} from 'lucide-react';

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import {
  formFieldClasses,
  formSelectClasses,
  formTextareaClasses,
  primaryActionButtonClasses,
  secondaryActionButtonClasses,
} from "../lib/uiStyles";

const SettingsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');

  // Состояние данных заведения (подтягиваем то, что было в анбординге)
  const [venueData, setVenueData] = useState({
    name: 'Skuratov Coffee',
    description: 'Собственная обжарка и формат брю-бара: классика, спешлы, сезонные напитки, выпечка, десерты, завтраки и лёгкая еда.',
    phone: '+7 925 323 29 46',
    city: 'Москва',
    country: 'Россия',
    currency: 'RUB (₽)',
    language: 'Русский'
  });

  // Состояние Wi-Fi (из нашей структуры JSON)
  const [wifiData, setWifiData] = useState({
    ssid: 'Skuratov_Guest',
    password: 'coffee2026',
    enabled: true
  });

  const tabs = [
    { id: 'profile', label: t('venues.tabs.profile', 'Профиль'), icon: Store },
    { id: 'wifi', label: t('venues.tabs.wifi', 'Wi-Fi'), icon: Wifi },
    { id: 'design', label: t('venues.tabs.design', 'Внешний вид'), icon: Paintbrush },
    { id: 'billing', label: t('settings.tabs.billing', 'Тариф и оплата'), icon: CreditCard },
  ];

  return (
    <div className="mx-auto space-y-6">

      {/* Хедер страницы */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/60 p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{t('settings.title', 'Настройки')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('settings.subtitle', 'Управляйте информацией о заведении и параметрами меню')}</p>
        </div>
        <Button className={`${primaryActionButtonClasses} px-6`}>
          <Save size={18} className="mr-2" />
          {t('settings.saveChanges', 'Сохранить изменения')}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Боковая навигация по табам */}
        <aside className="w-full lg:w-64 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20'
                    : 'text-muted-foreground hover:bg-card hover:text-foreground border border-transparent'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Основной контент табов */}
        <main className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">

          {/* ТАБ: ПРОФИЛЬ */}
          {activeTab === 'profile' && (
            <div className="bg-card border border-border/60 rounded-3xl shadow-sm divide-y divide-border/50">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.fields.name', 'Название заведения')}</Label>
                    <Input
                      value={venueData.name}
                      onChange={(e) => setVenueData({...venueData, name: e.target.value})}
                      className={formFieldClasses}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.fields.phone', 'Телефон для связи')}</Label>
                    <Input
                      value={venueData.phone}
                      onChange={(e) => setVenueData({...venueData, phone: e.target.value})}
                      className={formFieldClasses}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.fields.description', 'Описание')}</Label>
                  <Textarea
                    value={venueData.description}
                    onChange={(e) => setVenueData({...venueData, description: e.target.value})}
                    className={formTextareaClasses}
                    placeholder={t('venues.fields.descriptionPlaceholder', 'Расскажите гостям о вашем заведении...')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-border/50 pt-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.fields.city', 'Город')}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        value={venueData.city}
                        onChange={(e) => setVenueData({...venueData, city: e.target.value})}
                        className={`${formFieldClasses} pl-10`}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.fields.currency', 'Валюта меню')}</Label>
                    <div className="relative">
                      <select
                        value={venueData.currency}
                        onChange={(e) => setVenueData({...venueData, currency: e.target.value})}
                        className={formSelectClasses}
                      >
                        <option value="RUB (₽)">RUB (₽)</option>
                        <option value="USD ($)">USD ($)</option>
                        <option value="AED (DH)">AED (DH)</option>
                        <option value="EUR (€)">EUR (€)</option>
                      </select>
                      <div className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ТАБ: WI-FI */}
          {activeTab === 'wifi' && (
            <div className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">{t('venues.wifi.title', 'Гостевой Wi-Fi')}</h3>
                  <p className="text-sm text-muted-foreground">{t('venues.wifi.subtitle', 'Данные будут отображаться in menu для быстрого подключения гостей')}</p>
                </div>
                <Switch
                  checked={wifiData.enabled}
                  onCheckedChange={(val) => setWifiData({...wifiData, enabled: val})}
                  className="data-[state=checked]:bg-brand-purple"
                />
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 transition-opacity ${!wifiData.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.wifi.ssid', 'Название сети (SSID)')}</Label>
                  <Input
                    value={wifiData.ssid}
                    onChange={(e) => setWifiData({...wifiData, ssid: e.target.value})}
                    placeholder={t('venues.wifi.ssidPlaceholder', 'Например: Guest_WiFi')}
                    className={formFieldClasses}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.wifi.password', 'Пароль')}</Label>
                  <Input
                    type="password"
                    value={wifiData.password}
                    onChange={(e) => setWifiData({...wifiData, password: e.target.value})}
                    placeholder={t('venues.wifi.passwordPlaceholder', 'Введите пароль')}
                    className={formFieldClasses}
                  />
                </div>
              </div>

              <div className="p-4 bg-brand-purple/5 border border-brand-purple/20 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center shrink-0 text-brand-purple">
                  <Wifi size={20} />
                </div>
                <p className="text-xs text-brand-purple/80 leading-relaxed mt-3">
                  {t('venues.wifi.hint', 'При активации этой функции в вашем цифровом меню появится кнопка «Подключиться к Wi-Fi». Гостям не нужно будет вводить пароль вручную — всё произойдет автоматически.')}
                </p>
              </div>
            </div>
          )}

          {/* ТАБ: ВНЕШНИЙ ВИД (DESIGN) */}
          {activeTab === 'design' && (
            <div className="space-y-6">
              <div className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
                <h3 className="text-lg font-bold text-foreground">{t('venues.design.title', 'Дизайн меню')}</h3>

                <div className="space-y-4">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.design.colorTheme', 'Цветовая тема')}</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      ['Светлая', 'venues.design.themes.light', 'Светлая'],
                      ['Темная', 'venues.design.themes.dark', 'Темная'],
                      ['Авто', 'venues.design.themes.auto', 'Авто'],
                      ['Брендовая', 'venues.design.themes.brand', 'Брендовая']
                    ].map(([themeKey, translationKey, defaultVal]) => (
                      <button
                        key={themeKey}
                        className={`p-4 rounded-xl border-2 text-sm font-bold transition-all text-center ${
                          themeKey === 'Светлая' ? 'border-brand-purple bg-brand-purple/5 text-brand-purple' : 'border-border/40 hover:border-border text-muted-foreground'
                        }`}
                      >
                        {t(translationKey, defaultVal)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50 space-y-4">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.design.logoLabel', 'Логотип заведения в меню')}</Label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-secondary/30 border-2 border-dashed border-input flex items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors">
                      <ImageIcon className="text-muted-foreground" size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold">{t('venues.design.logoUploadTitle', 'Загрузите квадратное лого')}</p>
                      <p className="text-xs text-muted-foreground">{t('venues.design.logoUploadDesc', 'Рекомендуемый размер 512x512px, формат PNG или SVG')}</p>
                      <Button variant="outline" size="sm" className="mt-2 rounded-lg border-border/60 text-[10px] uppercase tracking-wider font-black">
                        {t('venues.design.btnSelectFile', 'Выбрать файл')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl shadow-xl text-white flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-brand-purple uppercase tracking-widest">{t('venues.design.previewLabel', 'Предпросмотр')}</p>
                  <h4 className="text-lg font-extrabold">{t('venues.design.previewTitle', 'Посмотрите, как меню видят гости')}</h4>
                </div>
                <Button className="h-11 rounded-lg bg-white text-gray-900 hover:bg-gray-100 font-bold gap-2 px-5">
                  {t('venues.design.btnOpenMenu', 'Открыть меню')}
                  <ExternalLink size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* ТАБ: ТАРИФ (BILLING) */}
          {activeTab === 'billing' && (
            <div className="bg-card border border-border/60 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 bg-brand-purple/5 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-purple text-white flex items-center justify-center shadow-lg shadow-brand-purple/20">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-foreground">{t('settings.billing.proTariff', 'PRO Тариф')}</h3>
                    <p className="text-sm text-brand-purple font-bold">{t('settings.billing.activeUntil', 'Активен до {{date}}', { date: '24.06.2026' })}</p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-2xl font-black text-foreground">990 ₽ <span className="text-sm text-muted-foreground font-medium">{t('billing.perMonth', '/ мес')}</span></p>
                </div>
              </div>
              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-foreground">{t('settings.billing.advantages', 'Ваши преимущества:')}</h4>
                  <ul className="space-y-3">
                    {[
                      t('settings.billing.features.0', 'Неограниченное количество блюд и категорий'),
                      t('settings.billing.features.1', 'Кастомизация дизайна QR-кодов и меню'),
                      t('settings.billing.features.2', 'Приоритетная поддержка 24/7'),
                      t('settings.billing.features.3', 'Аналитика просмотров и кликов')
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className={`flex-1 ${secondaryActionButtonClasses}`}>
                    {t('settings.billing.invoices', 'Квитанции и чеки')}
                  </Button>
                  <Button variant="destructive" className="flex-1 h-10 sm:h-12 rounded-lg font-bold bg-red-500/10 text-red-500 border-none hover:bg-red-500/20">
                    {t('settings.billing.cancelSubscription', 'Отменить подписку')}
                  </Button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
