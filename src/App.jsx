import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";
import HelpPage from "./pages/HelpPage.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import MenuEditor from "./pages/MenuEditor.jsx";
import DashboardHome from "./pages/DashboardHome.jsx";
import OnboardingLayout from "./layouts/OnboardingLayout.jsx";
import MenuListPage from "./pages/MenuListPage.jsx";
import MenuImportPage from "./pages/MenuImportPage.jsx";
import VenuePage from "./pages/VenuePage.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import BillingPage from "./pages/BillingPage.jsx";
import BillingCheckoutReturnPage from "./pages/BillingCheckoutReturnPage.jsx";
import VenueListPage from "./pages/VenueListPage.jsx";
import SubscriptionPlansPage from "./pages/SubscriptionPlansPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import { ProtectedRoute, PublicOnlyRoute } from "./components/auth/AuthGuards.jsx";
import RegistrationConversionTracker from "./components/auth/RegistrationConversionTracker.jsx";
import ActiveVenueQrRedirect from "./components/venue/ActiveVenueQrRedirect.jsx";
import PublicVenueMenuPage from "./pages/PublicVenueMenuPage.jsx";
import MagicDemoPage from "./pages/MagicDemoPage.jsx";
import TemporaryMenuPage from "./pages/TemporaryMenuPage.jsx";
import GoogleAnalyticsTracker from "./components/analytics/GoogleAnalyticsTracker.jsx";

function App() {
    return (
        <BrowserRouter>
            <GoogleAnalyticsTracker />
            <RegistrationConversionTracker />
            <Routes>
                {/* Onboarding Flow */}
                <Route path="/" element={<OnboardingLayout><WelcomePage/></OnboardingLayout>}/>
                <Route path="/login" element={<PublicOnlyRoute><OnboardingLayout><LoginPage/></OnboardingLayout></PublicOnlyRoute>}/>
                <Route path="/register" element={<PublicOnlyRoute><OnboardingLayout><RegisterPage/></OnboardingLayout></PublicOnlyRoute>}/>
                <Route path="/onboarding/help" element={<ProtectedRoute><OnboardingLayout><HelpPage/></OnboardingLayout></ProtectedRoute>}/>
                <Route path="/onboarding/upload" element={<ProtectedRoute><OnboardingLayout><UploadPage/></OnboardingLayout></ProtectedRoute>}/>
                <Route path="/magic" element={<OnboardingLayout><MagicDemoPage/></OnboardingLayout>}/>
                <Route path="/tmp/:id" element={<TemporaryMenuPage/>}/>
                <Route path="/m/:venueId" element={<PublicVenueMenuPage/>}/>
                <Route path="/:venueId" element={<PublicVenueMenuPage/>}/>

                {/* Dashboard Flow */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardHome/></DashboardLayout></ProtectedRoute>}/>
                <Route path="/dashboard/menu" element={<ProtectedRoute><DashboardLayout><MenuListPage/></DashboardLayout></ProtectedRoute>}/>
                <Route path="/dashboard/menu/new" element={<ProtectedRoute><DashboardLayout><MenuImportPage/></DashboardLayout></ProtectedRoute>}/>
                <Route path="/dashboard/menu/import" element={<Navigate to="/dashboard/menu/new" replace/>}/>
                <Route path="/dashboard/menu/:id" element={<ProtectedRoute><DashboardLayout><MenuEditor/></DashboardLayout></ProtectedRoute>}/>
                <Route path="/dashboard/venues" element={<ProtectedRoute><DashboardLayout><VenueListPage/></DashboardLayout></ProtectedRoute>}/>
                <Route path="/dashboard/venues/:id" element={<ProtectedRoute><DashboardLayout><VenuePage/></DashboardLayout></ProtectedRoute>}/>
                <Route path="/dashboard/qr" element={<ProtectedRoute><ActiveVenueQrRedirect /></ProtectedRoute>}/>
                <Route path="/dashboard/venue" element={<Navigate to="/dashboard/venues" replace/>}/>
                <Route path="/dashboard/account" element={<ProtectedRoute><DashboardLayout><AccountPage/></DashboardLayout></ProtectedRoute>}/>
                <Route path="/dashboard/billing" element={<ProtectedRoute><DashboardLayout><BillingPage/></DashboardLayout></ProtectedRoute>}/>
                <Route path="/dashboard/billing/success" element={<ProtectedRoute><DashboardLayout><BillingCheckoutReturnPage mode="success" /></DashboardLayout></ProtectedRoute>}/>
                <Route path="/dashboard/billing/fail" element={<ProtectedRoute><DashboardLayout><BillingCheckoutReturnPage mode="fail" /></DashboardLayout></ProtectedRoute>}/>
                <Route path="/dashboard/subscription" element={<ProtectedRoute><DashboardLayout><SubscriptionPlansPage/></DashboardLayout></ProtectedRoute>}/>
                <Route path="/dashboard/settings" element={<Navigate to="/dashboard/account" replace/>}/>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
