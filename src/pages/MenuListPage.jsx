import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  draft: { icon: Utensils, color: 'text-brand-purple', bgColor: 'bg-brand-purple/10' },
  active: { icon: Utensils, color: 'text-brand-purple', bgColor: 'bg-brand-purple/10' },
};

const MenuListPage = () => {
  const { t, i18n } = useTranslation();
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
      console.error('Failed to update menu status', error);
    } finally {
      setBusyMenuId(null);
    }
  };

  return (
    <div className="mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Page header */}
      <div className="bg-card border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {t('menuList.title')}
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                {t('menuList.subtitle')}
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
                  {t('menuList.createBtn')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {menus.map((menu) => {
          const iconMeta = MENU_ICON_META[menu.status] || MENU_ICON_META.default;
          const Icon = iconMeta.icon;

          return (
            <div
              key={menu.id}
              className="bg-card border border-border/60 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col group hover:shadow-xl hover:-translate-y-1 hover:border-brand-purple/30 transition-all duration-300"
            >
              {/* Card header: icon, status, and menu actions */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconMeta.bgColor} ${iconMeta.color} shrink-0 border border-brand-purple/15`}>
                    <Icon size={18} />
                  </div>

                  {menu.status === 'active' ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary/80 text-foreground text-[11px] font-bold uppercase tracking-wider rounded-lg border border-border/40 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      {t('menuList.status.active')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary/40 text-muted-foreground text-[11px] font-bold uppercase tracking-wider rounded-lg border border-border/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                      {t('menuList.status.draft')}
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
                    <DropdownMenuLabel>{t('menuList.dropdown.label')}</DropdownMenuLabel>
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
                        {t('menuList.dropdown.edit')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy size={16} className="mr-2" />
                      {t('menuList.dropdown.duplicate')}
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
                          {t('menuList.dropdown.viewQr')}
                        </Link>
                      </DropdownMenuItem>
                    ) : null}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      <Trash2 size={16} className="mr-2" />
                      {t('menuList.dropdown.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Card body: name and description */}
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

              {/* Metadata: date, categories, items */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5 text-sm text-muted-foreground border-b border-border/50 pb-5">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span className="text-[12px] font-medium">
                    {new Date(menu.updatedAt).toLocaleString('en-US')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <LayoutGrid size={14} />
                  <span className="text-[12px] font-medium">{t('menuList.meta.categoriesCount', { count: menu.categoriesCount })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FolderOpen size={14} />
                  <span className="text-[12px] font-medium">{t('menuList.meta.itemsCount', { count: menu.itemsCount })}</span>
                </div>
              </div>

              {/* Card footer: action buttons */}
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
                  className="flex-1 h-10 sm:h-12 px-1 sm:px-2 rounded-lg border border-border/60 bg-transparent hover:bg-secondary/40 text-muted-foreground hover:text-foreground font-bold text-[10px] sm:text-[11px] flex items-center justify-center gap-1 sm:gap-1.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {menu.status === 'active' ? (
                    <ToggleRight size={14} className="text-brand-purple shrink-0" />
                  ) : (
                    <ToggleLeft size={14} className="text-muted-foreground/60 shrink-0" />
                  )}
                  <span className="truncate">
                    {busyMenuId === menu.id
                      ? t('menuList.actions.updating')
                      : menu.status === 'active'
                      ? t('menuList.actions.turnOff')
                      : t('menuList.actions.turnOn')}
                  </span>
                </button>

                <Link
                  to={`/dashboard/venues/${menu.venueId}?tab=qr`}
                  target={'_blank'}
                  onClick={() => trackProductEvent('menu_qr_clicked', {
                    venueId: menu.venueId,
                    menuId: menu.id,
                    properties: { source: 'menu_card_button' },
                  })}
                  className="flex-1 h-10 sm:h-12 px-1 sm:px-2 rounded-lg border border-border/60 bg-transparent hover:bg-secondary/40 text-foreground font-bold text-[10px] sm:text-[11px] flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer"
                >
                  <QrCode size={14} className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="truncate">{t('menuList.actions.viewQr')}</span>
                </Link>

                <Link
                  to={`/dashboard/menu/${menu.id}`}
                  onClick={() => trackProductEvent('menu_card_opened', {
                    venueId: menu.venueId,
                    menuId: menu.id,
                    properties: { source: 'menu_card_button' },
                  })}
                  className="flex-1 h-10 sm:h-12 px-1 sm:px-2 rounded-lg bg-brand-purple hover:bg-brand-purple/90 text-white font-bold text-[10px] sm:text-[11px] flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-brand-purple/20"
                >
                  <Pencil size={14} className="shrink-0 text-white/80" />
                  <span className="truncate">{t('menuList.actions.editor')}</span>
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
