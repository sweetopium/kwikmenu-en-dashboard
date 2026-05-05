import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { CountryField, DialPhoneField } from "../components/onboarding/CountryDialFields";
import { COUNTRIES, inputBaseClasses } from "../components/onboarding/countries";
import MenuSourcePicker from "../components/onboarding/MenuSourcePicker";
import OnboardingCard from "../components/onboarding/OnboardingCard";

const STEPS = [
  { id: 1, label: 'Данные' },
  { id: 2, label: 'Меню' },
  { id: 3, label: 'Обработка' },
];

const UploadStepper = ({ step }) => (
  <div className="relative flex items-center justify-between w-full mb-8 sm:mb-10 px-2 sm:px-6 z-10">
    <div className="absolute left-[10%] right-[10%] top-[14px] sm:top-[18px] h-[2px] bg-secondary -z-10" />
    <div
      className="absolute left-[10%] top-[14px] sm:top-[18px] h-[2px] bg-brand-purple -z-10 transition-all duration-500 ease-out"
      style={{ width: step === 1 ? '0%' : step === 2 ? '40%' : '80%' }}
    />

    {STEPS.map((item) => {
      const isActive = step === item.id;
      const isCompleted = step > item.id;

      return (
        <div key={item.id} className="flex flex-col items-center gap-2 relative bg-card px-2">
          <div
            className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[11px] sm:text-sm font-bold border-2 transition-all duration-300 ${
              isActive
                ? 'border-brand-purple bg-brand-purple text-white shadow-md shadow-brand-purple/30 scale-110'
                : isCompleted
                  ? 'border-brand-purple bg-brand-purple text-white'
                  : 'border-input bg-secondary/50 text-muted-foreground'
            }`}
          >
            {isCompleted ? <Check size={16} strokeWidth={3} /> : item.id}
          </div>
          <span
            className={`text-[10px] sm:text-xs font-semibold absolute -bottom-5 whitespace-nowrap transition-colors duration-300 ${
              isActive ? 'text-foreground' : isCompleted ? 'text-foreground/80' : 'text-muted-foreground/60'
            }`}
          >
            {item.label}
          </span>
        </div>
      );
    })}
  </div>
);

const UploadPage = () => {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [restaurant, setRestaurant] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ru');
  const [selectedDial, setSelectedDial] = useState('+7');
  const [menuSource, setMenuSource] = useState('file');
  const [files, setFiles] = useState([]);
  const [menuLink, setMenuLink] = useState('');

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();

    if (menuSource === 'file' && files.length === 0) {
      alert("Пожалуйста, выберите хотя бы один файл.");
      return;
    }
    if (menuSource === 'link' && !menuLink.trim()) {
      alert("Пожалуйста, укажите ссылку.");
      return;
    }

    setIsSubmitted(true);
    setStep(3);
  };

  const handleCountryChange = (countryId) => {
    setSelectedCountry(countryId);

    const country = COUNTRIES.find((item) => item.id === countryId);
    if (country) {
      setSelectedDial(country.dial);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col space-y-6 py-3 sm:py-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out w-full">
      {!isSubmitted && (
        <div className="flex items-center">
          {step === 1 ? (
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground bg-card border border-border/60 shadow-sm hover:shadow-md px-4 py-2.5 rounded-full transition-all group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              К выбору
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground bg-card border border-border/60 shadow-sm hover:shadow-md px-4 py-2.5 rounded-full transition-all group cursor-pointer"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Назад
            </button>
          )}
        </div>
      )}

      <OnboardingCard className="flex flex-col min-h-[540px] sm:min-h-[600px]">
        <UploadStepper step={step} />
        <div className="pt-2 sm:pt-4" />

        {step === 1 && (
          <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-1.5 sm:space-y-2 mb-6 sm:mb-8 text-center sm:text-left">
              <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Давайте знакомиться
              </h2>
              <p className="text-muted-foreground text-xs sm:text-base leading-relaxed">
                Введите базовую информацию о заведении, чтобы мы могли привязать меню к вашему аккаунту.
              </p>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-5 sm:space-y-6 flex-1 flex flex-col">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="restaurant" className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">
                  Название заведения <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="restaurant"
                  value={restaurant}
                  onChange={(e) => setRestaurant(e.target.value)}
                  placeholder="Например: Кафе «Татьяна»"
                  required
                  className={inputBaseClasses}
                />
              </div>

              <DialPhoneField
                phone={phone}
                selectedDial={selectedDial}
                onPhoneChange={setPhone}
                onDialChange={setSelectedDial}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <CountryField selectedCountry={selectedCountry} onCountryChange={handleCountryChange} required />

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="city" className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">
                    Город <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Например: Москва"
                    required
                    className={inputBaseClasses}
                  />
                </div>
              </div>

              <div className="pt-3 sm:pt-4 mt-auto">
                <Button
                  type="submit"
                  className="w-full h-10 sm:h-12 text-xs sm:text-base font-semibold rounded-lg bg-brand-purple hover:bg-brand-purple/90 text-white shadow-md hover:shadow-lg hover:shadow-brand-purple/20 transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    Далее
                    <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </span>
                </Button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-1.5 sm:space-y-2 mb-6 sm:mb-8 text-center sm:text-left">
              <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Загрузите меню
              </h2>
              <p className="text-muted-foreground text-xs sm:text-base leading-relaxed">
                Загрузите PDF файл, сделайте фотографии или вставьте ссылку. Наш ИИ всё распознает.
              </p>
            </div>

            <form onSubmit={handleFinalSubmit} className="space-y-5 sm:space-y-6 flex-1 flex flex-col">
              <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
                <Label className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">
                  Исходник меню <span className="text-red-500">*</span>
                </Label>

                <MenuSourcePicker
                  menuSource={menuSource}
                  onMenuSourceChange={setMenuSource}
                  files={files}
                  onFileChange={(e) => setFiles(Array.from(e.target.files || []))}
                  menuLink={menuLink}
                  onMenuLinkChange={setMenuLink}
                  inputClassName={inputBaseClasses}
                  multiple
                  fileTabLabel="Загрузить файлы"
                  fileTabMobileLabel="Файлы"
                  linkPlaceholder="Ссылка на Google Drive, Яндекс.Диск..."
                  dropzoneHeight="h-32 sm:h-36"
                />
              </div>

              <div className="pt-3 sm:pt-4 mt-auto">
                <Button
                  type="submit"
                  className="w-full h-10 sm:h-12 text-xs sm:text-base font-semibold rounded-lg bg-brand-purple hover:bg-brand-purple/90 text-white shadow-md hover:shadow-lg hover:shadow-brand-purple/20 transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
                    Распознать меню
                  </span>
                </Button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
            <div className="relative mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-secondary rounded-full absolute inset-0" />
              <div className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-brand-purple">
                <Sparkles size={28} className="sm:w-8 sm:h-8 animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-3 sm:mb-4 text-center">
              ИИ изучает ваше меню...
            </h3>
            <p className="text-muted-foreground text-xs sm:text-base max-w-[260px] sm:max-w-[320px] text-center leading-relaxed">
              Мы извлекаем категории, блюда, описания и цены. Обычно это занимает около 10-15 секунд.
            </p>
          </div>
        )}
      </OnboardingCard>
    </div>
  );
};

export default UploadPage;
