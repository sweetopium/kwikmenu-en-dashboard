import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  Globe,
  Plus,
} from 'lucide-react';

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { CountryField, DialPhoneField, formatPhoneByDial, stripPhoneDigits } from "../components/onboarding/CountryDialFields";
import { COUNTRIES } from "../components/onboarding/countries";
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
import { trackProductEvent } from "../lib/productAnalytics";
import { createImageUploadUrl, uploadFileToPresignedUrl } from "../lib/mediaApi";

const VENUE_TABS = [
  { id: 'profile', label: 'Profile', mobileLabel: 'Profile', icon: Store },
  { id: 'wifi', label: 'Wi-Fi', mobileLabel: 'Wi‑Fi', icon: Wifi },
  { id: 'design', label: 'Appearance', mobileLabel: 'Design', icon: Paintbrush },
  { id: 'qr', label: 'QR & link', mobileLabel: 'QR', icon: QrCode },
];

const EMPTY_VENUE = {
  name: '',
  description: '',
  phone: '',
  city: '',
  country: '',
  instagramUrl: '',
  websiteUrl: '',
  addressLine: '',
  businessHoursText: '',
  currency: 'USD',
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
  branded: {
    coverImageUrl: null,
    secondaryColor: '#d49a5b',
    showPromo: true,
    showFeatured: true,
    showSearch: true,
    showAbout: true,
    showKwikMenuBranding: true,
  },
};

const EMPTY_QR = {
  venueId: '',
  style: 'rounded',
  color: '#863bff',
  logoUrl: null,
  hasFrame: true,
  frameText: 'SCAN MENU',
  frameColor: '#08060d',
  publicMenuEnabled: true,
  publicPath: '',
  publicUrl: '',
};

const DEFAULT_PHONE_COUNTRY = COUNTRIES[0];

const resolvePhoneParts = (phone) => {
  const normalizedPhone = `${phone || ''}`.trim();
  const matchedCountry = COUNTRIES
    .slice()
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((country) => normalizedPhone.startsWith(country.dial));

  const country = matchedCountry || DEFAULT_PHONE_COUNTRY;
  const localPhone = normalizedPhone.startsWith(country.dial)
    ? normalizedPhone.slice(country.dial.length).trim()
    : normalizedPhone;

  return {
    selectedCountryId: country.id,
    selectedDial: country.dial,
    localPhone: formatPhoneByDial(localPhone, country.dial),
  };
};

const buildFullPhone = ({ selectedDial, localPhone }) => {
  const digits = stripPhoneDigits(localPhone);
  return digits ? `${selectedDial} ${localPhone}`.trim() : '';
};

