import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Store,
  Wifi,
  Paintbrush,
  QrCode,
  Save,
  MapPin,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import SettingsPageHeader from "../components/settings/SettingsPageHeader";
import VenueQrSection from "../components/venue/VenueQrSection";
import {
  formFieldClasses,
  formSelectClasses,
  formTextareaClasses,
} from "../lib/uiStyles";

const VENUE_TABS = [
  { id: 'profile', label: 'Профиль', icon: Store },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'design', label: 'Внешний вид', icon: Paintbrush },
  { id: 'qr', label: 'QR и ссылка', icon: QrCode },
];

const VenuePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = VENUE_TABS.some((tab) => tab.id === requestedTab) ? requestedTab : 'profile';
  const [venueData, setVenueData] = useState({
    name: 'Skuratov Coffee',
    description: 'Собственная обжарка и формат брю-бара: классика, спешлы, сезонные напитки, выпечка, десерты, завтраки и лёгкая еда.',
    phone: '+7 925 323 29 46',
    city: 'Москва',
    country: 'Россия',
    currency: 'RUB (₽)',
  });
  const [wifiData, setWifiData] = useState({
    ssid: 'Skuratov_Guest',
    password: 'coffee2026',
    enabled: true,
  });

  const handleTabChange = (tabId) => {
    const nextParams = new URLSearchParams(searchParams);

    if (tabId === 'profile') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', tabId);
    }

    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="mx-auto space-y-6">
      <SettingsPageHeader
        title="Заведение"
        description="Управляйте профилем заведения, гостевым Wi-Fi и внешним видом меню."
        actionLabel="Сохранить заведение"
        actionIcon={Save}
      />

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
            {VENUE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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

        <main className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          {activeTab === 'profile' && (
            <div className="bg-card border border-border/60 rounded-3xl shadow-sm divide-y divide-border/50">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Название заведения</Label>
                    <Input
                      value={venueData.name}
                      onChange={(e) => setVenueData({ ...venueData, name: e.target.value })}
                      className={formFieldClasses}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Телефон для связи</Label>
                    <Input
                      value={venueData.phone}
                      onChange={(e) => setVenueData({ ...venueData, phone: e.target.value })}
                      className={formFieldClasses}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Описание</Label>
                  <Textarea
                    value={venueData.description}
                    onChange={(e) => setVenueData({ ...venueData, description: e.target.value })}
                    className={formTextareaClasses}
                    placeholder="Расскажите гостям о вашем заведении..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-border/50 pt-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Город</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        value={venueData.city}
                        onChange={(e) => setVenueData({ ...venueData, city: e.target.value })}
                        className={`${formFieldClasses} !pl-10`}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Валюта меню</Label>
                    <div className="relative">
                      <select
                        value={venueData.currency}
                        onChange={(e) => setVenueData({ ...venueData, currency: e.target.value })}
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

          {activeTab === 'wifi' && (
            <div className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-8">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">Гостевой Wi-Fi</h3>
                  <p className="text-sm text-muted-foreground">Показывайте быстрый вход в Wi-Fi прямо в цифровом меню.</p>
                </div>
                <Switch
                  checked={wifiData.enabled}
                  onCheckedChange={(val) => setWifiData({ ...wifiData, enabled: val })}
                  className="data-[state=checked]:bg-brand-purple"
                />
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 transition-opacity ${!wifiData.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Название сети (SSID)</Label>
                  <Input
                    value={wifiData.ssid}
                    onChange={(e) => setWifiData({ ...wifiData, ssid: e.target.value })}
                    className={formFieldClasses}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Пароль</Label>
                  <Input
                    type="password"
                    value={wifiData.password}
                    onChange={(e) => setWifiData({ ...wifiData, password: e.target.value })}
                    className={formFieldClasses}
                  />
                </div>
              </div>

              <div className="p-4 bg-brand-purple/5 border border-brand-purple/20 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center shrink-0 text-brand-purple">
                  <Wifi size={20} />
                </div>
                <p className="text-xs text-brand-purple/80 leading-relaxed">
                  При активации этой функции в меню появится кнопка «Подключиться к Wi‑Fi». Гостям не придётся вводить пароль вручную.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-6">
              <div className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
                <h3 className="text-lg font-bold text-foreground">Внешний вид меню</h3>

                <div className="space-y-4">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Цветовая тема</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {['Светлая', 'Темная', 'Авто', 'Брендовая'].map((theme) => (
                      <button
                        key={theme}
                        className={`p-4 rounded-xl border-2 text-sm font-bold transition-all text-center ${
                          theme === 'Светлая'
                            ? 'border-brand-purple bg-brand-purple/5 text-brand-purple'
                            : 'border-border/40 hover:border-border text-muted-foreground'
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50 space-y-4">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Логотип заведения в меню</Label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-secondary/30 border-2 border-dashed border-input flex items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors">
                      <ImageIcon className="text-muted-foreground" size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold">Загрузите квадратное лого</p>
                      <p className="text-xs text-muted-foreground">Рекомендуемый размер 512x512px, формат PNG или SVG</p>
                      <Button variant="outline" size="sm" className="mt-2 rounded-lg border-border/60 text-[10px] uppercase tracking-wider font-black">Выбрать файл</Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl shadow-xl text-white flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-brand-purple uppercase tracking-widest">Предпросмотр</p>
                  <h4 className="text-lg font-extrabold">Посмотрите, как меню видят гости</h4>
                </div>
                <Button className="h-11 rounded-lg bg-white text-gray-900 hover:bg-gray-100 font-bold gap-2 px-5">
                  Открыть меню
                  <ExternalLink size={16} />
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'qr' && <VenueQrSection />}
        </main>
      </div>
    </div>
  );
};

export default VenuePage;
