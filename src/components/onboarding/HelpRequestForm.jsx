import { useState } from 'react';
import { CheckCircle2, Send, X } from 'lucide-react';
import { FaTelegram } from "react-icons/fa6";
import { useTranslation } from 'react-i18next';

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { CountryField, DialPhoneField } from "./CountryDialFields";
import { COUNTRIES, inputBaseClasses } from "./countries";
import MenuSourcePicker from "./MenuSourcePicker";
import { submitHelpRequest } from "../../lib/helpRequestsApi";

const SelectChevron = () => (
  <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
  </svg>
);

const RequiredAsterisk = () => <span className="text-red-500">*</span>;

const HelpRequestForm = ({ onClose = null }) => {
  const { t } = useTranslation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [menuSource, setMenuSource] = useState('file');
  const [menuFile, setMenuFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploadLater, setUploadLater] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [messenger, setMessenger] = useState('telegram');
  const [city, setCity] = useState('');
  const [restaurant, setRestaurant] = useState('');
  const [menuLink, setMenuLink] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ru');
  const [selectedDial, setSelectedDial] = useState('+7');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    const country = COUNTRIES.find((item) => item.id === selectedCountry);

    try {
      await submitHelpRequest({
        name,
        phone: `${selectedDial} ${phone}`,
        messenger,
        countryCode: selectedCountry,
        countryName: country?.name || selectedCountry,
        city,
        restaurantName: restaurant,
        uploadLater,
        menuSource,
        menuLink,
        menuFile,
      });
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('helpForm.errSubmit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCountryChange = (countryId) => {
    setSelectedCountry(countryId);

    const country = COUNTRIES.find((item) => item.id === countryId);
    if (country) {
      setSelectedDial(country.dial);
    }
  };

  return (
    <>
      {!isSubmitted ? (
        <>
          <div className="mb-6 flex items-start justify-between gap-4 sm:mb-8">
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {t('helpForm.title')}
              </h2>
              <p className="text-muted-foreground text-xs sm:text-base leading-relaxed">
                {t('helpForm.subtitle')}
              </p>
            </div>

            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label={t('helpForm.closeAria')}
              >
                <X size={18} />
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {submitError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            ) : null}

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="name" className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">
                {t('helpForm.nameLabel')} <RequiredAsterisk />
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('helpForm.namePlaceholder')}
                required
                className={inputBaseClasses}
              />
            </div>

            <DialPhoneField
              phone={phone}
              selectedDial={selectedDial}
              selectedCountryId={selectedCountry}
              onCountryChange={handleCountryChange}
              onPhoneChange={setPhone}
              onDialChange={setSelectedDial}
              label={t('helpForm.phoneLabel')}
              required
            />

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="messenger" className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">
                {t('helpForm.messengerLabel')} <RequiredAsterisk />
              </Label>
              <div className="relative">
                <select
                  id="messenger"
                  value={messenger}
                  onChange={(e) => setMessenger(e.target.value)}
                  required
                  className={`${inputBaseClasses} pr-10 cursor-pointer text-[11px] sm:text-base`}
                >
                  <option value="telegram">Telegram</option>
                  <option value="max">Max</option>
                  <option value="whatsapp">WhatsApp*</option>
                  <option value="call">{t('helpForm.messengerOptions.call')}</option>
                </select>
                <div className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <SelectChevron />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <CountryField selectedCountry={selectedCountry} onCountryChange={handleCountryChange} label={t('helpForm.countryLabel')} required />

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="city" className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">
                  {t('helpForm.cityLabel')} <RequiredAsterisk />
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('helpForm.cityPlaceholder')}
                  required
                  className={inputBaseClasses}
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="restaurant" className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">
                {t('helpForm.restaurantLabel')} <RequiredAsterisk />
              </Label>
              <Input
                id="restaurant"
                value={restaurant}
                onChange={(e) => setRestaurant(e.target.value)}
                placeholder={t('helpForm.restaurantPlaceholder')}
                required
                className={inputBaseClasses}
              />
            </div>

            <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
              <Label className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">
                {t('helpForm.uploadMenuLabel')} <RequiredAsterisk />
              </Label>

              {!uploadLater && (
                <MenuSourcePicker
                  menuSource={menuSource}
                  onMenuSourceChange={setMenuSource}
                  fileName={fileName}
                  onFileChange={(e) => {
                    const nextFile = e.target.files?.[0] || null;
                    setMenuFile(nextFile);
                    setFileName(nextFile?.name || '');
                  }}
                  menuLink={menuLink}
                  onMenuLinkChange={setMenuLink}
                  inputClassName={inputBaseClasses}
                />
              )}

              <div className="flex items-center space-x-2.5 pt-1.5 sm:pt-2">
                <Switch
                  id="upload-later"
                  checked={uploadLater}
                  onCheckedChange={setUploadLater}
                />
                <Label htmlFor="upload-later" className="text-xs sm:text-sm font-medium cursor-pointer text-foreground select-none">
                  {t('helpForm.uploadLater')}
                </Label>
              </div>
            </div>

            <div className="pt-3 sm:pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 sm:h-12 text-xs sm:text-base font-semibold rounded-lg bg-brand-purple hover:bg-brand-purple/90 text-white shadow-md hover:shadow-lg hover:shadow-brand-purple/20 transition-all duration-300"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('helpForm.btnSubmitting')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                    {t('helpForm.btnSubmit')}
                  </span>
                )}
              </Button>

              <p className="text-[9px] sm:text-[11px] text-muted-foreground/70 text-center mt-3 sm:mt-4 leading-tight">
                {t('helpForm.legalNote')}
              </p>
            </div>
          </form>
        </>
      ) : (
        <div className="py-4 sm:py-8 flex flex-col items-center animate-in zoom-in-95 duration-500">
          {onClose ? (
            <div className="mb-4 flex w-full justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label={t('helpForm.closeAria')}
              >
                <X size={18} />
              </button>
            </div>
          ) : null}

          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
            <CheckCircle2 size={32} className="sm:w-10 sm:h-10" />
          </div>
          <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-2 sm:mb-3 text-center">
            {t('helpForm.successTitle')}
          </h3>
          <p className="text-muted-foreground text-xs sm:text-base mb-8 max-w-[240px] sm:max-w-[280px] text-center">
            {t('helpForm.successText')}
          </p>

          <div className="w-full border border-brand-purple/30 bg-brand-purple/5 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <img
                src="https://storage.yandexcloud.net/ez-front/anna_kwikmenu.png"
                alt="Анна"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shadow-sm bg-secondary/50"
              />
              <div className="text-left">
                <p className="text-sm sm:text-base font-bold text-foreground">{t('helpForm.managerName')}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('helpForm.managerTitle')}</p>
              </div>
            </div>
            <a
              href="https://t.me/kwikmenu_support"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-background border border-border/50 text-brand-purple rounded-xl text-sm font-semibold hover:bg-secondary/50 transition-colors shadow-sm"
            >
              <FaTelegram size={24} color="#3A9FFE" />
              {t('helpForm.writeToTelegram')}
            </a>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpRequestForm;
