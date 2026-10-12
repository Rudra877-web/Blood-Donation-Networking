import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';

import Landing from './pages/public/Landing';
import { About, HowItWorks } from './pages/public/Info';
import Availability from './pages/public/Availability';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import { ForgotPassword, ResetPassword } from './pages/public/PasswordPages';

import NotificationsPage from './pages/shared/NotificationsPage';
import FeedbackPage from './pages/shared/FeedbackPage';
import SettingsPage from './pages/shared/SettingsPage';
import ChatPage from './pages/shared/ChatPage';
import RequestDetail from './pages/shared/RequestDetail';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRequests from './pages/admin/AdminRequests';
import AdminDonations from './pages/admin/AdminDonations';
import AdminInventory from './pages/admin/AdminInventory';
import AdminReports from './pages/admin/AdminReports';
import { AdminFeedback, AdminLogs, AdminNotifications, AdminSettings } from './pages/admin/AdminMisc';

import { DonorDashboard, DonorHistory, DonorProfile, DonorRequests } from './pages/donor/DonorPages';
import { ReceiverCreateRequest, ReceiverDashboard, ReceiverMatching, ReceiverMyRequests, ReceiverProfile, ReceiverSearch } from './pages/receiver/ReceiverPages';
import { HospitalDashboard, HospitalDonations, HospitalIncoming, HospitalPatients, HospitalProfile, HospitalReports, HospitalRequests } from './pages/hospital/HospitalPages';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers mode="all" />} />
          <Route path="approvals" element={<AdminUsers mode="approvals" />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="donations" element={<AdminDonations />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="feedback" element={<AdminFeedback />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['DONOR']} />}>
        <Route path="/donor" element={<DashboardLayout />}>
          <Route index element={<DonorDashboard />} />
          <Route path="profile" element={<DonorProfile section="profile" />} />
          <Route path="health" element={<DonorProfile section="health" />} />
          <Route path="requests" element={<DonorRequests />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="history" element={<DonorHistory />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['RECEIVER']} />}>
        <Route path="/receiver" element={<DashboardLayout />}>
          <Route index element={<ReceiverDashboard />} />
          <Route path="search" element={<ReceiverSearch />} />
          <Route path="create-request" element={<ReceiverCreateRequest />} />
          <Route path="requests" element={<ReceiverMyRequests />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="matching" element={<ReceiverMatching />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="profile" element={<ReceiverProfile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['HOSPITAL']} />}>
        <Route path="/hospital" element={<DashboardLayout />}>
          <Route index element={<HospitalDashboard />} />
          <Route path="incoming" element={<HospitalIncoming />} />
          <Route path="patients" element={<HospitalPatients />} />
          <Route path="donations" element={<HospitalDonations />} />
          <Route path="requests" element={<HospitalRequests />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="reports" element={<HospitalReports />} />
          <Route path="profile" element={<HospitalProfile />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
