import {BrowserRouter, Routes, Route, Navigate, Link} from 'react-router-dom';
import {Zap} from 'lucide-react';
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";
import HelpPage from "./pages/HelpPage.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import MenuEditor from "./pages/MenuEditor.jsx";
import QrManager from "./pages/QrManager.jsx";

const ProcessingPage = () => <div className="p-20 text-center space-y-4">Экран ИИ-парсинга (Skeletons & Progress)</div>;
const DashboardHome = () => <div className="p-6 font-bold text-2xl">Обзор (Статистика заведений)</div>;

const SettingsPage = () => <div className="p-6 font-bold text-2xl">Настройки профиля</div>;

// --- КОМПОНЕНТЫ ЛЕЙАУТОВ ---

const OnboardingLayout = ({children}) => (
    // УБРАЛ justify-center, ДОБАВИЛ pt-12 sm:pt-20 (отступ сверху всегда фиксированный)
    <div className="min-h-screen bg-secondary/30 flex flex-col items-center pt-10 sm:pt-15 px-6 pb-6">
        <div className="w-full max-w-4xl">
            <div className="flex justify-center sm:mb-8 mb-6">
                <Link to="/"
                      className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground transition-transform hover:scale-105">
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-[0.6rem] bg-[var(--brand-purple)] text-white shadow-md">
                        <Zap className="h-4 w-4" fill="currentColor"/>
                    </div>
                    KwikMenu
                </Link>
            </div>
            {children}
        </div>
    </div>
);


// --- ГЛАВНЫЙ АПП С РОУТИНГОМ ---

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Onboarding Flow */}
                <Route path="/" element={<OnboardingLayout><WelcomePage/></OnboardingLayout>}/>
                <Route path="/onboarding/help" element={<OnboardingLayout><HelpPage/></OnboardingLayout>}/>
                <Route path="/onboarding/upload" element={<OnboardingLayout><UploadPage/></OnboardingLayout>}/>
                <Route path="/onboarding/processing" element={<OnboardingLayout><ProcessingPage/></OnboardingLayout>}/>

                {/* Dashboard Flow */}
                <Route path="/dashboard" element={<DashboardLayout><DashboardHome/></DashboardLayout>}/>
                <Route path="/dashboard/menu" element={<DashboardLayout><MenuEditor/></DashboardLayout>}/>
                <Route path="/dashboard/qr" element={<DashboardLayout><QrManager/></DashboardLayout>}/>
                <Route path="/dashboard/settings" element={<DashboardLayout><SettingsPage/></DashboardLayout>}/>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;