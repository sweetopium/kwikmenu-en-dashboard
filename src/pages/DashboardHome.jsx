import {useState} from 'react';
import {
    Users, Eye, MousePointerClick, Clock,
    ArrowUpRight, ArrowDownRight, QrCode, Plus,
    ChevronDown, TrendingUp, MoreHorizontal, Image as ImageIcon
} from 'lucide-react';

import {Button} from "../components/ui/button";

// Мок-данные для графика
const chartData = [
    {day: 'Пн', views: 120, unique: 85},
    {day: 'Вт', views: 145, unique: 110},
    {day: 'Ср', views: 110, unique: 90},
    {day: 'Чт', views: 180, unique: 140},
    {day: 'Пт', views: 320, unique: 250},
    {day: 'Сб', views: 410, unique: 310},
    {day: 'Вс', views: 380, unique: 280},
];

// Мок-данные для популярных позиций
const topItems = [
    {id: 1, name: 'Скуратов эспрессо', category: 'Классика', clicks: 245, trend: '+12%'},
    {id: 2, name: 'Чизкейк Сан-Себастьян', category: 'Десерты', clicks: 190, trend: '+8%'},
    {id: 3, name: 'Круассан с лососем', category: 'Плотно перекусить', clicks: 156, trend: '-3%'},
    {id: 4, name: 'Матча-латте с малиновой пеной', category: 'Сезонное', clicks: 130, trend: '+24%'},
    {id: 5, name: 'Эспрессо-тоник', category: 'Холодные напитки', clicks: 98, trend: '+5%'},
];

