import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Menu as MenuIcon,
  Zap
} from 'lucide-react';
import WelcomePage from "./pages/WelcomePage.jsx";
import HelpPage from "./pages/HelpPage.jsx";
import UploadPage from "./pages/UploadPage.jsx";
// --- ЗАГЛУШКИ СТРАНИЦ (Будем наполнять их дальше) ---

const ProcessingPage = () => <div className="p-20 text-center space-y-4">Экран ИИ-парсинга (Skeletons & Progress)</div>;
const DashboardHome = () => <div className="p-6 font-bold text-2xl">Обзор (Статистика заведений)</div>;
const MenuEditor = () => <div className="p-6 font-bold text-2xl">Редактор Меню (Твой новый JSON-flow)</div>;
const QrManager = () => <div className="p-6 font-bold text-2xl">Управление QR-кодами</div>;
const SettingsPage = () => <div className="p-6 font-bold text-2xl">Настройки профиля</div>;

// --- КОМПОНЕНТЫ ЛЕЙАУТОВ ---

const OnboardingLayout = ({ children }) => (
  <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center p-6">
    <div className="w-full max-w-4xl">
      <div className="flex justify-center sm:mb-3 mb-5">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground transition-transform hover:scale-105">
          <div className="flex h-8 w-8 items-center justify-center rounded-[0.6rem] bg-[var(--brand-purple)] text-white shadow-md">
            <Zap className="h-4 w-4" fill="currentColor" />
          </div>
          KwikMenu
        </Link>
      </div>
      {children}
    </div>
  </div>
);

const DashboardLayout = ({ children }) => (
  <div className="flex min-h-screen bg-background">
    {/* Sidebar */}
    <aside className="w-64 border-r bg-sidebar hidden md:flex flex-col fixed inset-y-0">
      <div className="p-6 flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
        <div className="flex h-7 w-7 items-center justify-center rounded-[0.5rem] bg-[var(--brand-purple)] text-white shadow-sm">
          <Zap className="h-3 w-3" fill="currentColor" />
        </div>
        KwikMenu
      </div>
      <nav className="flex-1 px-4 space-y-1 mt-2">
        {[
          { icon: LayoutDashboard, label: 'Обзор', path: '/dashboard' },
          { icon: UtensilsCrossed, label: 'Меню', path: '/dashboard/menu' },
          { icon: QrCode, label: 'QR-коды', path: '/dashboard/qr' },
          { icon: Settings, label: 'Настройки', path: '/dashboard/settings' },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl hover:bg-sidebar-accent transition-colors"
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <button className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
          <LogOut size={18} />
          Выйти
        </button>
      </div>
    </aside>

    {/* Main Content */}
    <main className="flex-1 md:pl-64">
      <header className="h-16 border-b flex items-center justify-between px-6 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="md:hidden flex items-center gap-4">
          <MenuIcon className="cursor-pointer" />
          <div className="flex h-7 w-7 items-center justify-center rounded-[0.5rem] bg-[var(--brand-purple)] text-white shadow-sm">
            <Zap className="h-3 w-3" fill="currentColor" />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold">Кафе «Татьяна»</p>
            <p className="text-[11px] font-medium text-[var(--brand-purple)]">PRO-тариф</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center font-bold text-sm border">
            ТВ
          </div>
        </div>
      </header>
      <div className="p-6">{children}</div>
    </main>
  </div>
);

// --- ГЛАВНЫЙ АПП С РОУТИНГОМ ---

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Onboarding Flow */}
        <Route path="/" element={<OnboardingLayout><WelcomePage /></OnboardingLayout>} />
        <Route path="/onboarding/help" element={<OnboardingLayout><HelpPage /></OnboardingLayout>} />
        <Route path="/onboarding/upload" element={<OnboardingLayout><UploadPage /></OnboardingLayout>} />
        <Route path="/onboarding/processing" element={<OnboardingLayout><ProcessingPage /></OnboardingLayout>} />

        {/* Dashboard Flow */}
        <Route path="/dashboard" element={<DashboardLayout><DashboardHome /></DashboardLayout>} />
        <Route path="/dashboard/menu" element={<DashboardLayout><MenuEditor /></DashboardLayout>} />
        <Route path="/dashboard/qr" element={<DashboardLayout><QrManager /></DashboardLayout>} />
        <Route path="/dashboard/settings" element={<DashboardLayout><SettingsPage /></DashboardLayout>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;