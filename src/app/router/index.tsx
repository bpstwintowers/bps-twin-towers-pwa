import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import { AdminRoute } from '../guards/AdminRoute';

import { AppLayout } from '../../components/layout/AppLayout';
import { SearchProvider } from '../../context/SearchContext';

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
const ProfilePage = lazy(() =>
  import('../../features/residents/ProfilePage').then((m) => ({ default: m.ProfilePage }))
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
const GaneshContributionPage = lazy(() =>
  import('../../features/ganesh/GaneshContributionPage').then((m) => ({ default: m.GaneshContributionPage }))
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

// Lazy loaded admin routes
const AdminPermissions = lazy(() =>
  import('../../features/admin/AdminPermissions').then((m) => ({ default: m.AdminPermissions }))
);
const AdminEvents = lazy(() =>
  import('../../features/admin/AdminEvents').then((m) => ({ default: m.AdminEvents }))
);
const AdminFinance = lazy(() =>
  import('../../features/admin/AdminFinance').then((m) => ({ default: m.AdminFinance }))
);
const AdminFacilities = lazy(() =>
  import('../../features/admin/AdminFacilities').then((m) => ({ default: m.AdminFacilities }))
);
const AdminComplaints = lazy(() =>
  import('../../features/admin/AdminComplaints').then((m) => ({ default: m.AdminComplaints }))
);
const AdminVolunteers = lazy(() =>
  import('../../features/admin/AdminVolunteers').then((m) => ({ default: m.AdminVolunteers }))
);
const AdminSponsors = lazy(() =>
  import('../../features/admin/AdminSponsors').then((m) => ({ default: m.AdminSponsors }))
);
const AdminCommunications = lazy(() =>
  import('../../features/admin/AdminCommunications').then((m) => ({ default: m.AdminCommunications }))
);
const AdminVisitors = lazy(() =>
  import('../../features/admin/AdminVisitors').then((m) => ({ default: m.AdminVisitors }))
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

import { supabase } from '../../services/supabase/client';

const GaneshPortalRoute: React.FC = () => {
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <PageLoader />;

  if (session) {
    return (
      <AppLayout>
        <GaneshContributionPage isRegisteredUser={true} />
      </AppLayout>
    );
  }

  return <GaneshContributionPage isRegisteredUser={false} />;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <SearchProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegistrationFlow />} />
            <Route path="/registration-status" element={<RegistrationStatus />} />

            {/* Hybrid Ganesh Festival Routes (Accessible publicly by guests and authenticated residents) */}
            <Route path="/ganesh-utsav" element={<GaneshPortalRoute />} />
            <Route path="/ganesh-contributions" element={<GaneshPortalRoute />} />

          {/* Protected Routes (Authenticated inside Main AppLayout) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Resident General Routes */}
              <Route path="/" element={<ResidentDashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
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

              {/* Management & Admin Flat Routes (Protected by granular AdminRoute RBAC) */}
              <Route element={<AdminRoute requiredRoles={['admin', 'super_admin', 'society admin']} />}>
                <Route path="/permissions" element={<AdminPermissions />} />
                <Route path="/admin" element={<AdminPortal />} />
              </Route>

              <Route element={<AdminRoute requiredRoles={['admin', 'event', 'festival', 'culture']} />}>
                <Route path="/events-manage" element={<AdminEvents />} />
              </Route>

              <Route element={<AdminRoute requiredRoles={['admin', 'finance', 'treasurer', 'accounts']} />}>
                <Route path="/finance-manage" element={<AdminFinance />} />
              </Route>

              <Route element={<AdminRoute requiredRoles={['admin', 'facility', 'helpdesk']} />}>
                <Route path="/facilities-manage" element={<AdminFacilities />} />
              </Route>

              <Route element={<AdminRoute requiredRoles={['admin', 'facility', 'helpdesk', 'maintenance']} />}>
                <Route path="/complaints-manage" element={<AdminComplaints />} />
              </Route>

              <Route element={<AdminRoute requiredRoles={['admin', 'volunteer']} />}>
                <Route path="/volunteers-manage" element={<AdminVolunteers />} />
              </Route>

              <Route element={<AdminRoute requiredRoles={['admin', 'finance', 'sponsor']} />}>
                <Route path="/sponsors-manage" element={<AdminSponsors />} />
              </Route>

              <Route element={<AdminRoute requiredRoles={['admin', 'communication', 'pr']} />}>
                <Route path="/communications-manage" element={<AdminCommunications />} />
              </Route>

              <Route element={<AdminRoute requiredRoles={['admin', 'security', 'gate']} />}>
                <Route path="/visitors-manage" element={<AdminVisitors />} />
              </Route>

              {/* Backwards-compatible legacy admin paths redirects */}
              <Route path="/admin/permissions" element={<Navigate to="/permissions" replace />} />
              <Route path="/admin/events" element={<Navigate to="/events-manage" replace />} />
              <Route path="/admin/finance" element={<Navigate to="/finance-manage" replace />} />
              <Route path="/admin/facilities" element={<Navigate to="/facilities-manage" replace />} />
              <Route path="/admin/complaints" element={<Navigate to="/complaints-manage" replace />} />
              <Route path="/admin/volunteers" element={<Navigate to="/volunteers-manage" replace />} />
              <Route path="/admin/sponsors" element={<Navigate to="/sponsors-manage" replace />} />
              <Route path="/admin/communications" element={<Navigate to="/communications-manage" replace />} />
              <Route path="/admin/visitors" element={<Navigate to="/visitors-manage" replace />} />

            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      </SearchProvider>
    </BrowserRouter>
  );
};
