import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import AnalyticsPage from '../pages/AnalyticsPage';
import BillingPage from '../pages/BillingPage';
import HelpRequestsPage from '../pages/HelpRequestsPage';
import ImportsPage from '../pages/ImportsPage';
import LoginPage from '../pages/LoginPage';
import MenusPage from '../pages/MenusPage';
import OverviewPage from '../pages/OverviewPage';
import ProductEventsPage from '../pages/ProductEventsPage';
import SystemPage from '../pages/SystemPage';
import UserDetailPage from '../pages/UserDetailPage';
import UsersPage from '../pages/UsersPage';
import VenueDetailPage from '../pages/VenueDetailPage';
import VenuesPage from '../pages/VenuesPage';

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<AdminLayout />}>
      <Route index element={<OverviewPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/users/:id" element={<UserDetailPage />} />
      <Route path="/venues" element={<VenuesPage />} />
      <Route path="/venues/:id" element={<VenueDetailPage />} />
      <Route path="/menus" element={<MenusPage />} />
      <Route path="/imports" element={<ImportsPage />} />
      <Route path="/help-requests" element={<HelpRequestsPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/events" element={<ProductEventsPage />} />
      <Route path="/billing" element={<BillingPage />} />
      <Route path="/system" element={<SystemPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
