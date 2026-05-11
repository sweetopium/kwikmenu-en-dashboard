import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Store,
  Wifi,
  Paintbrush,
  QrCode,
  Save,
  MapPin,
  ExternalLink,
  Image as ImageIcon,
  LayoutTemplate,
  Palette,
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
  primaryActionButtonClasses,
} from "../lib/uiStyles";
import { TOP_CURRENCIES } from "../lib/currencyMeta";
import {
  getVenue,
  getVenueSettings,
  updateVenueDesign,
  updateVenueProfile,
  updateVenueQr,
  updateVenueWifi,
} from "../lib/venuesApi";

const VENUE_TABS = [
  { id: 'profile', label: 'Профиль', mobileLabel: 'Профиль', icon: Store },
  { id: 'wifi', label: 'Wi-Fi', mobileLabel: 'Wi‑Fi', icon: Wifi },
  { id: 'design', label: 'Внешний вид', mobileLabel: 'Вид', icon: Paintbrush },
  { id: 'qr', label: 'QR и ссылка', mobileLabel: 'QR', icon: QrCode },
];

const EMPTY_VENUE = {
  name: '',
  description: '',
  phone: '',
  city: '',
  country: '',
  currency: 'RUB',
  publicUrl: '',
};

const EMPTY_WIFI = {
  ssid: '',
  password: '',
  enabled: false,
};

const EMPTY_DESIGN = {
  template: 'classic',
  accentColor: '#6d67eb',
  logoUrl: null,
};

