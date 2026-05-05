import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Building2,
  UserRound,
  CreditCard,
  LogOut,
  Menu as MenuIcon,
  Zap,
  X,
  LifeBuoy
} from 'lucide-react';
import { subtleIconButtonClasses } from "../lib/uiStyles";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Обзор', path: '/dashboard' },
  { icon: UtensilsCrossed, label: 'Меню', path: '/dashboard/menu' },
  { icon: Building2, label: 'Заведения', path: '/dashboard/venues' },
  { icon: UserRound, label: 'Аккаунт', path: '/dashboard/account' },
  { icon: CreditCard, label: 'Биллинг', path: '/dashboard/billing' },
];

const SidebarContent = ({ pathname, onNavigate }) => (
  <>
    <div className="p-6 flex items-center gap-3 text-xl font-extrabold tracking-tight text-foreground">
      <div className="flex h-8 w-8 items-center justify-center rounded-[0.6rem] bg-brand-purple text-white shadow-md shadow-brand-purple/20 shrink-0">
        <Zap className="h-4 w-4" fill="currentColor" />
      </div>
      <span className="truncate">KwikMenu</span>
    </div>

    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-1">
      Главное меню
    </div>

    <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = item.path === '/dashboard'
          ? pathname === item.path
          : pathname === item.path || pathname.startsWith(`${item.path}/`);

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 group min-w-0 ${
              isActive
                ? 'bg-brand-purple/10 text-brand-purple'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            <item.icon
              size={18}
              className={`shrink-0 ${
                isActive
                  ? 'text-brand-purple'
                  : 'text-muted-foreground group-hover:text-foreground transition-colors'
              }`}
            />

            <span className="truncate">{item.label}</span>

            {isActive && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-purple shrink-0" />
            )}
          </Link>
        );
      })}
    </nav>

    <div className="p-4 mt-auto">
      <div className="bg-secondary/40 border border-border/50 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 font-bold text-sm text-foreground mb-1">
          <LifeBuoy size={16} className="text-brand-purple shrink-0" />
          <span className="truncate">Нужна помощь?</span>
        </div>

        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          Напишите нашему менеджеру, мы всегда на связи.
        </p>

        <button className="w-full h-11 text-xs font-bold bg-background border border-border hover:bg-secondary transition-colors rounded-lg text-foreground">
          Написать в поддержку
        </button>
      </div>

      <button className="flex items-center gap-3 px-3 h-11 w-full text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors group min-w-0">
        <LogOut size={18} className="group-hover:text-destructive transition-colors shrink-0" />
        <span className="truncate">Выйти</span>
      </button>
    </div>
  </>
);

const DashboardLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-secondary/20">
      {/* ДЕСКТОП Сайдбар */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border/60 fixed inset-y-0 z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] overflow-x-hidden">
        <SidebarContent pathname={location.pathname} />
      </aside>

      {/* МОБИЛЬНЫЙ Сайдбар: оверлей */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* МОБИЛЬНЫЙ Сайдбар: шторка */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-card border-r border-border/60 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col overflow-x-hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-6 right-4">
          <button onClick={() => setIsMobileMenuOpen(false)} className={`${subtleIconButtonClasses} hover:bg-secondary`}>
            <X size={20} />
          </button>
        </div>

        <SidebarContent pathname={location.pathname} onNavigate={() => setIsMobileMenuOpen(false)} />
      </aside>

      {/* Основной контент */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen w-full max-w-full min-w-0 overflow-x-hidden">
        {/* Хедер */}
        <header className="h-16 border-b border-border/60 flex items-center justify-between px-4 sm:px-8 bg-card/80 backdrop-blur-xl sticky top-0 z-10 w-full max-w-full min-w-0 overflow-hidden shrink-0">
          <div className="md:hidden flex items-center gap-3 min-w-0">
            <button onClick={() => setIsMobileMenuOpen(true)} className={`${subtleIconButtonClasses} -ml-2 hover:bg-secondary shrink-0`}>
              <MenuIcon size={22} />
            </button>

            <div className="flex h-7 w-7 items-center justify-center rounded-[0.5rem] bg-brand-purple text-white shadow-sm shrink-0">
              <Zap className="h-3 w-3" fill="currentColor" />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4 min-w-0 shrink-0">
            <div className="text-right hidden sm:block min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                Кафе «Татьяна»
              </p>

              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                <p className="text-[10px] font-bold tracking-wider uppercase text-brand-purple truncate">
                  PRO-тариф
                </p>
              </div>
            </div>

            <button className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-purple to-blue-500 p-[2px] transition-transform hover:scale-105 shrink-0">
              <div className="w-full h-full rounded-full bg-card border-2 border-transparent flex items-center justify-center font-bold text-sm text-foreground overflow-hidden">
                ТВ
              </div>
            </button>
          </div>
        </header>

        {/* Область под контент */}
        <div className="flex-1 p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-full min-w-0 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
