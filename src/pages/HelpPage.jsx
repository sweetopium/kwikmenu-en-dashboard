import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import { FaTelegram } from "react-icons/fa6";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { CountryField, DialPhoneField } from "../components/onboarding/CountryDialFields";
import { COUNTRIES, inputBaseClasses } from "../components/onboarding/countries";
import MenuSourcePicker from "../components/onboarding/MenuSourcePicker";
import OnboardingCard from "../components/onboarding/OnboardingCard";

const SelectChevron = () => (
  <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
  </svg>
);

const HelpPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuSource, setMenuSource] = useState('file');
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

    const payload = {
      name,
      phone: `${selectedDial} ${phone}`,
      messenger,
      country: selectedCountry,
      city,
      restaurant,
      uploadLater,
      menuStatus: uploadLater ? "upload_later" : menuSource,
      menuValue: uploadLater ? null : (menuSource === 'file' ? fileName : menuLink),
    };

    try {
      const response = await fetch('https://n8n.rtctrf.com/webhook-test/5fbe7bd4-d627-4315-9a1b-ad1ac1fb6617', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        console.error('Ошибка отправки данных');
      }
    } catch (error) {
      console.error('Ошибка сети:', error);
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
    <div className="max-w-2xl mx-auto space-y-10 py-3 sm:py-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {!isSubmitted && (
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground bg-card border border-border/60 shadow-sm hover:shadow-md px-4 py-2.5 rounded-full transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          К выбору
        </Link>
      )}

      <OnboardingCard>
        {!isSubmitted ? (
          <>
            <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Заявка на перенос меню
              </h2>
              <p className="text-muted-foreground text-xs sm:text-base leading-relaxed">
                Оставьте контакты, менеджер свяжется и подготовит меню
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">
                  Имя
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Как к вам обращаться?"
                  required
                  className={inputBaseClasses}
                />
              </div>

              <DialPhoneField
                phone={phone}
                selectedDial={selectedDial}
                onPhoneChange={setPhone}
                onDialChange={setSelectedDial}
                label="Номер телефона"
                required
              />

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="messenger" className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">
                  Мессенджер для связи
                </Label>
                <div className="relative">
                  <select
                    id="messenger"
                    value={messenger}
                    onChange={(e) => setMessenger(e.target.value)}
                    className={`${inputBaseClasses} pr-10 cursor-pointer text-[11px] sm:text-base`}
                  >
                    <option value="telegram">Telegram</option>
                    <option value="max">Макс</option>
                    <option value="whatsapp">WhatsApp*</option>
                    <option value="call">Телефонный звонок</option>
                  </select>
                  <div className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <SelectChevron />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <CountryField selectedCountry={selectedCountry} onCountryChange={handleCountryChange} />

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="city" className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">
                    Город
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Например: Москва"
                    className={inputBaseClasses}
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="restaurant" className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">
                  Название заведения
                </Label>
                <Input
                  id="restaurant"
                  value={restaurant}
                  onChange={(e) => setRestaurant(e.target.value)}
                  placeholder="Например: Кафе «Татьяна»"
                  className={inputBaseClasses}
                />
              </div>

              <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
                <Label className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">
                  Загрузить меню
                </Label>

                {!uploadLater && (
                  <MenuSourcePicker
                    menuSource={menuSource}
                    onMenuSourceChange={setMenuSource}
                    fileName={fileName}
                    onFileChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
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
                    Загружу меню позже
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
                      Отправляем...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                      Оставить заявку
                    </span>
                  )}
                </Button>

                <p className="text-[9px] sm:text-[11px] text-muted-foreground/70 text-center mt-3 sm:mt-4 leading-tight">
                  * WhatsApp — мессенджер, принадлежащий компании Meta, признанной экстремистской организацией, деятельность которой запрещена на территории РФ.
                </p>
              </div>
            </form>
          </>
        ) : (
          <div className="py-4 sm:py-8 flex flex-col items-center animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
              <CheckCircle2 size={32} className="sm:w-10 sm:h-10" />
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-2 sm:mb-3 text-center">
              Заявка принята!
            </h3>
            <p className="text-muted-foreground text-xs sm:text-base mb-8 max-w-[240px] sm:max-w-[280px] text-center">
              Мы свяжемся с вами в ближайшее время!
            </p>

            <div className="w-full border border-brand-purple/30 bg-brand-purple/5 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <img
                  src="https://storage.yandexcloud.net/ez-front/anna_kwikmenu.png"
                  alt="Анна"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shadow-sm bg-secondary/50"
                />
                <div className="text-left">
                  <p className="text-sm sm:text-base font-bold text-foreground">Анна</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Персональный менеджер</p>
                </div>
              </div>
              <a
                href="https://t.me/kwikmenu_support"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-background border border-border/50 text-brand-purple rounded-xl text-sm font-semibold hover:bg-secondary/50 transition-colors shadow-sm"
              >
                <FaTelegram size={24} color="#3A9FFE" />
                Написать в Telegram
              </a>
            </div>
          </div>
        )}
      </OnboardingCard>
    </div>
  );
};

export default HelpPage;
