import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Eye,
  ArrowUpRight, QrCode,
  Check, ChevronDown, ExternalLink, Pencil
} from 'lucide-react';

import { Button } from "../components/ui/button";
import { secondaryActionButtonClasses } from "../lib/uiStyles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const PRIMARY_MENU_ID = 'main';
const PUBLIC_MENU_URL = 'https://kwikmenu.com/cafe-tatiana';
const PERIOD_OPTIONS = ['Сегодня', 'Вчера', 'Последние 7 дней', 'Последние 30 дней'];

// Мок-данные для графика (оставляем 7 дней, они красиво растянутся)
const chartData = [
  { day: 'Пн', views: 120, unique: 85 },
  { day: 'Вт', views: 145, unique: 110 },
  { day: 'Ср', views: 110, unique: 90 },
  { day: 'Чт', views: 180, unique: 140 },
  { day: 'Пт', views: 320, unique: 250 },
  { day: 'Сб', views: 410, unique: 310 },
  { day: 'Вс', views: 380, unique: 280 },
];

const DashboardHome = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Последние 7 дней');

  // Максимальное значение для расчета высоты столбцов графика
  const maxViews = Math.max(...chartData.map(d => d.views));

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

      {/* Хедер с приветствием */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Доброе утро, Татьяна! 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Вот как обстоят дела в вашем заведении сегодня.</p>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={`${secondaryActionButtonClasses} bg-card shadow-sm px-5`}>
                <span className="flex items-center gap-2">
                  {selectedPeriod}
                  <ChevronDown size={16} className="text-muted-foreground" />
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="min-w-[220px]">
              {PERIOD_OPTIONS.map((period) => (
                <DropdownMenuItem
                  key={period}
                  onSelect={() => setSelectedPeriod(period)}
                  className="justify-between"
                >
                  <span>{period}</span>
                  {selectedPeriod === period ? <Check size={16} className="text-brand-purple" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* КАРТОЧКИ СТАТИСТИКИ (KPI) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">

        {/* Карточка 1: Просмотры */}
        <div className="bg-card border border-border/60 p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm group hover:border-brand-purple/30 transition-colors min-h-[148px] sm:min-h-0">
          <div className="flex justify-between items-start">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
              <Eye size={18} className="sm:hidden" />
              <Eye size={24} className="hidden sm:block" />
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
              <ArrowUpRight size={14} className="sm:hidden" />
              <ArrowUpRight size={16} className="hidden sm:block" /> 14%
            </div>
          </div>
          <div className="mt-4 sm:mt-6">
            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.12em] sm:tracking-wider">Открытия меню</p>
            <h3 className="text-3xl sm:text-4xl font-black text-foreground mt-1 leading-none">1,665</h3>
          </div>
        </div>

        {/* Карточка 2: Уникальные */}
        <div className="bg-card border border-border/60 p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm group hover:border-blue-500/30 transition-colors min-h-[148px] sm:min-h-0">
          <div className="flex justify-between items-start">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users size={18} className="sm:hidden" />
              <Users size={24} className="hidden sm:block" />
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
              <ArrowUpRight size={14} className="sm:hidden" />
              <ArrowUpRight size={16} className="hidden sm:block" /> 8%
            </div>
          </div>
          <div className="mt-4 sm:mt-6">
            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.12em] sm:tracking-wider">Уникальные гости</p>
            <h3 className="text-3xl sm:text-4xl font-black text-foreground mt-1 leading-none">1,260</h3>
          </div>
        </div>

      </div>

      {/* ОСНОВНОЙ БЛОК: ГРАФИК (Теперь на 100% ширины) */}
      <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-foreground">Динамика просмотров</h2>
            <p className="text-sm text-muted-foreground mt-1">Сравнение открытий меню и уникальных гостей</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-md bg-brand-purple"></div>Просмотры</div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-md bg-secondary border border-border"></div>Уникальные</div>
          </div>
        </div>

        {/* Широкий график */}
        <div className="flex-1 flex items-end justify-between gap-2 sm:gap-6 mt-auto pt-6 border-b border-border/50 pb-4 relative min-h-[240px] lg:min-h-[300px]">
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
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-foreground text-background text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap absolute -mt-12 pointer-events-none shadow-md">
                  {data.views} / {data.unique}
                </div>

                <div className="relative w-full max-w-[50px] lg:max-w-[70px] h-[200px] lg:h-[260px] flex items-end justify-center gap-1 sm:gap-1.5">
                  <div
                    className={`w-1/2 rounded-t-lg transition-all duration-500 group-hover:brightness-110 ${isWeekend ? 'bg-brand-purple' : 'bg-brand-purple/60'}`}
                    style={{ height: heightViews }}
                  ></div>
                  <div
                    className="w-1/2 bg-secondary border border-border/50 border-b-0 rounded-t-lg transition-all duration-500 group-hover:bg-secondary/70"
                    style={{ height: heightUnique }}
                  ></div>
                </div>
                <span className={`text-sm font-bold mt-4 ${isWeekend ? 'text-brand-purple' : 'text-muted-foreground'}`}>{data.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* БЫСТРЫЕ ДЕЙСТВИЯ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Link
          to={`/dashboard/menu/${PRIMARY_MENU_ID}`}
          className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between group hover:border-foreground/20 transition-all hover:-translate-y-1 min-h-[220px] sm:min-h-[250px]"
        >
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-8 group-hover:bg-foreground group-hover:text-background transition-colors">
            <Pencil size={28} />
          </div>
          <div>
            <h3 className="font-bold text-xl text-foreground">Открыть редактор меню</h3>
            <p className="text-sm text-muted-foreground mt-1">Изменить категории, позиции и переводы</p>
          </div>
        </Link>

        <Link
          to="/dashboard/qr"
          className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between group hover:border-foreground/20 transition-all hover:-translate-y-1 min-h-[220px] sm:min-h-[250px]"
        >
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-8 group-hover:bg-foreground group-hover:text-background transition-colors">
            <QrCode size={28} />
          </div>
          <div>
            <h3 className="font-bold text-xl text-foreground">Скачать QR-коды</h3>
            <p className="text-sm text-muted-foreground mt-1">Для печати и соцсетей</p>
          </div>
        </Link>

        <a
          href={PUBLIC_MENU_URL}
          target="_blank"
          rel="noreferrer"
          className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between group hover:border-foreground/20 transition-all hover:-translate-y-1 min-h-[220px] sm:min-h-[250px]"
        >
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-8 group-hover:bg-foreground group-hover:text-background transition-colors">
            <ExternalLink size={28} />
          </div>
          <div>
            <h3 className="font-bold text-xl text-foreground">Открыть публичное меню</h3>
            <p className="text-sm text-muted-foreground mt-1">Проверить, как меню видят гости</p>
          </div>
        </a>
      </div>

    </div>
  );
};

export default DashboardHome;