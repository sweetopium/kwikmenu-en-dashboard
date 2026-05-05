import { Link } from 'react-router-dom';
import {
  Plus, Utensils, Wine, Coffee,
  MoreHorizontal, Calendar, LayoutGrid, ArrowRight, FolderOpen,
  Pencil, Copy, Upload, Download, Trash2
} from 'lucide-react';

import { Button } from "../components/ui/button";
import { primaryActionButtonClasses, subtleIconButtonClasses } from "../lib/uiStyles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

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
  return (
    <div className="mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="bg-card border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="min-w-0">

              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Ваши меню
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                Создавайте отдельные меню для основного зала, сезона, завтраков или специальных предложений
              </p>
            </div>

            <div className="w-full sm:w-auto shrink-0">
              <Button className={`${primaryActionButtonClasses} px-5 shrink-0 cursor-pointer`}>
                <Plus size={18} className="mr-2" />
                Создать меню
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {mockMenus.map((menu) => (
          <div
            key={menu.id}
            className="bg-card border border-border/60 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col group hover:border-brand-purple/30 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${menu.bgColor} ${menu.color} shrink-0`}>
                <menu.icon size={18} />
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

            <div className="mb-6 flex-1 min-w-0">
              <h3 className="text-xl font-bold text-foreground group-hover:text-brand-purple transition-colors truncate">
                {menu.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                {menu.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-xl border border-border/50">
                <LayoutGrid size={14} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Категории</span>
                <span className="text-xs font-black text-foreground">{menu.categoriesCount}</span>
              </div>

              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-xl border border-border/50">
                <FolderOpen size={14} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Блюда</span>
                <span className="text-xs font-black text-foreground">{menu.itemsCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-3 md:pt-4 border-t border-border/50 gap-4 -mb-2 md:-mb-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={14} />
                <span className="text-[11px] font-medium">{menu.lastUpdated}</span>
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`${subtleIconButtonClasses} hover:bg-secondary cursor-pointer`}>
                      <MoreHorizontal size={18} />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent>
                    <DropdownMenuLabel>Действия с меню</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/menu/${menu.id}`}>
                        <Pencil size={16} />
                        Редактировать
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy size={16} />
                      Дублировать
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {menu.status === 'active' ? (
                      <DropdownMenuItem>
                        <Download size={16} />
                        Снять с публикации
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem>
                        <Upload size={16} />
                        Опубликовать
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem variant="destructive">
                      <Trash2 size={16} />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link
                  to={`/dashboard/menu/${menu.id}`}
                  className="h-10 sm:h-12 px-4 rounded-lg bg-foreground hover:bg-foreground/90 text-background font-bold text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  Открыть
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuListPage;
