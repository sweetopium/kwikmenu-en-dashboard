import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { listVenues } from "../lib/venuesApi";
import { logoutSession } from "../lib/sessionApi";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { fetchBillingSummary } from "../lib/billingApi";

const SidebarContent = ({ pathname, navItems, onNavigate, onLogout }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="p-6 flex items-center gap-3 text-xl font-extrabold tracking-tight text-foreground">
        <div className="flex h-8 w-8 items-center justify-center rounded-[0.6rem] bg-brand-purple text-white shadow-md shadow-brand-purple/20 shrink-0">
          <Zap className="h-4 w-4" fill="currentColor" />
        </div>
        <span className="truncate">KwikMenu</span>
      </div>

      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-1">
        {t('navigation.mainMenu', 'Главное меню')}
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

      <div className="p-4 mt-auto flex flex-col gap-1.5">
        <div className="bg-secondary/40 border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground mb-1">
            <LifeBuoy size={16} className="text-brand-purple shrink-0" />
            <span className="truncate">{t('navigation.needHelp', 'Нужна помощь?')}</span>
          </div>

          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            {t('navigation.supportDesc', 'Напишите нашему менеджеру, мы всегда на связи.')}
          </p>

          <a
            href="https://t.me/kwikmenu_support"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full h-11 text-xs font-bold bg-background border border-border hover:bg-secondary transition-colors rounded-lg text-foreground"
          >
            {t('navigation.contactSupport', 'Написать в поддержку')}
          </a>
        </div>

        <LanguageSwitcher variant="sidebar" />

        <button onClick={onLogout} className="flex items-center gap-3 px-3 h-11 w-full text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors group min-w-0">
          <LogOut size={18} className="group-hover:text-destructive transition-colors shrink-0" />
          <span className="truncate">{t('navigation.logout', 'Выйти')}</span>
        </button>
      </div>
    </>
  );
};

const formatDate = (value, lng = 'ru') => {
  if (!value) {
    return '—';
  }
  const locale = lng === 'ru' ? 'ru-RU' : 'en-US';
  return new Date(value).toLocaleDateString(locale);
};

const DashboardLayout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [venues, setVenues] = useState([]);
  const [billingSummary, setBillingSummary] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeVenueId, setActiveVenueId] = useState(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage.getItem('kwikmenu-active-venue');
  });

  useEffect(() => {
    listVenues()
      .then((nextVenues) => {
        setVenues(nextVenues);
        if (!nextVenues.length) {
          return;
        }

        const nextActiveVenue = nextVenues.find((venue) => venue.id === activeVenueId) || nextVenues[0];
        setActiveVenueId(nextActiveVenue.id);
        window.localStorage.setItem('kwikmenu-active-venue', nextActiveVenue.id);
      })
      .catch(() => {
        setVenues([]);
      });
  }, []);

  useEffect(() => {
    fetchBillingSummary()
      .then(setBillingSummary)
      .catch(() => {});
  }, []);

  const activeVenue = venues.find((venue) => venue.id === activeVenueId) || venues[0] || null;

  const navItems = [
    { icon: LayoutDashboard, label: t('navigation.home', 'Обзор'), path: '/dashboard' },
    { icon: UtensilsCrossed, label: t('navigation.menu', 'Меню'), path: '/dashboard/menu' },
    { icon: Building2, label: t('navigation.venue', 'Заведение'), path: activeVenue ? `/dashboard/venues/${activeVenue.id}` : '/dashboard/venues' },
    { icon: UserRound, label: t('navigation.account', 'Аккаунт'), path: '/dashboard/account' },
    { icon: CreditCard, label: t('navigation.billing', 'Биллинг'), path: '/dashboard/billing' },
    { icon: Sparkles, label: t('navigation.subscription', 'Подписка'), path: '/dashboard/subscription' },
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

  const handleLogout = async () => {
    try {
      await logoutSession();
    } finally {
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-secondary/20">
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border/60 fixed inset-y-0 z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] overflow-x-hidden">
        <SidebarContent pathname={location.pathname} navItems={navItems} onLogout={handleLogout} />
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

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

        <SidebarContent pathname={location.pathname} navItems={navItems} onNavigate={() => setIsMobileMenuOpen(false)} onLogout={handleLogout} />
      </aside>

      <main className="flex-1 md:pl-64 flex flex-col min-h-screen w-full max-w-full min-w-0 overflow-x-hidden">
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
                      {activeVenue?.name || t('navigation.noVenueSelected', 'Заведение не выбрано')}
                    </p>

                    <div className="flex items-center justify-start sm:justify-end gap-1.5 mt-0.5">
                      {billingSummary?.subscription?.status === 'trialing' ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                          <p className="text-[10px] font-bold tracking-wider uppercase text-amber-600 truncate">
                            {`${billingSummary.subscription.plan.name.toUpperCase()} (${t('navigation.trialLabel', 'ТРИАЛ')})`}
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                          <p className="text-[10px] font-bold tracking-wider uppercase text-brand-purple truncate">
                            {billingSummary?.subscription?.plan?.name
                              ? `${billingSummary.subscription.plan.name.toUpperCase()}-${t('navigation.tariffLabel', 'ТАРИФ')}`
                              : t('navigation.proTariff', 'PRO-тариф')}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="min-w-[260px]">
                <DropdownMenuLabel>{t('navigation.currentVenue', 'Текущее заведение')}</DropdownMenuLabel>
                {venues.map((venue) => (
                  <DropdownMenuItem
                    key={venue.id}
                    onSelect={() => handleVenueSwitch(venue.id)}
                    className="justify-between"
                  >
                    <span>{venue.name}</span>
                    {activeVenue?.id === venue.id ? <Check size={16} className="text-brand-purple" /> : null}
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <DropdownMenuItem onSelect={() => navigate('/dashboard/venues')}>
                  <Plus size={16} />
                  {t('navigation.addVenue', 'Добавить заведение')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {billingSummary?.subscription?.status === 'trialing' && (
          <div className="bg-gradient-to-r from-brand-purple via-indigo-600 to-violet-600 text-white px-4 py-3 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md shrink-0 animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2.5 text-sm font-semibold animate-pulse">
              <Sparkles size={16} className="text-amber-300 shrink-0" />
              <span>
                {t('billing.trialBannerText', 'У вас активен бесплатный пробный период тарифа {{planName}} до {{date}}.', {
                  planName: billingSummary.subscription.plan.name,
                  date: formatDate(billingSummary.subscription.trialEndsAt || billingSummary.subscription.currentPeriodEnd, lng)
                })}
              </span>
            </div>
            <Link
              to="/dashboard/subscription"
              className="px-4 py-1.5 bg-white text-brand-purple hover:bg-brand-purple/10 hover:text-white border border-transparent hover:border-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0"
            >
              {t('billing.trialBannerCTA', 'Выбрать тариф')}
            </Link>
          </div>
        )}

        <div className="flex-1 p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-full min-w-0 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
