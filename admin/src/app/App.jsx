import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import AnalyticsPage from '../pages/AnalyticsPage';
import BillingPage from '../pages/BillingPage';
import HelpRequestsPage from '../pages/HelpRequestsPage';
import ImportsPage from '../pages/ImportsPage';
import LoginPage from '../pages/LoginPage';
import MenuEditorPage from '../pages/MenuEditorPage';
import MenusPage from '../pages/MenusPage';
import OverviewPage from '../pages/OverviewPage';
import ProductEventsPage from '../pages/ProductEventsPage';
import SystemPage from '../pages/SystemPage';
import UserDetailPage from '../pages/UserDetailPage';
import UsersPage from '../pages/UsersPage';
import VenueDetailPage from '../pages/VenueDetailPage';
import VenuesPage from '../pages/VenuesPage';
import PromoPagesPage from '../pages/PromoPagesPage';
import { getStoredAdminKey } from '../lib/adminApi';

const RequireAdminKey = () => {
  if (!getStoredAdminKey()) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout />;
};

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<RequireAdminKey />}>
      <Route index element={<OverviewPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/users/:id" element={<UserDetailPage />} />
      <Route path="/venues" element={<VenuesPage />} />
      <Route path="/venues/:id" element={<VenueDetailPage />} />
      <Route path="/menus" element={<MenusPage />} />
      <Route path="/menus/:id/edit" element={<MenuEditorPage />} />
      <Route path="/imports" element={<ImportsPage />} />
      <Route path="/help-requests" element={<HelpRequestsPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/events" element={<ProductEventsPage />} />
      <Route path="/billing" element={<BillingPage />} />
      <Route path="/system" element={<SystemPage />} />
      <Route path="/promo-pages" element={<PromoPagesPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