const VenuePage = () => {
  const { t } = useTranslation();
  const { id: venueId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = VENUE_TABS.some((tab) => tab.id === requestedTab) ? requestedTab : 'profile';

  const [venueData, setVenueData] = useState(EMPTY_VENUE);
  const [phoneCountryId, setPhoneCountryId] = useState(DEFAULT_PHONE_COUNTRY.id);
  const [phoneDial, setPhoneDial] = useState(DEFAULT_PHONE_COUNTRY.dial);
  const [phoneLocalNumber, setPhoneLocalNumber] = useState('');
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
      {
        id: 'classic',
        label: t('venues.design.templates.classic', 'Classic'),
        demoUrl: null,
      },
      {
        id: 'minimal',
        label: t('venues.design.templates.minimal', 'Advanced'),
        demoUrl: null,
      },
      {
        id: 'accent',
        label: t('venues.design.templates.accent', 'Branded'),
        demoUrl: null,
      },
    ],
    [t],
  );

  const accentColors = useMemo(
    () => ['#6d67eb', '#111827', '#ef4444', '#f97316', '#22c55e', '#0ea5e9', '#ec4899', '#a855f7'],
    [],
  );

  const handlePhoneDialChange = (nextDial) => {
    setPhoneDial(nextDial);
    setPhoneLocalNumber((currentPhone) => formatPhoneByDial(currentPhone, nextDial));
  };

  const handleVenueCountryChange = (countryId) => {
    const country = COUNTRIES.find((item) => item.id === countryId);
    if (!country) {
      return;
    }

    setVenueData((current) => ({
      ...current,
      country: country.id,
      currency: country.currency,
    }));
    setPhoneCountryId(country.id);
    handlePhoneDialChange(country.dial);
  };

  const handleTabChange = (tabId) => {
    trackProductEvent('venue_tab_changed', {
      venueId,
      properties: { tab: tabId },
    });
    const nextParams = new URLSearchParams(searchParams);

    if (tabId === 'profile') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', tabId);
    }

    setSearchParams(nextParams, { replace: true });
  };

  const applyVenuePayload = (venue, settings) => {
    const phoneParts = resolvePhoneParts(venue.phone);
    setVenueData({
      name: venue.name || '',
      description: venue.description || '',
      phone: venue.phone || '',
      city: venue.city || '',
      country: venue.country || '',
      instagramUrl: venue.instagramUrl || '',
      websiteUrl: venue.websiteUrl || '',
      addressLine: venue.addressLine || '',
      businessHoursText: venue.businessHoursText || '',
      currency: venue.currency || settings?.currency || 'USD',
      publicUrl: venue.publicUrl || settings?.qr?.publicUrl || '',
    });
    setPhoneCountryId(phoneParts.selectedCountryId);
    setPhoneDial(phoneParts.selectedDial);
    setPhoneLocalNumber(phoneParts.localPhone);

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
        branded: { ...EMPTY_DESIGN.branded, ...(settings.design?.branded || {}) },
      });
      setQrData({
        venueId: settings.venueId || venue.id,
        style: settings.qr?.style || 'rounded',
        color: settings.qr?.color || '#863bff',
        logoUrl: settings.qr?.logoUrl || null,
        hasFrame: settings.qr?.hasFrame ?? true,
        frameText: settings.qr?.frameText || 'SCAN MENU',
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
      trackProductEvent('venue_opened', {
        venueId,
        properties: { active_tab: activeTab },
      });
    } catch (nextError) {
      setError(nextError.message || t('venues.errors.loadFailed', 'Failed to load venue.'));
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
        phone: buildFullPhone({ selectedDial: phoneDial, localPhone: phoneLocalNumber }) || null,
        city: venueData.city || null,
        country: venueData.country || null,
        instagramUrl: venueData.instagramUrl || null,
        websiteUrl: venueData.websiteUrl || null,
        addressLine: venueData.addressLine || null,
        businessHoursText: venueData.businessHoursText || null,
        currency: venueData.currency || 'USD',
      });
      const phoneParts = resolvePhoneParts(venue.phone);
      setVenueData((current) => ({
        ...current,
        name: venue.name || '',
        description: venue.description || '',
        phone: venue.phone || '',
        city: venue.city || '',
        country: venue.country || '',
        instagramUrl: venue.instagramUrl || '',
        websiteUrl: venue.websiteUrl || '',
        addressLine: venue.addressLine || '',
        businessHoursText: venue.businessHoursText || '',
        currency: venue.currency || 'USD',
        publicUrl: venue.publicUrl || current.publicUrl,
      }));
      setPhoneCountryId(phoneParts.selectedCountryId);
      setPhoneDial(phoneParts.selectedDial);
      setPhoneLocalNumber(phoneParts.localPhone);
    } catch (nextError) {
      setError(nextError.message || t('venues.errors.saveProfileFailed', 'Failed to save venue profile.'));
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
      setError(nextError.message || t('venues.errors.saveWifiFailed', 'Failed to save Wi-Fi settings.'));
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
        branded: designData.branded,
      });
      setDesignData({
        template: settings.design?.template || 'classic',
        accentColor: settings.design?.accentColor || '#6d67eb',
        logoUrl: settings.design?.logoUrl || null,
        branded: { ...EMPTY_DESIGN.branded, ...(settings.design?.branded || {}) },
      });
    } catch (nextError) {
      setError(nextError.message || t('venues.errors.saveDesignFailed', 'Failed to save menu appearance.'));
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
        frameText: settings.qr?.frameText || 'SCAN MENU',
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
      setError(nextError.message || t('venues.errors.saveQrFailed', 'Failed to save QR settings.'));
    } finally {
      setSaving('qr', false);
    }
  };

  const handleDesignLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving('design', true);
    setError('');
    try {
      const target = await createImageUploadUrl({ filename: file.name, contentType: file.type, assetType: 'venue-logo' });
      await uploadFileToPresignedUrl({ uploadUrl: target.uploadUrl, headers: target.headers, file });
      setDesignData((current) => ({ ...current, logoUrl: target.publicUrl }));
    } catch (nextError) {
      setError(nextError.message || 'Failed to upload logo.');
    } finally {
      setSaving('design', false);
      event.target.value = '';
    }
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving('design', true);
    setError('');
    try {
      const uploadTarget = await createImageUploadUrl({ filename: file.name, contentType: file.type, assetType: 'venue-cover' });
      await uploadFileToPresignedUrl({ uploadUrl: uploadTarget.uploadUrl, headers: uploadTarget.headers, file });
      setDesignData((current) => ({
        ...current,
        branded: { ...current.branded, coverImageUrl: uploadTarget.publicUrl },
      }));
    } catch (nextError) {
      setError(nextError.message || 'Failed to upload cover image.');
    } finally {
      setSaving('design', false);
      event.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto space-y-6">
        <SettingsPageHeader
          title={t('venues.pageTitle', 'Venue')}
          description={t('venues.loadingProfileDesc', 'Loading venue profile, Wi-Fi, and public link.')}
          actionLabel={null}
        />
        <div className="bg-card border border-border/60 rounded-3xl shadow-sm p-8 text-sm text-muted-foreground">
          {t('venues.loadingData', 'Loading venue data...')}
        </div>
      </div>
    );
  }

  if (error && !venueData.name && !qrData.publicUrl) {
    return (
      <div className="mx-auto space-y-6">
        <SettingsPageHeader
          title={t('venues.pageTitle', 'Venue')}
          description={t('venues.pageSubtitle', 'Manage venue profile, guest Wi-Fi, and menu appearance.')}
          actionLabel={null}
        />
        <div className="bg-card border border-destructive/20 rounded-3xl shadow-sm p-8 space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={loadVenue}>
            {t('venues.retryBtn', 'Retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      <SettingsPageHeader
        title={t('venues.pageTitle', 'Venue')}
        description={t('venues.pageSubtitle', 'Manage venue profile, guest Wi-Fi, and menu appearance.')}
        actionLabel={null}
      />

      <div className="space-y-6">
        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-4 gap-2 bg-secondary/30 p-1 rounded-xl border border-input/50">
          {(() => {
            const tabLabels = {
              profile: { label: t('venues.tabs.profile', 'Profile'), mobile: t('venues.tabs.profileMobile', 'Profile') },
              wifi: { label: t('venues.tabs.wifi', 'Wi-Fi'), mobile: t('venues.tabs.wifiMobile', 'Wi‑Fi') },
              design: { label: t('venues.tabs.design', 'Appearance'), mobile: t('venues.tabs.designMobile', 'Design') },
              qr: { label: t('venues.tabs.qr', 'QR & link'), mobile: t('venues.tabs.qrMobile', 'QR') }
            };
            return VENUE_TABS.map((tab) => (
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
                <span className="truncate sm:hidden">{tabLabels[tab.id].mobile}</span>
                <span className="truncate hidden sm:block">{tabLabels[tab.id].label}</span>
              </button>
            ));
          })()}
        </div>

        <main className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          {activeTab === 'profile' && (
            <div className="bg-card border border-border/60 rounded-3xl shadow-sm divide-y divide-border/50">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.fields.name', 'Venue name')}</Label>
                    <Input
                      value={venueData.name}
                      onChange={(e) => setVenueData({ ...venueData, name: e.target.value })}
                      className={formFieldClasses}
                    />
                  </div>
                  <div className="space-y-2">
                    <DialPhoneField
                      label={t('venues.fields.phone', 'Contact phone')}
                      phone={phoneLocalNumber}
                      selectedDial={phoneDial}
                      selectedCountryId={phoneCountryId}
                      onCountryChange={setPhoneCountryId}
                      onDialChange={handlePhoneDialChange}
                      onPhoneChange={setPhoneLocalNumber}
                      labelClassName="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      inputClassName={formFieldClasses}
                      selectClassName={formFieldClasses}
                      selectWrapperClassName="w-[92px] sm:w-[108px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.fields.description', 'Description')}</Label>
                  <Textarea
                    value={venueData.description}
                    onChange={(e) => setVenueData({ ...venueData, description: e.target.value })}
                    className={formTextareaClasses}
                    placeholder={t('venues.fields.descriptionPlaceholder', 'Tell guests about your venue...')}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.fields.instagram', 'Website / social link')}</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      value={venueData.instagramUrl}
                      onChange={(e) => setVenueData({ ...venueData, instagramUrl: e.target.value })}
                      className={`${formFieldClasses} !pl-10`}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Website</Label><Input value={venueData.websiteUrl} onChange={(event) => setVenueData({ ...venueData, websiteUrl: event.target.value })} className={formFieldClasses} placeholder="https://restaurant.com" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Opening hours</Label><Input value={venueData.businessHoursText} onChange={(event) => setVenueData({ ...venueData, businessHoursText: event.target.value })} className={formFieldClasses} placeholder="Daily 09:00–23:00" /></div>
                </div>
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full address</Label><Input value={venueData.addressLine} onChange={(event) => setVenueData({ ...venueData, addressLine: event.target.value })} className={formFieldClasses} placeholder="Street, building, district" /></div>

                <div className="grid grid-cols-1 gap-6 border-t border-border/50 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.fields.city', 'City')}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        value={venueData.city}
                        onChange={(e) => setVenueData({ ...venueData, city: e.target.value })}
                        className={`${formFieldClasses} !pl-10`}
                      />
                    </div>
                  </div>
                  <CountryField
                    selectedCountry={venueData.country}
                    onCountryChange={handleVenueCountryChange}
                    label={t('venues.fields.country', 'Country')}
                    labelClassName="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    selectClassName={formSelectClasses}
                  />
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.fields.currency', 'Menu currency')}</Label>
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
                    {savingState.profile ? t('common.saving', 'Saving...') : t('venues.btnSaveProfile', 'Save profile')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wifi' && (
            <div className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-8">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">{t('venues.wifi.title', 'Guest Wi-Fi')}</h3>
                  <p className="text-sm text-muted-foreground">{t('venues.wifi.subtitle', 'Show quick Wi-Fi access directly in the digital menu.')}</p>
                </div>
                <Switch
                  checked={wifiData.enabled}
                  onCheckedChange={(val) => setWifiData({ ...wifiData, enabled: val })}
                  className="data-[state=checked]:bg-brand-purple"
                />
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 transition-opacity ${!wifiData.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.wifi.ssid', 'Network name (SSID)')}</Label>
                  <Input
                    value={wifiData.ssid}
                    onChange={(e) => setWifiData({ ...wifiData, ssid: e.target.value })}
                    className={formFieldClasses}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.wifi.password', 'Password')}</Label>
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
                <p className="text-xs text-brand-purple/80 leading-relaxed mt-3">
                  {t('venues.wifi.hint', 'When enabled, the menu will show a Wi-Fi connection button. Guests will not need to type the password manually.')}
                </p>
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end">
                <Button onClick={handleSaveWifi} disabled={savingState.wifi} className={`${primaryActionButtonClasses} px-5`}>
                  <Save size={18} className="mr-2" />
                  {savingState.wifi ? t('common.saving', 'Saving...') : t('venues.btnSaveWifi', 'Save Wi-Fi')}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-6">
              <div className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
                <h3 className="text-lg font-bold text-foreground">{t('venues.design.title', 'Menu appearance')}</h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center shrink-0">
                      <LayoutTemplate size={18} />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.design.templateLabel', 'Menu template')}</Label>
                      <p className="text-sm text-muted-foreground mt-1">{t('venues.design.templateDesc', 'Choose the base visual style for the menu.')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {templateOptions.map((template) => (
                      (() => {
                        const isDisabled = false;
                        const isSelected = designData.template === template.id;

                        return (
                          <div
                            key={template.id}
                            onClick={isDisabled ? undefined : () => setDesignData({ ...designData, template: template.id })}
                            className={`relative p-4 rounded-xl border-2 text-center flex items-center justify-center min-h-[56px] sm:min-h-[62px] transition-all select-none ${
                              isDisabled
                                ? 'border-border/40 bg-muted/40 text-muted-foreground/70 cursor-not-allowed'
                                : 'cursor-pointer ' + (isSelected
                                  ? 'border-brand-purple bg-brand-purple/5 text-brand-purple'
                                  : 'border-border/40 hover:border-border text-muted-foreground')
                            }`}
                          >
                            <span className="text-sm font-bold">{template.label}</span>
                            {template.demoUrl && (
                              <a
                                href={template.demoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="absolute -top-3 right-6 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f3f0ff] dark:bg-zinc-800 text-brand-purple border border-brand-purple/20 hover:bg-brand-purple hover:text-white hover:border-brand-purple transition-all flex items-center gap-0.5 active:scale-95"
                              >
                                <span>{t('venues.design.viewDemo', 'Demo')}</span>
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        );
                      })()
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center shrink-0">
                      <Palette size={18} />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.design.colorLabel', 'Accent color')}</Label>
                      <p className="text-sm text-muted-foreground mt-1">{t('venues.design.colorDesc', 'Used for buttons, active states, and links.')}</p>
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

                    <label className="w-9 h-9 rounded-full border-2 border-border/60 overflow-hidden cursor-pointer shadow-sm relative flex items-center justify-center bg-muted hover:scale-110 transition-transform shrink-0">
                      <input
                        type="color"
                        value={designData.accentColor}
                        onChange={(e) => setDesignData({ ...designData, accentColor: e.target.value })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full h-full flex items-center justify-center relative" style={{ backgroundColor: designData.accentColor }}>
                        <Plus size={16} className="text-white mix-blend-difference" />
                      </div>
                    </label>
                  </div>
                </div>

                {designData.template === 'accent' ? (
                  <div className="pt-6 border-t border-border/50 space-y-6">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branded hero cover</Label>
                      <p className="mt-1 text-sm text-muted-foreground">Wide restaurant photo shown behind the name. If empty, the brand colors create the hero.</p>
                    </div>
                    <input id="branded-cover-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCoverUpload} className="hidden" />
                    <label htmlFor="branded-cover-input" className="relative flex aspect-[16/7] w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-input bg-secondary/30 hover:bg-secondary/50">
                      {designData.branded.coverImageUrl ? <img src={designData.branded.coverImageUrl} alt="Branded cover" className="h-full w-full object-cover" /> : <span className="flex items-center gap-2 text-sm font-bold text-muted-foreground"><ImageIcon size={20} />Choose cover image</span>}
                    </label>
                    {designData.branded.coverImageUrl ? <Button type="button" variant="outline" size="sm" onClick={() => setDesignData((current) => ({ ...current, branded: { ...current.branded, coverImageUrl: null } }))}>Remove cover</Button> : null}

                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Secondary brand color</Label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={designData.branded.secondaryColor} onChange={(event) => setDesignData((current) => ({ ...current, branded: { ...current.branded, secondaryColor: event.target.value } }))} className="h-10 w-14 cursor-pointer rounded-lg border border-input bg-transparent p-1" />
                        <Input value={designData.branded.secondaryColor} onChange={(event) => setDesignData((current) => ({ ...current, branded: { ...current.branded, secondaryColor: event.target.value } }))} className={`${formFieldClasses} max-w-36`} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[['showPromo', 'Promo banner'], ['showFeatured', 'Recommended dishes'], ['showSearch', 'Menu search'], ['showAbout', 'About & contacts'], ['showKwikMenuBranding', 'KwikMenu footer credit']].map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/20 px-4 py-3">
                          <Label htmlFor={`branded-${key}`} className="text-sm font-semibold">{label}</Label>
                          <Switch id={`branded-${key}`} checked={designData.branded[key]} onCheckedChange={(checked) => setDesignData((current) => ({ ...current, branded: { ...current.branded, [key]: checked } }))} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="pt-6 border-t border-border/50 space-y-4">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('venues.design.logoLabel', 'Venue logo in menu')}</Label>
                  <div className="flex items-center gap-6">
                    <input
                      id="venue-logo-input"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleDesignLogoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="venue-logo-input"
                      className="w-24 h-24 rounded-2xl bg-secondary/30 border-2 border-dashed border-input flex items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors overflow-hidden"
                    >
                      {designData.logoUrl ? (
                        <img src={designData.logoUrl} alt={t('venues.design.logoAlt', 'Venue logo')} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="text-muted-foreground" size={32} />
                      )}
                    </label>
                    <div className="space-y-1">
                      <p className="text-sm font-bold">{t('venues.design.logoUploadTitle', 'Upload a square logo')}</p>
                      <p className="text-xs text-muted-foreground">{t('venues.design.logoUploadDesc', 'Recommended size 512x512px, PNG or WEBP')}</p>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="mt-2 rounded-lg border-border/60 text-[10px] uppercase tracking-wider font-black"
                      >
                        <label htmlFor="venue-logo-input" className="cursor-pointer">
                          {t('venues.design.btnSelectFile', 'Choose file')}
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 flex justify-end">
                  <Button onClick={handleSaveDesign} disabled={savingState.design} className={`${primaryActionButtonClasses} px-5`}>
                    <Save size={18} className="mr-2" />
                    {savingState.design ? t('common.saving', 'Saving...') : t('venues.btnSaveDesign', 'Save appearance')}
                  </Button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl shadow-xl text-white flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-brand-purple uppercase tracking-widest">{t('venues.design.previewLabel', 'Preview')}</p>
                  <h4 className="text-lg font-extrabold">{t('venues.design.previewTitle', 'See how guests view the menu')}</h4>
                </div>
                <a
                  href={qrData.publicUrl || venueData.publicUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackProductEvent('public_menu_link_opened', { venueId })}
                  className="inline-flex items-center h-11 rounded-lg bg-white px-5 text-gray-900 hover:bg-gray-100 font-bold gap-2 transition-colors"
                >
                  {t('venues.design.btnOpenMenu', 'Open menu')}
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
              onDownload={() => trackProductEvent('qr_downloaded', { venueId })}
              onOpenPublicLink={() => trackProductEvent('public_menu_link_opened', { venueId })}
              isSaving={savingState.qr}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default VenuePage;