const EMPTY_QR = {
  venueId: '',
  style: 'rounded',
  color: '#863bff',
  logoUrl: null,
  hasFrame: true,
  frameText: 'СКАНИРУЙ МЕНЮ',
  frameColor: '#08060d',
  publicMenuEnabled: true,
  publicPath: '',
  publicUrl: '',
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const VenuePage = () => {
  const { id: venueId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = VENUE_TABS.some((tab) => tab.id === requestedTab) ? requestedTab : 'profile';

  const [venueData, setVenueData] = useState(EMPTY_VENUE);
  const [wifiData, setWifiData] = useState(EMPTY_WIFI);
  const [designData, setDesignData] = useState(EMPTY_DESIGN);
  const [qrData, setQrData] = useState(EMPTY_QR);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingState, setSavingState] = useState({
    profile: false,
    wifi: false,
    design: false,
    qr: false,
  });

  const templateOptions = useMemo(
    () => [
      { id: 'classic', label: 'Классический' },
      { id: 'minimal', label: 'Продвинутый' },
      { id: 'accent', label: 'Премиум' },
    ],
    [],
  );

  const accentColors = useMemo(
    () => ['#6d67eb', '#111827', '#ef4444', '#f97316', '#22c55e', '#0ea5e9', '#ec4899', '#a855f7'],
    [],
  );

  const handleTabChange = (tabId) => {
    const nextParams = new URLSearchParams(searchParams);

    if (tabId === 'profile') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', tabId);
    }

    setSearchParams(nextParams, { replace: true });
  };

  const applyVenuePayload = (venue, settings) => {
    setVenueData({
      name: venue.name || '',
      description: venue.description || '',
      phone: venue.phone || '',
      city: venue.city || '',
      country: venue.country || '',
      currency: venue.currency || settings?.currency || 'RUB',
      publicUrl: venue.publicUrl || settings?.qr?.publicUrl || '',
    });

    if (settings) {
      setWifiData({
        ssid: settings.wifi?.ssid || '',
        password: settings.wifi?.password || '',
        enabled: Boolean(settings.wifi?.enabled),
      });
      setDesignData({
        template: settings.design?.template || 'classic',
        accentColor: settings.design?.accentColor || '#6d67eb',
        logoUrl: settings.design?.logoUrl || null,
      });
      setQrData({
        venueId: settings.venueId || venue.id,
        style: settings.qr?.style || 'rounded',
        color: settings.qr?.color || '#863bff',
        logoUrl: settings.qr?.logoUrl || null,
        hasFrame: settings.qr?.hasFrame ?? true,
        frameText: settings.qr?.frameText || 'СКАНИРУЙ МЕНЮ',
        frameColor: settings.qr?.frameColor || '#08060d',
        publicMenuEnabled: settings.qr?.publicMenuEnabled ?? true,
        publicPath: settings.qr?.publicPath || '',
        publicUrl: settings.qr?.publicUrl || venue.publicUrl || '',
      });
    }
  };

  const loadVenue = async () => {
    if (!venueId) {
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const [venue, settings] = await Promise.all([
        getVenue(venueId),
        getVenueSettings(venueId),
      ]);
      applyVenuePayload(venue, settings);
    } catch (nextError) {
      setError(nextError.message || 'Не удалось загрузить заведение.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVenue();
  }, [venueId]);

  const setSaving = (key, value) => {
    setSavingState((current) => ({ ...current, [key]: value }));
  };

  const handleSaveProfile = async () => {
    if (!venueId) {
      return;
    }

    setSaving('profile', true);
    setError('');
    try {
      const venue = await updateVenueProfile(venueId, {
        name: venueData.name,
        description: venueData.description || null,
        phone: venueData.phone || null,
        city: venueData.city || null,
        country: venueData.country || null,
        currency: venueData.currency || 'RUB',
      });
      setVenueData((current) => ({
        ...current,
        name: venue.name || '',
        description: venue.description || '',
        phone: venue.phone || '',
        city: venue.city || '',
        country: venue.country || '',
        currency: venue.currency || 'RUB',
        publicUrl: venue.publicUrl || current.publicUrl,
      }));
    } catch (nextError) {
      setError(nextError.message || 'Не удалось сохранить профиль заведения.');
    } finally {
      setSaving('profile', false);
    }
  };

  const handleSaveWifi = async () => {
    if (!venueId) {
      return;
    }

    setSaving('wifi', true);
    setError('');
    try {
      const settings = await updateVenueWifi(venueId, {
        enabled: wifiData.enabled,
        ssid: wifiData.ssid || null,
        password: wifiData.password || null,
      });
      setWifiData({
        ssid: settings.wifi?.ssid || '',
        password: settings.wifi?.password || '',
        enabled: Boolean(settings.wifi?.enabled),
      });
    } catch (nextError) {
      setError(nextError.message || 'Не удалось сохранить Wi‑Fi настройки.');
    } finally {
      setSaving('wifi', false);
    }
  };

  const handleSaveDesign = async () => {
    if (!venueId) {
      return;
    }

    setSaving('design', true);
    setError('');
    try {
      const settings = await updateVenueDesign(venueId, {
        template: designData.template,
        accentColor: designData.accentColor,
        logoUrl: designData.logoUrl || null,
      });
      setDesignData({
        template: settings.design?.template || 'classic',
        accentColor: settings.design?.accentColor || '#6d67eb',
        logoUrl: settings.design?.logoUrl || null,
      });
    } catch (nextError) {
      setError(nextError.message || 'Не удалось сохранить внешний вид.');
    } finally {
      setSaving('design', false);
    }
  };

  const handleSaveQr = async () => {
    if (!venueId) {
      return;
    }

    setSaving('qr', true);
    setError('');
    try {
      const settings = await updateVenueQr(venueId, {
        style: qrData.style,
        color: qrData.color,
        logoUrl: qrData.logoUrl || null,
        hasFrame: qrData.hasFrame,
        frameText: qrData.frameText,
        frameColor: qrData.frameColor,
        publicMenuEnabled: qrData.publicMenuEnabled,
      });
      setQrData({
        venueId: settings.venueId,
        style: settings.qr?.style || 'rounded',
        color: settings.qr?.color || '#863bff',
        logoUrl: settings.qr?.logoUrl || null,
        hasFrame: settings.qr?.hasFrame ?? true,
        frameText: settings.qr?.frameText || 'СКАНИРУЙ МЕНЮ',
        frameColor: settings.qr?.frameColor || '#08060d',
        publicMenuEnabled: settings.qr?.publicMenuEnabled ?? true,
        publicPath: settings.qr?.publicPath || '',
        publicUrl: settings.qr?.publicUrl || '',
      });
      setVenueData((current) => ({
        ...current,
        publicUrl: settings.qr?.publicUrl || current.publicUrl,
      }));
    } catch (nextError) {
      setError(nextError.message || 'Не удалось сохранить QR-настройки.');
    } finally {
      setSaving('qr', false);
    }
  };

  const handleDesignLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    if (dataUrl) {
      setDesignData((current) => ({ ...current, logoUrl: dataUrl }));
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto space-y-6">
        <SettingsPageHeader
          title="Заведение"
          description="Загружаем профиль заведения, Wi‑Fi и публичную ссылку."
          actionLabel={null}
        />
        <div className="bg-card border border-border/60 rounded-3xl shadow-sm p-8 text-sm text-muted-foreground">
          Загружаем данные заведения...
        </div>
      </div>
    );
  }

  if (error && !venueData.name && !qrData.publicUrl) {
    return (
      <div className="mx-auto space-y-6">
        <SettingsPageHeader
          title="Заведение"
          description="Управляйте профилем заведения, гостевым Wi‑Fi и внешним видом меню."
          actionLabel={null}
        />
        <div className="bg-card border border-destructive/20 rounded-3xl shadow-sm p-8 space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={loadVenue}>
            Повторить загрузку
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      <SettingsPageHeader
        title="Заведение"
        description="Управляйте профилем заведения, гостевым Wi‑Fi и внешним видом меню."
        actionLabel={null}
      />

      <div className="space-y-6">
        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-4 gap-2 bg-secondary/30 p-1 rounded-xl border border-input/50">
          {VENUE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center justify-center gap-2 px-2 sm:px-4 h-10 sm:h-11 rounded-lg text-[11px] sm:text-sm font-medium transition-all min-w-0 ${
                activeTab === tab.id
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon size={16} className="hidden sm:block shrink-0" />
              <span className="truncate sm:hidden">{tab.mobileLabel}</span>
              <span className="truncate hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>

        <main className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
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
                        {TOP_CURRENCIES.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.flag} {currency.code} ({currency.symbol})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={savingState.profile} className={`${primaryActionButtonClasses} px-5`}>
                    <Save size={18} className="mr-2" />
                    {savingState.profile ? 'Сохраняем...' : 'Сохранить профиль'}
                  </Button>
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

              <div className="pt-4 border-t border-border/50 flex justify-end">
                <Button onClick={handleSaveWifi} disabled={savingState.wifi} className={`${primaryActionButtonClasses} px-5`}>
                  <Save size={18} className="mr-2" />
                  {savingState.wifi ? 'Сохраняем...' : 'Сохранить Wi‑Fi'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-6">
              <div className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
                <h3 className="text-lg font-bold text-foreground">Внешний вид меню</h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center shrink-0">
                      <LayoutTemplate size={18} />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Шаблон меню</Label>
                      <p className="text-sm text-muted-foreground mt-1">Выберите базовую визуальную подачу меню.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {templateOptions.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setDesignData({ ...designData, template: template.id })}
                        className={`p-4 rounded-xl border-2 text-sm font-bold transition-all text-center ${
                          designData.template === template.id
                            ? 'border-brand-purple bg-brand-purple/5 text-brand-purple'
                            : 'border-border/40 hover:border-border text-muted-foreground'
                        }`}
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center shrink-0">
                      <Palette size={18} />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Акцентный цвет</Label>
                      <p className="text-sm text-muted-foreground mt-1">Используется для кнопок, активных состояний и ссылок.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {accentColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setDesignData({ ...designData, accentColor: color })}
                        className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 ${
                          designData.accentColor === color ? 'border-foreground shadow-md' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}

                    <label className="w-9 h-9 rounded-full border-2 border-border/60 overflow-hidden cursor-pointer shadow-sm relative">
                      <input
                        type="color"
                        value={designData.accentColor}
                        onChange={(e) => setDesignData({ ...designData, accentColor: e.target.value })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-full h-full" style={{ backgroundColor: designData.accentColor }} />
                    </label>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50 space-y-4">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Логотип заведения в меню</Label>
                  <div className="flex items-center gap-6">
                    <label className="w-24 h-24 rounded-2xl bg-secondary/30 border-2 border-dashed border-input flex items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors overflow-hidden">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleDesignLogoUpload}
                        className="hidden"
                      />
                      {designData.logoUrl ? (
                        <img src={designData.logoUrl} alt="Логотип заведения" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="text-muted-foreground" size={32} />
                      )}
                    </label>
                    <div className="space-y-1">
                      <p className="text-sm font-bold">Загрузите квадратное лого</p>
                      <p className="text-xs text-muted-foreground">Рекомендуемый размер 512x512px, формат PNG или SVG</p>
                      <Button variant="outline" size="sm" className="mt-2 rounded-lg border-border/60 text-[10px] uppercase tracking-wider font-black">
                        Выбрать файл
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 flex justify-end">
                  <Button onClick={handleSaveDesign} disabled={savingState.design} className={`${primaryActionButtonClasses} px-5`}>
                    <Save size={18} className="mr-2" />
                    {savingState.design ? 'Сохраняем...' : 'Сохранить внешний вид'}
                  </Button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl shadow-xl text-white flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-brand-purple uppercase tracking-widest">Предпросмотр</p>
                  <h4 className="text-lg font-extrabold">Посмотрите, как меню видят гости</h4>
                </div>
                <a
                  href={qrData.publicUrl || venueData.publicUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center h-11 rounded-lg bg-white px-5 text-gray-900 hover:bg-gray-100 font-bold gap-2 transition-colors"
                >
                  Открыть меню
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <VenueQrSection
              value={qrData}
              onChange={setQrData}
              onSave={handleSaveQr}
              isSaving={savingState.qr}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default VenuePage;
