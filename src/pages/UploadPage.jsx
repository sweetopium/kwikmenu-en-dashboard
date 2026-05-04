import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Sparkles,
  UploadCloud, Link as LinkIcon, FileText, Image as ImageIcon, Check
} from 'lucide-react';

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

// Маппинг топ-20 стран по русскоговорящему населению
const COUNTRIES = [
  { id: 'ru', name: 'Россия', flag: '🇷🇺', dial: '+7' },
  { id: 'kz', name: 'Казахстан', flag: '🇰🇿', dial: '+7' },
  { id: 'by', name: 'Беларусь', flag: '🇧🇾', dial: '+375' },
  { id: 'de', name: 'Германия', flag: '🇩🇪', dial: '+49' },
  { id: 'uz', name: 'Узбекистан', flag: '🇺🇿', dial: '+998' },
  { id: 'il', name: 'Израиль', flag: '🇮🇱', dial: '+972' },
  { id: 'us', name: 'США', flag: '🇺🇸', dial: '+1' },
  { id: 'kg', name: 'Кыргызстан', flag: '🇰🇬', dial: '+996' },
  { id: 'lv', name: 'Латвия', flag: '🇱🇻', dial: '+371' },
  { id: 'md', name: 'Молдова', flag: '🇲🇩', dial: '+373' },
  { id: 'ee', name: 'Эстония', flag: '🇪🇪', dial: '+372' },
  { id: 'ae', name: 'ОАЭ', flag: '🇦🇪', dial: '+971' },
  { id: 'az', name: 'Азербайджан', flag: '🇦🇿', dial: '+994' },
  { id: 'tj', name: 'Таджикистан', flag: '🇹🇯', dial: '+992' },
  { id: 'ge', name: 'Грузия', flag: '🇬🇪', dial: '+995' },
  { id: 'am', name: 'Армения', flag: '🇦🇲', dial: '+374' },
  { id: 'lt', name: 'Литва', flag: '🇱🇹', dial: '+370' },
  { id: 'tr', name: 'Турция', flag: '🇹🇷', dial: '+90' },
  { id: 'cy', name: 'Кипр', flag: '🇨🇾', dial: '+357' },
  { id: 'tm', name: 'Туркменистан', flag: '🇹🇲', dial: '+993' }
];

const STEPS = [
  { id: 1, label: 'Данные' },
  { id: 2, label: 'Меню' },
  { id: 3, label: 'Обработка' }
];

