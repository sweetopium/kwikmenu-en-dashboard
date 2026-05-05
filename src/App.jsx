import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";
import HelpPage from "./pages/HelpPage.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import MenuEditor from "./pages/MenuEditor.jsx";
import DashboardHome from "./pages/DashboardHome.jsx";
import OnboardingLayout from "./layouts/OnboardingLayout.jsx";
import MenuListPage from "./pages/MenuListPage.jsx";
import VenuePage from "./pages/VenuePage.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import BillingPage from "./pages/BillingPage.jsx";
import VenueListPage from "./pages/VenueListPage.jsx";
import SubscriptionPlansPage from "./pages/SubscriptionPlansPage.jsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Onboarding Flow */}
                <Route path="/" element={<OnboardingLayout><WelcomePage/></OnboardingLayout>}/>
                <Route path="/onboarding/help" element={<OnboardingLayout><HelpPage/></OnboardingLayout>}/>
                <Route path="/onboarding/upload" element={<OnboardingLayout><UploadPage/></OnboardingLayout>}/>

                {/* Dashboard Flow */}
                <Route path="/dashboard" element={<DashboardLayout><DashboardHome/></DashboardLayout>}/>
                <Route path="/dashboard/menu" element={<DashboardLayout><MenuListPage/></DashboardLayout>}/>
                <Route path="/dashboard/menu/:id" element={<DashboardLayout><MenuEditor/></DashboardLayout>}/>
                <Route path="/dashboard/venues" element={<DashboardLayout><VenueListPage/></DashboardLayout>}/>
                <Route path="/dashboard/venues/:id" element={<DashboardLayout><VenuePage/></DashboardLayout>}/>
                <Route path="/dashboard/qr" element={<Navigate to="/dashboard/venues/cafe-tatiana?tab=qr" replace/>}/>
                <Route path="/dashboard/venue" element={<Navigate to="/dashboard/venues" replace/>}/>
                <Route path="/dashboard/account" element={<DashboardLayout><AccountPage/></DashboardLayout>}/>
                <Route path="/dashboard/billing" element={<DashboardLayout><BillingPage/></DashboardLayout>}/>
                <Route path="/dashboard/subscription" element={<DashboardLayout><SubscriptionPlansPage/></DashboardLayout>}/>
                <Route path="/dashboard/settings" element={<Navigate to="/dashboard/account" replace/>}/>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
