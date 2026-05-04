import {useState} from 'react';
import {
    Download, Palette, Type, Grid, Crown, Image as ImageIcon,
    Settings2, Copy, FileDown, Layers
} from 'lucide-react';

import {Button} from "../components/ui/button";
import {Input} from "../components/ui/input";
import {Label} from "../components/ui/label";
import {Switch} from "../components/ui/switch";

const QrManager = () => {
    // Состояния дизайна
    const [qrColor, setQrColor] = useState('#863bff');
    const [qrStyle, setQrStyle] = useState('rounded'); // 'square' | 'rounded' | 'dots'
    const [showLogo, setShowLogo] = useState(true);

    // Состояния рамки
    const [hasFrame, setHasFrame] = useState(true);
    const [frameText, setFrameText] = useState('СКАНИРУЙ МЕНЮ');
    const [frameColor, setFrameColor] = useState('#08060d');

    // Состояния пакетной генерации (PRO)
    const [isTableMode, setIsTableMode] = useState(false);
    const [tableCount, setTableCount] = useState(15);

    const presetColors = ['#08060d', '#863bff', '#ef4444', '#f97316', '#22c55e', '#3b82f6'];

    // Имитация узора QR-кода для красивого Live-превью
    const MockQRCode = () => {
        // Три больших угловых квадрата (глаза)
        const Eye = ({styleName}) => {
            const radiusClass = styleName === 'square' ? 'rounded-none' : styleName === 'rounded' ? 'rounded-xl' : 'rounded-full';
            const innerRadius = styleName === 'square' ? 'rounded-none' : styleName === 'rounded' ? 'rounded-md' : 'rounded-full';
            return (
                <div className={`w-14 h-14 border-[5px] flex items-center justify-center ${radiusClass}`}
                     style={{borderColor: qrColor}}>
                    <div className={`w-6 h-6 ${innerRadius}`} style={{backgroundColor: qrColor}}></div>
                </div>
            );
        };

        // Мелкие элементы узора
        const generateDots = () => {
            let dots = [];
            const dotRadius = qrStyle === 'square' ? 'rounded-none' : qrStyle === 'rounded' ? 'rounded-sm' : 'rounded-full';
            for (let i = 0; i < 48; i++) {
                // Пропускаем места под логотип и глаза
                if ([0, 1, 2, 6, 7, 8, 12, 13, 14, 30, 31, 32, 36, 37, 38, 42, 43, 44, 4, 5, 10, 11, 16, 17].includes(i)) continue;
                dots.push(
                    <div key={i} className={`w-3.5 h-3.5 ${dotRadius} opacity-90`}
                         style={{backgroundColor: qrColor}}></div>
                );
            }
            return dots;
        };

        return (
            <div className="relative w-48 h-48 bg-white p-2">
                <div className="absolute top-2 left-2"><Eye styleName={qrStyle}/></div>
                <div className="absolute top-2 right-2"><Eye styleName={qrStyle}/></div>
                <div className="absolute bottom-2 left-2"><Eye styleName={qrStyle}/></div>

                {/* Сетка случайных точек */}
                <div className="absolute inset-0 grid grid-cols-6 gap-2 p-2 place-items-center">
                    {generateDots()}
                </div>

                {/* Центральный логотип */}
                {showLogo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div
                            className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm p-1 z-10">
                            <div
                                className="w-full h-full bg-brand-purple rounded-lg flex items-center justify-center text-white">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                </svg>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 relative min-h-[calc(100vh-8rem)]">

            {/* ЛЕВАЯ КОЛОНКА: НАСТРОЙКИ */}
            <div className="flex-1 space-y-6">

                {/* Заголовок */}
                <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-3xl shadow-sm">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Управление
                        QR-кодами</h1>
                    <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                        Настройте внешний вид QR-кода под стиль вашего заведения. Скачайте один код для тейбл-тентов или
                        сгенерируйте уникальные коды для каждого стола.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* БЛОК 1: ДИЗАЙН */}
                    <div className="bg-card border border-border/60 p-6 rounded-3xl shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                            <div
                                className="w-8 h-8 rounded-lg bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                                <Palette size={18}/>
                            </div>
                            <h2 className="font-bold text-lg text-foreground">Дизайн кода</h2>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Форма
                                элементов</Label>
                            <div
                                className="grid grid-cols-3 gap-2 bg-secondary/30 p-1 rounded-xl border border-input/50">
                                <button
                                    onClick={() => setQrStyle('square')}
                                    className={`py-2 text-sm font-medium rounded-lg transition-all ${qrStyle === 'square' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >Квадраты
                                </button>
                                <button
                                    onClick={() => setQrStyle('rounded')}
                                    className={`py-2 text-sm font-medium rounded-lg transition-all ${qrStyle === 'rounded' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >Мягкие
                                </button>
                                <button
                                    onClick={() => setQrStyle('dots')}
                                    className={`py-2 text-sm font-medium rounded-lg transition-all ${qrStyle === 'dots' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >Точки
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Цвет
                                узора</Label>
                            <div className="flex items-center gap-3">
                                {presetColors.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setQrColor(color)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${qrColor === color ? 'border-foreground shadow-md' : 'border-transparent'}`}
                                        style={{backgroundColor: color}}
                                    />
                                ))}
                                <div className="h-6 w-px bg-border mx-1"></div>
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={qrColor}
                                        onChange={(e) => setQrColor(e.target.value)}
                                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                    />
                                    <div
                                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-secondary cursor-pointer overflow-hidden">
                                        <div className="w-full h-full" style={{backgroundColor: qrColor}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shadow-sm">
                                    <ImageIcon size={20} className="text-muted-foreground"/>
                                </div>
                                <div>
                                    <Label className="font-bold cursor-pointer" htmlFor="logo-switch">Логотип в
                                        центре</Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">Повышает доверие к коду</p>
                                </div>
                            </div>
                            <Switch id="logo-switch" checked={showLogo} onCheckedChange={setShowLogo}
                                    className="data-[state=checked]:bg-brand-purple"/>
                        </div>
                    </div>

                    {/* БЛОК 2: РАМКА И CTA */}
                    <div className="bg-card border border-border/60 p-6 rounded-3xl shadow-sm space-y-6">
                        <div className="flex items-center justify-between border-b border-border/50 pb-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                                    <Type size={18}/>
                                </div>
                                <h2 className="font-bold text-lg text-foreground">Рамка и текст</h2>
                            </div>
                            <Switch checked={hasFrame} onCheckedChange={setHasFrame}
                                    className="data-[state=checked]:bg-orange-500"/>
                        </div>

                        <div
                            className={`space-y-5 transition-opacity ${!hasFrame ? 'opacity-40 pointer-events-none' : ''}`}>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Призыв
                                    к действию</Label>
                                <Input
                                    value={frameText}
                                    onChange={(e) => setFrameText(e.target.value)}
                                    placeholder="Например: СКАНИРУЙ МЕНЮ"
                                    className="h-11 bg-secondary/30 rounded-xl font-medium"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Цвет
                                    рамки</Label>
                                <div className="flex items-center gap-3">
                                    {presetColors.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setFrameColor(color)}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${frameColor === color ? 'border-foreground shadow-md' : 'border-transparent'}`}
                                            style={{backgroundColor: color}}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* БЛОК 3: ГЕНЕРАЦИЯ ПО СТОЛАМ (PRO) */}
                <div
                    className="bg-gradient-to-r from-brand-purple/5 to-blue-500/5 border border-brand-purple/20 p-6 rounded-3xl shadow-sm relative overflow-hidden">
                    <div
                        className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>

                    <div
                        className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between relative z-10">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-lg text-foreground">Генерация для столов</h2>
                                <div
                                    className="flex items-center gap-1 text-[10px] font-bold bg-brand-purple text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm shadow-brand-purple/30">
                                    <Crown size={12}/> PRO
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground max-w-lg">
                                Создайте отдельный QR-код для каждого столика. Это позволит отслеживать аналитику по
                                зонам посадки или внедрить вызов официанта.
                            </p>
                        </div>
                        <Switch checked={isTableMode} onCheckedChange={setIsTableMode}
                                className="data-[state=checked]:bg-brand-purple scale-110"/>
                    </div>

                    {isTableMode && (
                        <div
                            className="mt-6 pt-6 border-t border-brand-purple/10 flex flex-col sm:flex-row gap-4 items-end animate-in fade-in slide-in-from-top-4">
                            <div className="space-y-2 w-full sm:w-auto">
                                <Label className="text-xs font-semibold text-brand-purple uppercase tracking-wider">Количество
                                    столов</Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={tableCount}
                                        onChange={(e) => setTableCount(e.target.value)}
                                        className="h-11 w-24 bg-background border-brand-purple/30 focus:ring-brand-purple/50 text-center font-bold text-lg rounded-xl"
                                    />
                                    <span className="text-sm font-medium text-muted-foreground">шт.</span>
                                </div>
                            </div>

                            <Button
                                className="h-11 w-full sm:w-auto bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl shadow-md px-6">
                                <Layers size={18} className="mr-2"/>
                                Сгенерировать пакет
                            </Button>
                        </div>
                    )}
                </div>

            </div>


            {/* ПРАВАЯ КОЛОНКА: ПРЕВЬЮ И ЭКСПОРТ (Sticky) */}
            <div className="w-full xl:w-[400px] shrink-0">
                <div className="sticky top-24 space-y-6">

                    {/* Превью Карточка */}
                    <div
                        className="bg-card border border-border/60 rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center text-center">

                        <Label
                            className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-6">Предпросмотр</Label>

                        {/* Враппер для Рамки */}
                        <div
                            className={`p-3 bg-white rounded-2xl transition-all duration-300 ${hasFrame ? 'shadow-lg border-2' : 'shadow-sm border border-border/30'}`}
                            style={{borderColor: hasFrame ? frameColor : 'transparent'}}
                        >
                            <MockQRCode/>

                            {hasFrame && (
                                <div
                                    className="mt-3 py-2.5 rounded-xl font-black text-sm tracking-widest text-white px-4 transition-colors"
                                    style={{backgroundColor: frameColor}}
                                >
                                    {frameText || 'СКАНИРУЙТЕ'}
                                </div>
                            )}
                        </div>

                        <div className="mt-8 space-y-3 w-full">
                            {!isTableMode ? (
                                <>
                                    <Button
                                        className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background rounded-xl font-bold text-sm shadow-md">
                                        <FileDown size={18} className="mr-2"/>
                                        Скачать PNG
                                    </Button>
                                    <Button variant="outline"
                                            className="w-full h-12 rounded-xl font-bold text-sm border-border/60 hover:bg-secondary">
                                        <Download size={18} className="mr-2"/>
                                        Скачать вектор (SVG)
                                    </Button>
                                </>
                            ) : (
                                <div
                                    className="bg-secondary/30 border border-border/50 rounded-2xl p-4 text-left space-y-2">
                                    <div className="flex items-center gap-2 text-foreground font-bold">
                                        <Check size={16} className="text-green-500"/>
                                        Готово к генерации
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Будет создан архив (ZIP) содержащий {tableCount} QR-кодов в форматах PNG и SVG,
                                        пронумерованных для каждого стола.
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Быстрая ссылка */}
                    <div
                        className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                        <div className="truncate pr-4">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Прямая
                                ссылка на меню</p>
                            <p className="text-sm font-medium text-brand-purple truncate">kwikmenu.com/cafe-tatiana</p>
                        </div>
                        <button
                            className="w-10 h-10 shrink-0 bg-secondary hover:bg-secondary/80 rounded-xl flex items-center justify-center text-foreground transition-colors border border-border/50 shadow-sm">
                            <Copy size={16}/>
                        </button>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default QrManager;