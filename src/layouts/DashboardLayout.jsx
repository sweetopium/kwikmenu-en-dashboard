import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Building2,
  UserRound,
  CreditCard,
  Sparkles,
  Check,
  ChevronDown,
  LogOut,
  Menu as MenuIcon,
  Zap,
  X,
  LifeBuoy,
  Plus
} from 'lucide-react';
import { subtleIconButtonClasses } from "../lib/uiStyles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const MOCK_VENUES = [
  { id: 'cafe-tatiana', name: 'Кафе «Татьяна»', plan: 'PRO-тариф' },
  { id: 'coffee-arbat', name: 'Кофейня на Арбате', plan: 'PRO-тариф' },
];

const SidebarContent = ({ pathname, navItems, onNavigate }) => (
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
      {navItems.map((item) => {
        const isActive = item.path === '/dashboard'
          ? pathname === item.path
          : item.path.startsWith('/dashboard/venues/')
            ? pathname === '/dashboard/venues' || pathname.startsWith('/dashboard/venues/')
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
  const navigate = useNavigate();
  const [activeVenueId, setActiveVenueId] = useState(() => {
    if (typeof window === 'undefined') {
      return MOCK_VENUES[0].id;
    }

    return window.localStorage.getItem('kwikmenu-active-venue') || MOCK_VENUES[0].id;
  });

  const activeVenue = MOCK_VENUES.find((venue) => venue.id === activeVenueId) || MOCK_VENUES[0];

  const navItems = [
    { icon: LayoutDashboard, label: 'Обзор', path: '/dashboard' },
    { icon: UtensilsCrossed, label: 'Меню', path: '/dashboard/menu' },
    { icon: Building2, label: 'Заведение', path: `/dashboard/venues/${activeVenue.id}` },
    { icon: UserRound, label: 'Аккаунт', path: '/dashboard/account' },
    { icon: CreditCard, label: 'Биллинг', path: '/dashboard/billing' },
    { icon: Sparkles, label: 'Подписка', path: '/dashboard/subscription' },
  ];

  const handleVenueSwitch = (venueId) => {
    setActiveVenueId(venueId);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('kwikmenu-active-venue', venueId);
    }

    if (location.pathname.startsWith('/dashboard/venues/')) {
      navigate(`/dashboard/venues/${venueId}`);
    }
  };

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-secondary/20">
      {/* ДЕСКТОП Сайдбар */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border/60 fixed inset-y-0 z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] overflow-x-hidden">
        <SidebarContent pathname={location.pathname} navItems={navItems} />
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

        <SidebarContent pathname={location.pathname} navItems={navItems} onNavigate={() => setIsMobileMenuOpen(false)} />
      </aside>

      {/* Основной контент */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen w-full max-w-full min-w-0 overflow-x-hidden">
        {/* Хедер */}
        <header className="h-18 border-b border-border/60 flex items-center justify-between px-4 sm:px-8 bg-card/80 backdrop-blur-xl sticky top-0 z-10 w-full max-w-full min-w-0 overflow-hidden shrink-0">
          <div className="md:hidden flex items-center gap-3 min-w-0">
            <button onClick={() => setIsMobileMenuOpen(true)} className={`${subtleIconButtonClasses} -ml-2 hover:bg-secondary shrink-0`}>
              <MenuIcon size={22} />
            </button>

            <div className="flex h-7 w-7 items-center justify-center rounded-[0.5rem] bg-brand-purple text-white shadow-sm shrink-0">
              <Zap className="h-3 w-3" fill="currentColor" />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3 min-w-0 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 hover:bg-secondary/50 transition-colors min-w-0 max-w-[220px] sm:max-w-[280px]">
                  <div className="text-left sm:text-right min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {activeVenue.name}
                    </p>

                    <div className="flex items-center justify-start sm:justify-end gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                      <p className="text-[10px] font-bold tracking-wider uppercase text-brand-purple truncate">
                        {activeVenue.plan}
                      </p>
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="min-w-[260px]">
                <DropdownMenuLabel>Текущее заведение</DropdownMenuLabel>
                {MOCK_VENUES.map((venue) => (
                  <DropdownMenuItem
                    key={venue.id}
                    onSelect={() => handleVenueSwitch(venue.id)}
                    className="justify-between"
                  >
                    <span>{venue.name}</span>
                    {activeVenue.id === venue.id ? <Check size={16} className="text-brand-purple" /> : null}
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <DropdownMenuItem onSelect={() => navigate('/dashboard/venues')}>
                  <Plus size={16} />
                  Добавить заведение
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
