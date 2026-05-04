import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Utensils, Wine, Coffee,
  MoreHorizontal, Calendar, LayoutGrid, ArrowRight, FolderOpen
} from 'lucide-react';

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

// Мок-данные списка меню
const mockMenus = [
  {
    id: 'main',
    name: 'Основное меню',
    description: 'Ежедневное меню с основными позициями, завтраками и десертами.',
    status: 'active',
    itemsCount: 42,
    categoriesCount: 6,
    icon: Utensils,
    color: 'text-brand-purple',
    bgColor: 'bg-brand-purple/10',
    lastUpdated: 'Сегодня, 14:30'
  },
  {
    id: 'bar',
    name: 'Барная карта',
    description: 'Алкогольные и безалкогольные напитки, авторские коктейли.',
    status: 'active',
    itemsCount: 128,
    categoriesCount: 8,
    icon: Wine,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    lastUpdated: 'Вчера, 18:15'
  },
  {
    id: 'seasonal',
    name: 'Сезонное меню (Лето)',
    description: 'Специальные летние предложения, холодные супы и лимонады.',
    status: 'draft',
    itemsCount: 14,
    categoriesCount: 2,
    icon: Coffee,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    lastUpdated: '12 мая 2026'
  }
];

const MenuListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMenus = mockMenus.filter(menu =>
    menu.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

      {/* Хедер страницы */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/60 p-6 sm:p-8 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Ваши меню</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Создавайте разные меню для разных залов, сезонов или времени суток. Гость увидит то меню, QR-код которого отсканирует.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative hidden sm:block w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Поиск меню..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 bg-secondary/30 rounded-xl w-full"
            />
          </div>
          <Button className="bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl shadow-md px-6 h-11 transition-all cursor-pointer">
            <Plus size={18} className="mr-2" />
            Создать меню
          </Button>
        </div>
      </div>

      {/* Мобильный поиск */}
      <div className="relative sm:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          placeholder="Поиск меню..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-11 bg-card rounded-xl w-full border-border/60 shadow-sm"
        />
      </div>

      {/* Сетка карточек меню */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {filteredMenus.map((menu) => (
          <div
            key={menu.id}
            className="bg-card border border-border/60 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col group hover:border-brand-purple/30 hover:shadow-md transition-all"
          >
            {/* Иконка и Статус */}
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${menu.bgColor} ${menu.color}`}>
                <menu.icon size={26} />
              </div>

              {menu.status === 'active' ? (
                <div className="px-3 py-1 bg-green-500/10 text-green-600 text-[11px] font-bold uppercase tracking-wider rounded-lg border border-green-500/20">
                  Активно
                </div>
              ) : (
                <div className="px-3 py-1 bg-secondary text-muted-foreground text-[11px] font-bold uppercase tracking-wider rounded-lg border border-border/50">
                  Черновик
                </div>
              )}
            </div>

            {/* Инфо */}
            <div className="mb-6 flex-1">
              <h3 className="text-xl font-bold text-foreground group-hover:text-brand-purple transition-colors">
                {menu.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                {menu.description}
              </p>
            </div>

            {/* Статистика - в виде аккуратных капсул */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-xl border border-border/50">
                <LayoutGrid size={14} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Категории:</span>
                <span className="text-xs font-black text-foreground">{menu.categoriesCount}</span>
              </div>

              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-xl border border-border/50">
                <FolderOpen size={14} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Блюда:</span>
                <span className="text-xs font-black text-foreground">{menu.itemsCount}</span>
              </div>
            </div>

            {/* Дата и Действия */}
            <div className="flex items-center justify-between mt-auto pt-5 border-t border-border/50 gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={14} />
                <span className="text-[11px] font-medium">{menu.lastUpdated}</span>
              </div>

              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <MoreHorizontal size={18} />
                </button>
                <Link
                  to={`/dashboard/menu/${menu.id}`}
                  className="h-10 px-4 rounded-xl bg-foreground hover:bg-foreground/90 text-background font-bold text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  Открыть
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Карточка создания нового меню */}
        <div className="border-2 border-dashed border-border/60 rounded-3xl p-6 sm:p-7 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-secondary/20 hover:border-brand-purple/30 transition-all group min-h-[350px]">
          <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center text-muted-foreground group-hover:text-brand-purple group-hover:bg-brand-purple/10 group-hover:scale-110 transition-all duration-300 mb-4">
            <Plus size={32} />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Новое меню</h3>
          <p className="text-sm text-muted-foreground max-w-[200px]">Создайте меню с нуля или импортируйте из файла</p>
        </div>
      </div>
    </div>
  );
};

export default MenuListPage;