import {useState} from 'react';
import {Link} from 'react-router-dom';
import {
    ArrowLeft, CheckCircle2, Send,
    UploadCloud, Link as LinkIcon, FileText
} from 'lucide-react';
import { FaTelegram } from "react-icons/fa6";

import {Button} from "../components/ui/button";
import {Input} from "../components/ui/input";
import {Label} from "../components/ui/label";
import {Switch} from "../components/ui/switch";

// Маппинг топ-20 стран по русскоговорящему населению
const COUNTRIES = [
    {id: 'ru', name: 'Россия', flag: '🇷🇺', dial: '+7'},
    {id: 'kz', name: 'Казахстан', flag: '🇰🇿', dial: '+7'},
    {id: 'by', name: 'Беларусь', flag: '🇧🇾', dial: '+375'},
    {id: 'de', name: 'Германия', flag: '🇩🇪', dial: '+49'},
    {id: 'uz', name: 'Узбекистан', flag: '🇺🇿', dial: '+998'},
    {id: 'il', name: 'Израиль', flag: '🇮🇱', dial: '+972'},
    {id: 'us', name: 'США', flag: '🇺🇸', dial: '+1'},
    {id: 'kg', name: 'Кыргызстан', flag: '🇰🇬', dial: '+996'},
    {id: 'lv', name: 'Латвия', flag: '🇱🇻', dial: '+371'},
    {id: 'md', name: 'Молдова', flag: '🇲🇩', dial: '+373'},
    {id: 'ee', name: 'Эстония', flag: '🇪🇪', dial: '+372'},
    {id: 'ae', name: 'ОАЭ', flag: '🇦🇪', dial: '+971'},
    {id: 'az', name: 'Азербайджан', flag: '🇦🇿', dial: '+994'},
    {id: 'tj', name: 'Таджикистан', flag: '🇹🇯', dial: '+992'},
    {id: 'ge', name: 'Грузия', flag: '🇬🇪', dial: '+995'},
    {id: 'am', name: 'Армения', flag: '🇦🇲', dial: '+374'},
    {id: 'lt', name: 'Литва', flag: '🇱🇹', dial: '+370'},
    {id: 'tr', name: 'Турция', flag: '🇹🇷', dial: '+90'},
    {id: 'cy', name: 'Кипр', flag: '🇨🇾', dial: '+357'},
    {id: 'tm', name: 'Туркменистан', flag: '🇹🇲', dial: '+993'}
];

