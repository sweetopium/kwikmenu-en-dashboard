import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { CountryField, DialPhoneField } from "../components/onboarding/CountryDialFields";
import { COUNTRIES, inputBaseClasses } from "../components/onboarding/countries";
import OnboardingCard from "../components/onboarding/OnboardingCard";
import MenuImportFlow from "../components/menu-import/MenuImportFlow";

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
  const [isProfileStepCompleted, setIsProfileStepCompleted] = useState(false);
  const [importStage, setImportStage] = useState('idle');
  const [restaurant, setRestaurant] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ru');
  const [selectedDial, setSelectedDial] = useState('+7');

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setIsProfileStepCompleted(true);
  };

  const handleCountryChange = (countryId) => {
    setSelectedCountry(countryId);

    const country = COUNTRIES.find((item) => item.id === countryId);
    if (country) {
      setSelectedDial(country.dial);
    }
  };

  const step = useMemo(() => {
    if (!isProfileStepCompleted) {
      return 1;
    }

    return ['uploading', 'processing', 'success'].includes(importStage) ? 3 : 2;
  }, [importStage, isProfileStepCompleted]);

  const importContext = {
    restaurant_name: restaurant,
    contact_phone: `${selectedDial} ${phone}`.trim(),
    city,
    country: selectedCountry,
    flow: 'onboarding',
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col space-y-6 py-3 sm:py-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out w-full">
      {importStage !== 'uploading' && importStage !== 'processing' && importStage !== 'success' && (
        <div className="flex items-center">
          {!isProfileStepCompleted ? (
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
              onClick={() => setIsProfileStepCompleted(false)}
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

        {!isProfileStepCompleted && (
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

        {isProfileStepCompleted && (
          <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
            <MenuImportFlow
              context={importContext}
              introTitle="Загрузите меню"
              introDescription="Загрузите PDF, фотографии или ссылку. Отправим исходники в сценарий распознавания и покажем результат."
              submitLabel="Отправить на распознавание"
              successTitle="Черновик меню подготовлен"
              successDescription="Исходники ушли в webhook, базовая структура собрана. Дальше можно открыть демо-редактор и продолжить работу вручную."
              successPrimaryLabel="Открыть редактор меню"
              successPrimaryTo="/dashboard/menu/main"
              successSecondaryLabel="Перейти в кабинет"
              successSecondaryTo="/dashboard"
              onStageChange={setImportStage}
            />
          </div>
        )}
      </OnboardingCard>
    </div>
  );
};

export default UploadPage;
