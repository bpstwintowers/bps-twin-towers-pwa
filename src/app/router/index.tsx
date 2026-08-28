import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import { AdminRoute } from '../guards/AdminRoute';

// Core immediate routes
import Login from '../../features/auth/Login';
import { ResidentDashboard } from '../../features/residents/Dashboard';

// Lazy loaded feature routes
const RegistrationFlow = lazy(() =>
  import('../../features/residents/RegistrationFlow').then((m) => ({ default: m.RegistrationFlow }))
);
const RegistrationStatus = lazy(() =>
  import('../../features/residents/RegistrationStatus').then((m) => ({ default: m.RegistrationStatus }))
);
const AdminPortal = lazy(() =>
  import('../../features/admin/AdminPortal').then((m) => ({ default: m.AdminPortal }))
);
const EventList = lazy(() =>
  import('../../features/events/EventList').then((m) => ({ default: m.EventList }))
);
const EventDetails = lazy(() =>
  import('../../features/events/EventDetails').then((m) => ({ default: m.EventDetails }))
);
const DonationList = lazy(() =>
  import('../../features/donations/DonationList').then((m) => ({ default: m.DonationList }))
);
const VolunteerList = lazy(() =>
  import('../../features/volunteers/VolunteerList').then((m) => ({ default: m.VolunteerList }))
);
const SponsorList = lazy(() =>
  import('../../features/sponsors/SponsorList').then((m) => ({ default: m.SponsorList }))
);
const NotificationCenter = lazy(() =>
  import('../../features/notifications/NotificationCenter').then((m) => ({ default: m.NotificationCenter }))
);
const AnnouncementList = lazy(() =>
  import('../../features/announcements/AnnouncementList').then((m) => ({ default: m.AnnouncementList }))
);
const NotificationPreferences = lazy(() =>
  import('../../features/settings/NotificationPreferences').then((m) => ({ default: m.NotificationPreferences }))
);
const VisitorManagement = lazy(() =>
  import('../../features/visitors/VisitorManagement').then((m) => ({ default: m.VisitorManagement }))
);
const SecurityConsole = lazy(() =>
  import('../../features/security/SecurityConsole').then((m) => ({ default: m.SecurityConsole }))
);
const FacilityList = lazy(() =>
  import('../../features/facilities/FacilityList').then((m) => ({ default: m.FacilityList }))
);
const FacilityDetails = lazy(() =>
  import('../../features/facilities/FacilityDetails').then((m) => ({ default: m.FacilityDetails }))
);
const MyBookings = lazy(() =>
  import('../../features/facilities/MyBookings').then((m) => ({ default: m.MyBookings }))
);
const ComplaintList = lazy(() =>
  import('../../features/complaints/ComplaintList').then((m) => ({ default: m.ComplaintList }))
);
const ComplaintForm = lazy(() =>
  import('../../features/complaints/ComplaintForm').then((m) => ({ default: m.ComplaintForm }))
);
const ComplaintDetails = lazy(() =>
  import('../../features/complaints/ComplaintDetails').then((m) => ({ default: m.ComplaintDetails }))
);

const PageLoader: React.FC = () => (
  <div
    style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      color: 'var(--text-muted)',
      fontSize: '0.9rem',
    }}
  >
    <div
      style={{
        width: '32px',
        height: '32px',
        border: '3px solid rgba(99, 102, 241, 0.2)',
        borderTopColor: 'var(--accent-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
    <span>Loading page...</span>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegistrationFlow />} />
          <Route path="/registration-status" element={<RegistrationStatus />} />

          {/* Protected Routes (Residents) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ResidentDashboard />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/donations" element={<DonationList />} />
            <Route path="/volunteers" element={<VolunteerList />} />
            <Route path="/sponsors" element={<SponsorList />} />
            <Route path="/notifications" element={<NotificationCenter />} />
            <Route path="/announcements" element={<AnnouncementList />} />
            <Route path="/settings/notifications" element={<NotificationPreferences />} />
            <Route path="/my-visitors" element={<VisitorManagement />} />
            <Route path="/security" element={<SecurityConsole />} />
            <Route path="/gate" element={<SecurityConsole />} />

            {/* Facilities & Complaints */}
            <Route path="/facilities" element={<FacilityList />} />
            <Route path="/facilities/:id" element={<FacilityDetails />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/complaints" element={<ComplaintList />} />
            <Route path="/complaints/new" element={<ComplaintForm />} />
            <Route path="/complaints/:id" element={<ComplaintDetails />} />
          </Route>

          {/* Protected Routes (Admins Only) */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPortal />} />
            <Route path="/admin/events" element={<AdminPortal />} />
            <Route path="/admin/finance" element={<AdminPortal />} />
            <Route path="/admin/volunteers" element={<AdminPortal />} />
            <Route path="/admin/sponsors" element={<AdminPortal />} />
            <Route path="/admin/communications" element={<AdminPortal />} />
            <Route path="/admin/visitors" element={<AdminPortal />} />
            <Route path="/admin/facilities" element={<AdminPortal />} />
            <Route path="/admin/complaints" element={<AdminPortal />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
