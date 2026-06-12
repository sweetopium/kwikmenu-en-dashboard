import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Building2,
  CircleHelp,
  DatabaseZap,
  FileText,
  Home,
  LogOut,
  Mail,
  MenuSquare,
  Shield,
  UploadCloud,
  Users,
  UtensilsCrossed,
  WalletCards,
  Zap,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { storeAdminKey } from '../lib/adminApi';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', label: 'Обзор', icon: Home },
  { to: '/users', label: 'Пользователи', icon: Users },
  { to: '/venues', label: 'Заведения', icon: Building2 },
  { to: '/menus', label: 'Меню', icon: MenuSquare },
  { to: '/imports', label: 'Импорты', icon: UploadCloud },
  { to: '/help-requests', label: 'Заявки', icon: CircleHelp },
  { to: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { to: '/events', label: 'Product events', icon: Activity },
  { to: '/billing', label: 'Биллинг', icon: WalletCards },
  { to: '/email-campaigns', label: 'Рассылки', icon: Mail },
  { to: '/promo-pages', label: 'Промо-страницы', icon: FileText },
  { to: '/system', label: 'Система', icon: DatabaseZap },
];

const AdminLayout = () => {
  const navigate = useNavigate();

  const logout = () => {
    storeAdminKey('');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-secondary/25">
      <aside className="fixed inset-y-0 left-0 hidden w-68 flex-col border-r border-border/70 bg-card md:flex">
        <div className="flex h-18 items-center gap-3 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-purple text-white shadow-sm shadow-brand-purple/20">
            <Zap size={18} fill="currentColor" />
          </div>
          <div>
            <p className="text-sm font-black leading-none">KwikMenu</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Admin</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors',
                isActive ? 'bg-brand-purple/10 text-brand-purple' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border/70 p-4">
          <div className="mb-3 rounded-xl border border-border bg-secondary/40 p-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-foreground">
              <Shield size={15} className="text-brand-purple" />
              Admin key
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Доступ через `X-Admin-Key` и IP allowlist.</p>
          </div>
          <Button variant="ghost" className="w-full justify-start" onClick={logout}>
            <LogOut size={16} />
            Сбросить ключ
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 md:pl-68">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-card/85 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-purple text-white">
              <Zap size={16} fill="currentColor" />
            </div>
            <span className="font-black">Admin</span>
          </div>
          <div className="ml-auto text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            localhost:5174
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
