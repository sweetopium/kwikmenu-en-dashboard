import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Utensils, Wine, Coffee,
  MoreHorizontal, Calendar, LayoutGrid, ArrowRight, FolderOpen,
  Pencil, Copy, Upload, Download, Trash2, QrCode, ToggleLeft, ToggleRight
} from 'lucide-react';

import { Button } from "../components/ui/button";
import { primaryActionButtonClasses, subtleIconButtonClasses } from "../lib/uiStyles";
import { listMenus, publishMenu, unpublishMenu } from "../lib/menusApi";
import { trackProductEvent } from "../lib/productAnalytics";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const MENU_ICON_META = {
  default: { icon: Utensils, color: 'text-brand-purple', bgColor: 'bg-brand-purple/10' },
  draft: { icon: Coffee, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  active: { icon: Wine, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
};

const MenuListPage = () => {
  const [menus, setMenus] = useState([]);
  const [busyMenuId, setBusyMenuId] = useState(null);

  useEffect(() => {
    const activeVenueId = window.localStorage.getItem('kwikmenu-active-venue');
    trackProductEvent('menu_list_viewed', { venueId: activeVenueId });
    listMenus({ venueId: activeVenueId || undefined })
      .then(setMenus)
      .catch(() => setMenus([]));
  }, []);

  const handlePublishToggle = async (menu) => {
    setBusyMenuId(menu.id);
    try {
      const updatedMenu = menu.status === 'active'
        ? await unpublishMenu(menu.id)
        : await publishMenu(menu.id);

      setMenus((currentMenus) =>
        currentMenus.map((currentMenu) =>
          currentMenu.id === menu.id
            ? { ...currentMenu, status: updatedMenu.status, updatedAt: updatedMenu.updatedAt }
            : currentMenu
        )
      );
    } catch (error) {
      console.error('Не удалось обновить статус меню', error);
    } finally {
      setBusyMenuId(null);
    }
  };

  return (
    <div className="mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Шапка страницы */}
      <div className="bg-card border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Ваше меню
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                Добавляйте категории и позиции, обновляйте цены и стоп-лист
              </p>
            </div>

            <div className="w-full sm:w-auto shrink-0">
              <Button asChild className={`${primaryActionButtonClasses} px-5 shrink-0 cursor-pointer`}>
                <Link
                  to="/dashboard/menu/new"
                  onClick={() => trackProductEvent('menu_create_clicked', {
                    venueId: typeof window !== 'undefined' ? window.localStorage.getItem('kwikmenu-active-venue') : null,
                  })}
                >
                  <Plus size={18} className="mr-2" />
                  Создать меню
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Сетка меню */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {menus.map((menu) => {
          const iconMeta = MENU_ICON_META[menu.status] || MENU_ICON_META.default;
          const Icon = iconMeta.icon;

          return (
            <div
              key={menu.id}
              className="bg-card border border-border/60 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col group hover:border-brand-purple/30 hover:shadow-md transition-all"
            >
              {/* Шапка карточки: Иконка, Статус и Меню (...) */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconMeta.bgColor} ${iconMeta.color} shrink-0`}>
                    <Icon size={18} />
                  </div>

                  {menu.status === 'active' ? (
                    <div className="px-2.5 py-1 bg-green-500/10 text-green-600 text-[11px] font-bold uppercase tracking-wider rounded-md border border-green-500/20">
                      Активно
                    </div>
                  ) : (
                    <div className="px-2.5 py-1 bg-secondary text-muted-foreground text-[11px] font-bold uppercase tracking-wider rounded-md border border-border/50">
                      Черновик
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`${subtleIconButtonClasses} -mt-1 -mr-2 hover:bg-secondary cursor-pointer`}>
                      <MoreHorizontal size={20} />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Действия с меню</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link
                        to={`/dashboard/menu/${menu.id}`}
                        onClick={() => trackProductEvent('menu_card_opened', {
                          venueId: menu.venueId,
                          menuId: menu.id,
                          properties: { source: 'menu_card_dropdown' },
                        })}
                      >
                        <Pencil size={16} className="mr-2" />
                        Редактировать
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy size={16} className="mr-2" />
                      Дублировать
                    </DropdownMenuItem>
                    {menu.venueId ? (
                      <DropdownMenuItem asChild>
                        <Link
                          to={`/dashboard/venues/${menu.venueId}?tab=qr`}
                          onClick={() => trackProductEvent('menu_qr_clicked', {
                            venueId: menu.venueId,
                            menuId: menu.id,
                          })}
                        >
                          <QrCode size={16} className="mr-2" />
                          Посмотреть QR меню
                        </Link>
                      </DropdownMenuItem>
                    ) : null}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      <Trash2 size={16} className="mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Тело карточки: Название и описание */}
              <div className="mb-4 flex-1 min-w-0">
                <h3 className="text-xl font-bold text-foreground group-hover:text-brand-purple transition-colors truncate">
                  {menu.name}
                </h3>
                {menu.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                    {menu.description}
                  </p>
                )}
              </div>

              {/* Метаданные: Дата, Категории, Блюда */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5 text-sm text-muted-foreground border-b border-border/50 pb-5">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span className="text-[12px] font-medium">{new Date(menu.updatedAt).toLocaleString('ru-RU')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <LayoutGrid size={14} />
                  <span className="text-[12px] font-medium">{menu.categoriesCount} кат.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FolderOpen size={14} />
                  <span className="text-[12px] font-medium">{menu.itemsCount} блюд</span>
                </div>
              </div>

              {/* Подвал карточки: Кнопки действий (Всегда в один ряд) */}
              <div className="flex flex-row gap-2 sm:gap-3 mt-auto">


                <button
                  type="button"
                  onClick={() => {
                    trackProductEvent(menu.status === 'active' ? 'menu_unpublish_clicked' : 'menu_publish_clicked', {
                      venueId: menu.venueId,
                      menuId: menu.id,
                      properties: { current_status: menu.status },
                    });
                    handlePublishToggle(menu);
                  }}
                  disabled={busyMenuId === menu.id}
                  className={`flex-1 h-10 sm:h-12 px-2 sm:px-3 rounded-lg border font-bold text-xs sm:text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    menu.status === 'active'
                      ? 'border-orange-500/20 bg-orange-500/10 text-orange-600'
                      : 'border-green-500/20 bg-green-500/10 text-green-600'
                  }`}
                >
                  {menu.status === 'active' ? <ToggleLeft size={16} className="shrink-0" /> : <ToggleRight size={16} className="shrink-0" />}
                  <span className="truncate">{busyMenuId === menu.id ? 'Обновление' : menu.status === 'active' ? 'Выкл' : 'Вкл'}</span>
                </button>

                <Link
                  to={`/dashboard/venues/${menu.venueId}?tab=qr`}
                  target={'_blank'}
                  onClick={() => trackProductEvent('menu_qr_clicked', {
                    venueId: menu.venueId,
                    menuId: menu.id,
                    properties: { source: 'menu_card_button' },
                  })}
                  className="flex-1 h-10 sm:h-12 px-2 sm:px-3 rounded-lg bg-foreground hover:bg-foreground/90 text-background font-bold text-xs sm:text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
                >
                  <span className="truncate">Посмотреть QR</span>
                </Link>

                <Link
                  to={`/dashboard/menu/${menu.id}`}
                  onClick={() => trackProductEvent('menu_card_opened', {
                    venueId: menu.venueId,
                    menuId: menu.id,
                    properties: { source: 'menu_card_button' },
                  })}
                  className="flex-1 h-10 sm:h-12 px-2 sm:px-3 rounded-lg bg-foreground hover:bg-foreground/90 text-background font-bold text-xs sm:text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
                >
                  <span className="truncate">Редактор</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MenuListPage;