const DashboardHome = () => {
    const [timeRange, setTimeRange] = useState('7d'); // '7d', '30d', 'all'

    // Максимальное значение для расчета высоты столбцов графика
    const maxViews = Math.max(...chartData.map(d => d.views));

    return (
        <div
            className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

            {/* Хедер с приветствием */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Доброе утро,
                        Татьяна! 👋</h1>
                    <p className="text-sm text-muted-foreground mt-1">Вот как обстоят дела в вашем заведении
                        сегодня.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline"
                            className="bg-card border-border/60 hover:bg-secondary/50 rounded-xl font-semibold shadow-sm">
            <span className="flex items-center gap-2">
              За последние 7 дней
              <ChevronDown size={16} className="text-muted-foreground"/>
            </span>
                    </Button>
                    <Button
                        className="bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl shadow-md px-5 hidden sm:flex">
                        <Plus size={18} className="mr-2"/>
                        Добавить блюдо
                    </Button>
                </div>
            </div>

            {/* КАРТОЧКИ СТАТИСТИКИ (KPI) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Карточка 1 */}
                <div
                    className="bg-card border border-border/60 p-5 sm:p-6 rounded-3xl shadow-sm group hover:border-brand-purple/30 transition-colors">
                    <div className="flex justify-between items-start">
                        <div
                            className="w-10 h-10 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                            <Eye size={20}/>
                        </div>
                        <div
                            className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
                            <ArrowUpRight size={14}/> 14%
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Открытия
                            меню</p>
                        <h3 className="text-3xl font-black text-foreground mt-1">1,665</h3>
                    </div>
                </div>

                {/* Карточка 2 */}
                <div
                    className="bg-card border border-border/60 p-5 sm:p-6 rounded-3xl shadow-sm group hover:border-blue-500/30 transition-colors">
                    <div className="flex justify-between items-start">
                        <div
                            className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <Users size={20}/>
                        </div>
                        <div
                            className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
                            <ArrowUpRight size={14}/> 8%
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Уникальные
                            гости</p>
                        <h3 className="text-3xl font-black text-foreground mt-1">1,260</h3>
                    </div>
                </div>

                {/* Карточка 3 */}
                <div
                    className="bg-card border border-border/60 p-5 sm:p-6 rounded-3xl shadow-sm group hover:border-orange-500/30 transition-colors">
                    <div className="flex justify-between items-start">
                        <div
                            className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                            <MousePointerClick size={20}/>
                        </div>
                        <div
                            className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
                            <ArrowUpRight size={14}/> 22%
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Клики по
                            блюдам</p>
                        <h3 className="text-3xl font-black text-foreground mt-1">842</h3>
                    </div>
                </div>

                {/* Карточка 4 */}
                <div
                    className="bg-card border border-border/60 p-5 sm:p-6 rounded-3xl shadow-sm group hover:border-green-500/30 transition-colors">
                    <div className="flex justify-between items-start">
                        <div
                            className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
                            <Clock size={20}/>
                        </div>
                        <div
                            className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md">
                            <ArrowDownRight size={14}/> 2%
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Среднее
                            время</p>
                        <h3 className="text-3xl font-black text-foreground mt-1">01:45 <span
                            className="text-sm font-medium text-muted-foreground tracking-normal">мин</span></h3>
                    </div>
                </div>
            </div>

            {/* ОСНОВНОЙ БЛОК: ГРАФИК И ТОП БЛЮД */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

                {/* График (Занимает 2 колонки) */}
                <div
                    className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm lg:col-span-2 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Динамика просмотров</h2>
                            <p className="text-xs text-muted-foreground mt-1">Сравнение открытий меню и уникальных
                                гостей</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-brand-purple"></div>
                                Просмотры
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-secondary border border-border"></div>
                                Уникальные
                            </div>
                        </div>
                    </div>

                    {/* Сам график (Стилизован на Flexbox без библиотек) */}
                    <div
                        className="flex-1 flex items-end justify-between gap-2 sm:gap-4 mt-auto pt-6 border-b border-border/50 pb-4 relative min-h-[200px]">
                        {/* Горизонтальные линии сетки */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-full border-t border-dashed border-border/40"></div>
                            ))}
                        </div>

                        {chartData.map((data, index) => {
                            const heightViews = `${(data.views / maxViews) * 100}%`;
                            const heightUnique = `${(data.unique / maxViews) * 100}%`;
                            const isWeekend = data.day === 'Сб' || data.day === 'Вс';

                            return (
                                <div key={index} className="flex flex-col items-center flex-1 group z-10">
                                    {/* Тултип (появляется при ховере) */}
                                    <div
                                        className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap absolute -mt-10 pointer-events-none shadow-md">
                                        {data.views} / {data.unique}
                                    </div>

                                    <div
                                        className="relative w-full max-w-[40px] h-[180px] flex items-end justify-center gap-0.5 sm:gap-1">
                                        {/* Столбец 1: Просмотры */}
                                        <div
                                            className={`w-1/2 rounded-t-md transition-all duration-500 group-hover:brightness-110 ${isWeekend ? 'bg-brand-purple' : 'bg-brand-purple/60'}`}
                                            style={{height: heightViews}}
                                        ></div>
                                        {/* Столбец 2: Уникальные */}
                                        <div
                                            className="w-1/2 bg-secondary border border-border/50 border-b-0 rounded-t-md transition-all duration-500 group-hover:bg-secondary/70"
                                            style={{height: heightUnique}}
                                        ></div>
                                    </div>
                                    <span
                                        className={`text-xs font-semibold mt-3 ${isWeekend ? 'text-brand-purple' : 'text-muted-foreground'}`}>{data.day}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Топ популярных блюд (1 колонка) */}
                <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-foreground">Топ позиций</h2>
                        <button
                            className="text-brand-purple hover:bg-brand-purple/10 p-1.5 rounded-lg transition-colors">
                            <TrendingUp size={18}/>
                        </button>
                    </div>

                    <div className="flex-1 space-y-4">
                        {topItems.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-3 group">
                                <div
                                    className="w-12 h-12 rounded-xl bg-secondary/50 border border-border/50 flex items-center justify-center shrink-0">
                                    {index < 3 ? (
                                        <span className="text-lg font-black text-brand-purple/30">{index + 1}</span>
                                    ) : (
                                        <ImageIcon size={18} className="text-muted-foreground/30"/>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-foreground truncate group-hover:text-brand-purple transition-colors">{item.name}</h4>
                                    <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider mt-0.5">{item.category}</p>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="text-sm font-black text-foreground">{item.clicks}</p>
                                    <p className={`text-[10px] font-bold ${item.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                                        {item.trend}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button variant="outline"
                            className="w-full mt-6 rounded-xl border-border/60 hover:bg-secondary font-semibold text-xs">
                        Смотреть всю аналитику
                    </Button>
                </div>
            </div>

            {/* БЫСТРЫЕ ДЕЙСТВИЯ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div
                    className="bg-gradient-to-br from-brand-purple to-indigo-600 rounded-3xl p-6 text-white shadow-md shadow-brand-purple/20 relative overflow-hidden flex flex-col justify-between group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1">
                    <div
                        className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
                    <div
                        className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
                        <QrCode size={24}/>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Скачать QR-коды</h3>
                        <p className="text-sm text-white/80 mt-1">Для печати и соцсетей</p>
                    </div>
                </div>

                <div
                    className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between group cursor-pointer hover:border-foreground/20 transition-all hover:-translate-y-1">
                    <div
                        className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-foreground group-hover:text-background transition-colors">
                        <Plus size={24}/>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-foreground">Добавить позицию</h3>
                        <p className="text-sm text-muted-foreground mt-1">Обновить меню новинками</p>
                    </div>
                </div>

                <div
                    className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between group cursor-pointer hover:border-foreground/20 transition-all hover:-translate-y-1">
                    <div
                        className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-foreground group-hover:text-background transition-colors">
                        <MoreHorizontal size={24}/>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-foreground">Настройки дизайна</h3>
                        <p className="text-sm text-muted-foreground mt-1">Изменить цвета и логотип</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DashboardHome;