const HelpPage = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [menuSource, setMenuSource] = useState('file'); // 'file' | 'link'
    const [fileName, setFileName] = useState('');
    const [uploadLater, setUploadLater] = useState(false);

    // Состояния полей
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [messenger, setMessenger] = useState('telegram');
    const [city, setCity] = useState('');
    const [restaurant, setRestaurant] = useState('');
    const [menuLink, setMenuLink] = useState('');

    // Состояния для синхронизации страны и кода телефона
    const [selectedCountry, setSelectedCountry] = useState('ru');
    const [selectedDial, setSelectedDial] = useState('+7');

    // Отправка вебхука в n8n
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Формируем полезную нагрузку
        const payload = {
            name,
            phone: `${selectedDial} ${phone}`,
            messenger,
            country: selectedCountry,
            city,
            restaurant,
            uploadLater,
            menuStatus: uploadLater
                ? "upload_later"
                : menuSource,
            menuValue: uploadLater
                ? null
                : (menuSource === 'file' ? fileName : menuLink)
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

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name);
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
        <div
            className="max-w-2xl mx-auto space-y-10 py-3 sm:py-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

            {!isSubmitted && (
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3 sm:mb-5 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/>
                    Назад к выбору
                </Link>
            )}

            <div
                className="bg-card border border-border/60 p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm relative overflow-hidden">

                <div
                    className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>

                {!isSubmitted ? (
                    <>
                        <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">

                            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                                Давайте мы всё сделаем
                            </h2>
                            <p className="text-muted-foreground text-xs sm:text-base leading-relaxed">
                                Оставьте свои контакты и меню. Мы сами всё распознаем, настроим и отдадим вам готовый
                                QR-код и доступ в личный кабинет
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">

                            {/* 1. Имя */}
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label htmlFor="name"
                                       className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">Имя</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Как к вам обращаться?"
                                    required
                                    className={inputBaseClasses}
                                />
                            </div>

                            {/* 2. Телефон с кодом */}
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label htmlFor="phone"
                                       className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">Номер
                                    телефона</Label>
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
                                        <div
                                            className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                            <svg width="12" height="12" viewBox="0 0 15 15" fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z"
                                                    fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                            </svg>
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

                            {/* 3. Мессенджер */}
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label htmlFor="messenger"
                                       className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">Мессенджер
                                    для связи</Label>
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
                                    <div
                                        className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                        <svg width="12" height="12" viewBox="0 0 15 15" fill="none"
                                             xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z"
                                                fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Страна и Город */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-1.5 sm:space-y-2">
                                    <Label htmlFor="country"
                                           className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">Страна</Label>
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
                                        <div
                                            className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                            <svg width="12" height="12" viewBox="0 0 15 15" fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z"
                                                    fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 sm:space-y-2">
                                    <Label htmlFor="city"
                                           className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">Город</Label>
                                    <Input
                                        id="city"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="Например: Дубай"
                                        className={inputBaseClasses}
                                    />
                                </div>
                            </div>

                            {/* 5. Название заведения */}
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label htmlFor="restaurant"
                                       className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">Название
                                    заведения</Label>
                                <Input
                                    id="restaurant"
                                    value={restaurant}
                                    onChange={(e) => setRestaurant(e.target.value)}
                                    placeholder="Например: Кафе «Татьяна»"
                                    className={inputBaseClasses}
                                />
                            </div>

                            {/* 6. Блок загрузки меню */}
                            <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
                                <Label className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">Загрузить
                                    меню</Label>

                                {/* Основной контент загрузки */}
                                {!uploadLater && (
                                    <div className="space-y-2 sm:space-y-3 animate-in fade-in duration-300">
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
                                                <UploadCloud size={14} className="sm:w-[18px] sm:h-[18px]"/>
                                                <span className="hidden sm:inline">Загрузить файл</span>
                                                <span className="sm:hidden">Файл</span>
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
                                                <LinkIcon size={14} className="sm:w-[18px] sm:h-[18px]"/>
                                                <span className="hidden sm:inline">Указать ссылку</span>
                                                <span className="sm:hidden">Ссылка</span>
                                            </button>
                                        </div>

                                        <div>
                                            {menuSource === 'file' ? (
                                                <div
                                                    className="relative flex flex-col items-center justify-center w-full h-24 sm:h-28 border-2 border-dashed border-input rounded-lg hover:bg-secondary/20 transition-colors bg-secondary/10 group cursor-pointer">
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={handleFileChange}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                    {fileName ? (
                                                        <div
                                                            className="flex flex-col items-center gap-1.5 sm:gap-2 text-brand-purple">
                                                            <FileText size={22} className="sm:w-7 sm:h-7"/>
                                                            <span
                                                                className="text-[10px] sm:text-sm font-medium truncate max-w-[160px] sm:max-w-[200px]">{fileName}</span>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="flex flex-col items-center gap-1.5 sm:gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                                            <UploadCloud size={18} className="sm:w-6 sm:h-6"/>
                                                            <span className="text-[10px] sm:text-sm font-medium">Нажмите или перетащите файл</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <Input
                                                    placeholder="Ссылка на Google Drive..."
                                                    value={menuLink}
                                                    onChange={(e) => setMenuLink(e.target.value)}
                                                    className={inputBaseClasses}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Свитч: Нет под рукой меню */}
                                <div className="flex items-center space-x-2.5 pt-1.5 sm:pt-2">
                                    <Switch
                                        id="upload-later"
                                        checked={uploadLater}
                                        onCheckedChange={setUploadLater}
                                    />
                                    <Label htmlFor="upload-later"
                                           className="text-xs sm:text-sm font-medium cursor-pointer text-foreground select-none">
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
                      <span
                          className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Отправляем...
                    </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                      <Send size={16} className="sm:w-[18px] sm:h-[18px]"/>
                      Оставить заявку
                    </span>
                                    )}
                                </Button>

                                <p className="text-[9px] sm:text-[11px] text-muted-foreground/70 text-center mt-3 sm:mt-4 leading-tight">
                                    * WhatsApp — мессенджер, принадлежащий компании Meta, признанной экстремистской
                                    организацией, деятельность которой запрещена на территории РФ.
                                </p>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="py-4 sm:py-8 flex flex-col items-center animate-in zoom-in-95 duration-500">
                        <div
                            className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                            <CheckCircle2 size={32} className="sm:w-10 sm:h-10"/>
                        </div>
                        <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-2 sm:mb-3 text-center">Заявка
                            принята!</h3>
                        <p className="text-muted-foreground text-xs sm:text-base mb-8 max-w-[240px] sm:max-w-[280px] text-center">
                            Мы свяжемся с вами в ближайшее время!
                        </p>

                        {/* Плашка связи с менеджером */}
                        <div
                            className="w-full border border-brand-purple/30 bg-brand-purple/5 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
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
                                <FaTelegram size={24} color="#3A9FFE"/>
                                Написать в Telegram
                            </a>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default HelpPage;