const UploadPage = () => {
  const [step, setStep] = useState(1); // 1: Базовая инфа, 2: Загрузка меню, 3: Прелоадер обработки
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Состояния полей Шаг 1
  const [restaurant, setRestaurant] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  // Состояния для синхронизации страны и кода телефона
  const [selectedCountry, setSelectedCountry] = useState('ru');
  const [selectedDial, setSelectedDial] = useState('+7');

  // Состояния полей Шаг 2
  const [menuSource, setMenuSource] = useState('file'); // 'file' | 'link'
  const [files, setFiles] = useState([]); // Массив файлов
  const [menuLink, setMenuLink] = useState('');

  // Обработчик 1 шага
  const handleStep1Submit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  // Обработчик финальной отправки (Шаг 2 -> 3)
  const handleFinalSubmit = (e) => {
    e.preventDefault();

    // Валидация
    if (menuSource === 'file' && files.length === 0) {
      alert("Пожалуйста, выберите хотя бы один файл.");
      return;
    }
    if (menuSource === 'link' && !menuLink.trim()) {
      alert("Пожалуйста, укажите ссылку.");
      return;
    }

    // Переводим на 3й шаг (заглушка обработки)
    setIsSubmitted(true);
    setStep(3);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleCountryChange = (e) => {
    const countryId = e.target.value;
    setSelectedCountry(countryId);

    const countryObj = COUNTRIES.find(c => c.id === countryId);
    if (countryObj) {
      setSelectedDial(countryObj.dial);
    }
  };

  const inputBaseClasses = "flex h-11 w-full items-center rounded-lg border border-input bg-secondary/30 px-3 sm:px-4 text-sm sm:text-base transition-colors focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground placeholder:text-xs sm:placeholder:text-sm disabled:cursor-not-allowed disabled:opacity-50 appearance-none";

  return (
    <div className="max-w-2xl mx-auto flex flex-col space-y-6 py-3 sm:py-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out w-full">

      {/* Навигация (Кнопка назад) */}
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

      {/* Основная карточка */}
      <div className="bg-card border border-border/60 p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col min-h-[540px] sm:min-h-[600px]">

        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>

        {/* --- СТЕППЕР (Горизонтальный прогресс) --- */}
        <div className="relative flex items-center justify-between w-full mb-8 sm:mb-10 px-2 sm:px-6 z-10">
          {/* Серая линия фона */}
          <div className="absolute left-[10%] right-[10%] top-[14px] sm:top-[18px] h-[2px] bg-secondary -z-10"></div>
          {/* Цветная линия прогресса */}
          <div
            className="absolute left-[10%] top-[14px] sm:top-[18px] h-[2px] bg-brand-purple -z-10 transition-all duration-500 ease-out"
            style={{ width: step === 1 ? '0%' : step === 2 ? '40%' : '80%' }}
          ></div>

          {STEPS.map((s) => {
            const isActive = step === s.id;
            const isCompleted = step > s.id;

            return (
              <div key={s.id} className="flex flex-col items-center gap-2 relative bg-card px-2">
                <div
                  className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[11px] sm:text-sm font-bold border-2 transition-all duration-300 ${
                    isActive
                      ? 'border-brand-purple bg-brand-purple text-white shadow-md shadow-brand-purple/30 scale-110'
                      : isCompleted
                      ? 'border-brand-purple bg-brand-purple text-white'
                      : 'border-input bg-secondary/50 text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : s.id}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-semibold absolute -bottom-5 whitespace-nowrap transition-colors duration-300 ${
                    isActive ? 'text-foreground' : isCompleted ? 'text-foreground/80' : 'text-muted-foreground/60'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Отступ под надписи степпера */}
        <div className="pt-2 sm:pt-4"></div>


        {/* --- ШАГ 1: БАЗОВАЯ ИНФА --- */}
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

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="phone" className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">
                  Контактный телефон <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative w-[100px] sm:w-[120px]">
                    <select
                      value={selectedDial}
                      onChange={(e) => setSelectedDial(e.target.value)}
                      className={`${inputBaseClasses} pr-7 sm:pr-8 cursor-pointer text-[11px] sm:text-base`}
                    >
                      {COUNTRIES.map(c => (
                        <option key={`dial-${c.id}`} value={c.dial}>
                          {c.flag} {c.dial}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </div>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(999) 000-00-00"
                    required
                    className={`${inputBaseClasses} flex-1`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="country" className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">
                    Страна <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <select
                      id="country"
                      value={selectedCountry}
                      onChange={handleCountryChange}
                      className={`${inputBaseClasses} pr-10 cursor-pointer text-[11px] sm:text-base`}
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </div>
                  </div>
                </div>

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

              {/* mt-auto прижимает кнопку к низу карточки */}
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

        {/* --- ШАГ 2: ЗАГРУЗКА МЕНЮ --- */}
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

                <div className="flex p-1 bg-secondary/50 rounded-lg border border-input/50">
                  <button
                    type="button"
                    onClick={() => setMenuSource('file')}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md text-[10px] sm:text-sm font-medium transition-all ${
                      menuSource === 'file' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <UploadCloud size={14} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden sm:inline">Загрузить файлы</span>
                    <span className="sm:hidden">Файлы</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuSource('link')}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md text-[10px] sm:text-sm font-medium transition-all ${
                      menuSource === 'link' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <LinkIcon size={14} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden sm:inline">Указать ссылку</span>
                    <span className="sm:hidden">Ссылка</span>
                  </button>
                </div>

                <div>
                  {menuSource === 'file' ? (
                    <div className="relative flex flex-col items-center justify-center w-full h-32 sm:h-36 border-2 border-dashed border-input rounded-lg hover:bg-secondary/20 transition-colors bg-secondary/10 group cursor-pointer overflow-hidden">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />

                      {files.length > 0 ? (
                        <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-brand-purple px-4 text-center">
                          {files.length === 1 ? (
                            <FileText size={28} className="sm:w-8 sm:h-8" />
                          ) : (
                            <ImageIcon size={28} className="sm:w-8 sm:h-8" />
                          )}
                          <span className="text-xs sm:text-sm font-medium truncate max-w-[200px] sm:max-w-[300px]">
                            {files.length === 1 ? files[0].name : `Выбрано файлов: ${files.length}`}
                          </span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground group-hover:text-brand-purple/70 transition-colors">
                            Нажмите, чтобы заменить
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-muted-foreground group-hover:text-foreground transition-colors px-4 text-center">
                          <UploadCloud size={24} className="sm:w-7 sm:h-7" />
                          <span className="text-xs sm:text-sm font-medium">Нажмите или перетащите PDF/Фото</span>
                          <span className="text-[10px] sm:text-xs opacity-70">Можно выбрать несколько файлов</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Input
                      placeholder="Ссылка на Google Drive, Яндекс.Диск..."
                      value={menuLink}
                      onChange={(e) => setMenuLink(e.target.value)}
                      required={menuSource === 'link'}
                      className={inputBaseClasses}
                    />
                  )}
                </div>
              </div>

              {/* mt-auto прижимает кнопку к низу карточки */}
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

        {/* --- ШАГ 3: ЗАГЛУШКА ПРЕЛОАДЕРА ИИ --- */}
        {step === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
            <div className="relative mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-secondary rounded-full absolute inset-0"></div>
              <div className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
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

      </div>
    </div>
  );
};

export default UploadPage;