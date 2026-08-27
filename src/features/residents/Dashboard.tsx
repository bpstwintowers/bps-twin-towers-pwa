import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import {
  resolveUserAccess,
  getUserRegistrations,
  type AccessInfo,
  type RegistrationRequest,
} from '../../services/supabase/registrationService';
import { checkIsAdmin } from '../../services/supabase/adminService';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { HouseholdModal } from './HouseholdModal';
import { DirectoryModal } from './DirectoryModal';
import { NotificationBell } from '../notifications/NotificationBell';
import {
  fetchActiveAnnouncements,
  type AnnouncementItem,
} from '../../services/supabase/communicationService';
import {
  LogOut,
  UserPlus,
  FileText,
  Home,
  Users,
  Shield,
  BookOpen,
  Car,
  Bell,
  Sparkles,
  Calendar,
  HeartHandshake,
  HandHelping,
  Award,
  Megaphone,
  Wrench,
} from 'lucide-react';
import './Dashboard.css';

export const ResidentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [access, setAccess] = useState<AccessInfo[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modals
  const [selectedFlatForHousehold, setSelectedFlatForHousehold] = useState<AccessInfo | null>(null);
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profileData) setProfile(profileData);

        // Resolve access (active memberships)
        try {
          const accessData = await resolveUserAccess();
          setAccess(accessData);
        } catch (err) {
          console.error('Error resolving access:', err);
        }

        // Get registration requests
        try {
          const regs = await getUserRegistrations();
          setRegistrations(regs);
        } catch (err) {
          console.error('Error fetching registrations:', err);
        }

        // Check if user is admin
        try {
          const adminStatus = await checkIsAdmin();
          setIsAdmin(adminStatus);
        } catch (err) {
          console.error('Error checking admin status:', err);
        }

        // Fetch active announcements
        try {
          const annData = await fetchActiveAnnouncements();
          setAnnouncements(annData);
        } catch (err) {
          console.error('Error fetching announcements:', err);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleOpenHousehold = (flatAccess: AccessInfo) => {
    setSelectedFlatForHousehold(flatAccess);
    setIsHouseholdModalOpen(true);
  };

  const hasActiveMembership = access.length > 0;
  const pendingRegistrations = registrations.filter(
    (r) => r.status === 'Pending' || r.status === 'Correction Required'
  );
  const hasAnyRegistration = registrations.length > 0;

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div className="animate-fade-in" style={{ color: 'var(--text-muted)' }}>
          Loading your community portal...
        </div>
      </div>
    );
  }

  const primaryFlat = access[0];

  return (
    <div className="dashboard-container">
      {/* Top Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: 'white',
              }}
            >
              BPS
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>BPS Twin Towers</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Community Portal</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <NotificationBell />
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="btn-primary"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                  gap: '0.4rem',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                }}
              >
                <Shield size={14} />
                Admin Portal
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="btn-outline"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', gap: '0.35rem' }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Welcome Hero Banner */}
        <div className="resident-hero-card animate-fade-in">
          <div className="resident-hero-top">
            <div className="resident-user-info">
              <div className="resident-avatar">
                {profile?.full_name ? profile.full_name[0].toUpperCase() : 'R'}
              </div>
              <div className="resident-greeting">
                <h1>Welcome, {profile?.full_name || 'Resident'}</h1>
                <p>{profile?.email}</p>
              </div>
            </div>

            {hasActiveMembership && primaryFlat && (
              <div className="flat-pill-row">
                <span className="flat-badge-pill">
                  <Home size={14} />
                  Flat {primaryFlat.flat_number || 'Resident'} (Block {primaryFlat.block_name || 'A'})
                </span>
                <StatusBadge status={primaryFlat.membership_status} />
              </div>
            )}
          </div>

          {hasActiveMembership ? (
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Manage your household, view community updates, and connect with neighbors in BPS Twin Towers.
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Complete your flat registration below to access household features and community services.
            </p>
          )}
        </div>

        {/* ACTIVE ANNOUNCEMENTS BANNER */}
        {announcements.length > 0 && (
          <div
            className="animate-fade-in"
            style={{
              marginBottom: '1.5rem',
              background: announcements[0].priority === 'Urgent'
                ? 'rgba(239, 68, 68, 0.12)'
                : 'rgba(99, 102, 241, 0.08)',
              border: `1px solid ${
                announcements[0].priority === 'Urgent'
                  ? 'rgba(239, 68, 68, 0.4)'
                  : 'rgba(99, 102, 241, 0.3)'
              }`,
              borderRadius: 'var(--radius-xl)',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Megaphone
                size={20}
                style={{
                  color: announcements[0].priority === 'Urgent' ? '#ef4444' : 'var(--accent-primary)',
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: announcements[0].priority === 'Urgent' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                      color: announcements[0].priority === 'Urgent' ? '#f87171' : 'var(--accent-primary)',
                    }}
                  >
                    {announcements[0].category.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                    {announcements[0].title}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  {announcements[0].message}
                </p>
              </div>
            </div>

            <button
              className="btn-outline"
              onClick={() => navigate('/announcements')}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
            >
              All Notices ({announcements.length}) →
            </button>
          </div>
        )}

        {/* ACTIVE FLATS / HOUSEHOLDS */}
        {hasActiveMembership && (
          <div className="animate-fade-in" style={{ marginBottom: '1.75rem' }}>
            <h2 className="section-title">
              <Home size={18} style={{ color: 'var(--accent-primary)' }} />
              My Residence & Household
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {access.map((a) => (
                <div
                  key={a.membership_id}
                  style={{
                    padding: '1.25rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Home size={24} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        Flat {a.flat_number || 'Assigned Flat'}{' '}
                        <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                          (Block {a.block_name || 'A'})
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Role: <strong>{a.role_name}</strong> · {a.relationship}
                        {a.bhk ? ` · ${a.bhk}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      className="btn-primary"
                      onClick={() => handleOpenHousehold(a)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', gap: '0.4rem' }}
                    >
                      <Users size={15} />
                      Manage Household
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUICK ACCESS ACTION TILES */}
        {hasActiveMembership && (
          <div className="animate-fade-in">
            <h2 className="section-title">
              <Sparkles size={18} style={{ color: '#f59e0b' }} />
              Community Features & Services
            </h2>

            <div className="action-grid">
              <button
                className="action-tile"
                onClick={() => primaryFlat && handleOpenHousehold(primaryFlat)}
              >
                <div
                  className="action-tile-icon"
                  style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)' }}
                >
                  <Users size={20} />
                </div>
                <div className="action-tile-title">Household Members</div>
                <div className="action-tile-desc">
                  Add children, family members, tenants, and domestic staff.
                </div>
              </button>

              <button
                className="action-tile"
                onClick={() => setIsDirectoryModalOpen(true)}
              >
                <div
                  className="action-tile-icon"
                  style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}
                >
                  <BookOpen size={20} />
                </div>
                <div className="action-tile-title">Society Directory</div>
                <div className="action-tile-desc">
                  Find neighbors and contact fellow residents in Tower A & B.
                </div>
              </button>

              <button
                className="action-tile"
                onClick={() => navigate('/events')}
              >
                <div
                  className="action-tile-icon"
                  style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}
                >
                  <Calendar size={20} />
                </div>
                <div className="action-tile-title">Events & Festivals</div>
                <div className="action-tile-desc">
                  Explore community programs, register for events, and book puja rituals.
                </div>
              </button>

              <button
                className="action-tile"
                onClick={() => navigate('/donations')}
              >
                <div
                  className="action-tile-icon"
                  style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}
                >
                  <HeartHandshake size={20} />
                </div>
                <div className="action-tile-title">Donations & Funds</div>
                <div className="action-tile-desc">
                  Support society campaigns, festival funds, and track your receipts.
                </div>
              </button>

              <button
                className="action-tile"
                onClick={() => navigate('/volunteers')}
              >
                <div
                  className="action-tile-icon"
                  style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd' }}
                >
                  <HandHelping size={20} />
                </div>
                <div className="action-tile-title">Volunteers & Teams</div>
                <div className="action-tile-desc">
                  Join festival teams, sign up for community shifts, and support events.
                </div>
              </button>

              <button
                className="action-tile"
                onClick={() => navigate('/sponsors')}
              >
                <div
                  className="action-tile-icon"
                  style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}
                >
                  <Award size={20} />
                </div>
                <div className="action-tile-title">Sponsors & Partners</div>
                <div className="action-tile-desc">
                  Explore community sponsors, partnership tiers, and apply for sponsorship.
                </div>
              </button>

              <button
                className="action-tile"
                onClick={() => navigate('/announcements')}
              >
                <div
                  className="action-tile-icon"
                  style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}
                >
                  <Megaphone size={20} />
                </div>
                <div className="action-tile-title">Community Bulletin</div>
                <div className="action-tile-desc">
                  Official notices, water & lift maintenance, and emergency broadcasts.
                </div>
              </button>

              <button
                className="action-tile"
                onClick={() => navigate('/notifications')}
              >
                <div
                  className="action-tile-icon"
                  style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}
                >
                  <Bell size={20} />
                </div>
                <div className="action-tile-title">Notification Center</div>
                <div className="action-tile-desc">
                  Manage your event reminders, donation receipts, and alerts.
                </div>
              </button>

              <button
                className="action-tile"
                onClick={() => navigate('/my-visitors')}
              >
                <div
                  className="action-tile-icon"
                  style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}
                >
                  <Shield size={20} />
                </div>
                <div className="action-tile-title">Visitors & Gate Passes</div>
                <div className="action-tile-desc">
                  Pre-approve guest entry, track deliveries, and manage gate passes.
                </div>
              </button>

              <button
                className="action-tile"
                onClick={() => navigate('/facilities')}
              >
                <div
                  className="action-tile-icon"
                  style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}
                >
                  <Sparkles size={20} />
                </div>
                <div className="action-tile-title">Facilities & Amenities</div>
                <div className="action-tile-desc">
                  Book badminton courts, clubhouse, swimming pool, and community spaces.
                </div>
              </button>

              <button
                className="action-tile"
                onClick={() => navigate('/complaints')}
              >
                <div
                  className="action-tile-icon"
                  style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}
                >
                  <Wrench size={20} />
                </div>
                <div className="action-tile-title">Helpdesk & Maintenance</div>
                <div className="action-tile-desc">
                  Report plumbing, electrical, or lift issues with real-time SLA tracking.
                </div>
              </button>

              <button
                className="action-tile"
                onClick={() => navigate('/registration-status')}
              >
                <div
                  className="action-tile-icon"
                  style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}
                >
                  <FileText size={20} />
                </div>
                <div className="action-tile-title">Registration Status</div>
                <div className="action-tile-desc">
                  Track and review all your flat applications and status updates.
                </div>
              </button>

              <button
                className="action-tile"
                onClick={() => navigate('/register')}
              >
                <div
                  className="action-tile-icon"
                  style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}
                >
                  <UserPlus size={20} />
                </div>
                <div className="action-tile-title">Register Flat</div>
                <div className="action-tile-desc">
                  Register an additional flat or transfer residency.
                </div>
              </button>
            </div>
          </div>
        )}

        {/* PENDING REGISTRATIONS */}
        {pendingRegistrations.length > 0 && (
          <div className="animate-fade-in" style={{ marginBottom: '1.5rem' }}>
            <h2 className="section-title">
              <FileText size={18} style={{ color: '#f59e0b' }} />
              Pending Applications ({pendingRegistrations.length})
            </h2>
            {pendingRegistrations.map((reg) => (
              <Card key={reg.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>
                    {reg.flat_number || 'Flat'}
                    {reg.block_name ? ` (Block ${reg.block_name})` : ''}
                  </span>
                  <StatusBadge status={reg.status} />
                </div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                  {reg.requested_membership_type === 'Primary Resident' ? 'Owner' : reg.requested_membership_type} · Submitted{' '}
                  {new Date(reg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
                {reg.status === 'Correction Required' && reg.correction_message && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(251, 146, 60, 0.1)',
                      border: '1px solid rgba(251, 146, 60, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      color: '#fb923c',
                    }}
                  >
                    <strong>Correction Required:</strong> {reg.correction_message}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* ONBOARDING CTA (IF NO ACTIVE ACCESS) */}
        {!hasActiveMembership && !pendingRegistrations.length && (
          <Card>
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <Users size={36} style={{ color: 'var(--accent-primary)', marginBottom: '0.75rem' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Join the Community
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
                Register your flat to unlock household member management, society directory, parking spots, and community updates.
              </p>
              <button
                className="btn-primary"
                onClick={() => navigate('/register')}
                style={{ padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}
              >
                <UserPlus size={16} />
                Register as a Resident
              </button>
            </div>
          </Card>
        )}

        {/* View all registrations footer link */}
        {hasAnyRegistration && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              onClick={() => navigate('/registration-status')}
              style={{
                color: 'var(--accent-primary)',
                fontSize: '0.85rem',
                fontWeight: 500,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
              }}
            >
              View all registrations →
            </button>
          </div>
        )}
      </div>

      {/* HOUSEHOLD MODAL */}
      {selectedFlatForHousehold && (
        <HouseholdModal
          flatId={selectedFlatForHousehold.flat_id}
          flatNumber={selectedFlatForHousehold.flat_number || ''}
          blockName={selectedFlatForHousehold.block_name || ''}
          isOpen={isHouseholdModalOpen}
          onClose={() => {
            setIsHouseholdModalOpen(false);
            setSelectedFlatForHousehold(null);
          }}
        />
      )}

      {/* DIRECTORY MODAL */}
      <DirectoryModal
        isOpen={isDirectoryModalOpen}
        onClose={() => setIsDirectoryModalOpen(false)}
      />
    </div>
  );
};
