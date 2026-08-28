import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Home,
  FileCheck,
  Search,
  RefreshCw,
  ArrowLeft,
  X,
  Building,
  Calendar,
  HeartHandshake,
  HandHelping,
  Award,
  Megaphone,
  Sparkles,
  Wrench,
  Menu,
} from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  fetchAdminRegistrations,
  fetchAdminResidents,
  fetchAdminFlats,
  fetchAdminStats,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  requestRegistrationCorrection,
  type AdminRegistrationItem,
  type AdminResidentItem,
  type AdminFlatItem,
  type AdminStats,
} from '../../services/supabase/adminService';
import { AdminEvents } from './AdminEvents';
import { AdminFinance } from './AdminFinance';
import { AdminVolunteers } from './AdminVolunteers';
import { AdminSponsors } from './AdminSponsors';
import { AdminCommunications } from './AdminCommunications';
import { AdminVisitors } from './AdminVisitors';
import { AdminFacilities } from './AdminFacilities';
import { AdminComplaints } from './AdminComplaints';
import './AdminPortal.css';

type ActiveTab = 'registrations' | 'residents' | 'flats' | 'events' | 'finance' | 'volunteers' | 'sponsors' | 'communications' | 'visitors' | 'facilities' | 'complaints';
type StatusFilter = 'ALL' | 'Pending' | 'Correction Required' | 'Approved' | 'Rejected';

export const AdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const getInitialTab = (): ActiveTab => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/admin/events')) return 'events';
    if (path.includes('/admin/finance')) return 'finance';
    if (path.includes('/admin/volunteers')) return 'volunteers';
    if (path.includes('/admin/sponsors')) return 'sponsors';
    if (path.includes('/admin/communications')) return 'communications';
    if (path.includes('/admin/visitors')) return 'visitors';
    if (path.includes('/admin/facilities')) return 'facilities';
    if (path.includes('/admin/complaints')) return 'complaints';
    if (path.includes('/admin/residents')) return 'residents';
    if (path.includes('/admin/flats')) return 'flats';

    const tabParam = searchParams.get('tab') as ActiveTab;
    if (tabParam) return tabParam;

    return 'registrations';
  };

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const targetTab = getInitialTab();
    setActiveTab(targetTab);
  }, [location.pathname, searchParams]);
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Data States
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [registrations, setRegistrations] = useState<AdminRegistrationItem[]>([]);
  const [residents, setResidents] = useState<AdminResidentItem[]>([]);
  const [flats, setFlats] = useState<AdminFlatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal Dialogs for Admin Actions
  const [selectedRequest, setSelectedRequest] = useState<AdminRegistrationItem | null>(null);
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'correction' | null>(null);
  const [modalInput, setModalInput] = useState('');

  const loadAllData = async () => {
    try {
      setLoading(true);
      setActionError(null);
      const [statsData, regsData, residentsData, flatsData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminRegistrations(),
        fetchAdminResidents(),
        fetchAdminFlats(),
      ]);
      setStats(statsData);
      setRegistrations(regsData);
      setResidents(residentsData);
      setFlats(flatsData);
    } catch (err: any) {
      console.error('Error loading admin data:', err);
      setActionError('Failed to load administrative data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'registrations') {
      navigate('/admin', { replace: true });
    } else {
      navigate(`/admin/${tab}`, { replace: true });
    }
  };

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((item) => {
      const itemStatus = (item.status || '').toLowerCase().trim();
      const targetFilter = statusFilter.toLowerCase().trim();
      const matchesStatus =
        statusFilter === 'ALL' ||
        itemStatus === targetFilter ||
        (targetFilter === 'correction required' && itemStatus.includes('correction'));

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.flat_number && item.flat_number.toLowerCase().includes(q)) ||
        (item.block_name && item.block_name.toLowerCase().includes(q)) ||
        (item.applicant_name && item.applicant_name.toLowerCase().includes(q)) ||
        (item.applicant_email && item.applicant_email.toLowerCase().includes(q)) ||
        (item.relationship && item.relationship.toLowerCase().includes(q)) ||
        (item.requested_membership_type && item.requested_membership_type.toLowerCase().includes(q)) ||
        (item.mobile && item.mobile.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [registrations, statusFilter, searchQuery]);

  // Filtered residents
  const filteredResidents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return residents;
    return residents.filter((r) => {
      return (
        (r.full_name && r.full_name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.flat_number && r.flat_number.toLowerCase().includes(q)) ||
        (r.block_name && r.block_name.toLowerCase().includes(q)) ||
        (r.relationship && r.relationship.toLowerCase().includes(q)) ||
        (r.membership_type && r.membership_type.toLowerCase().includes(q)) ||
        (r.mobile && r.mobile.includes(q))
      );
    });
  }, [residents, searchQuery]);

  // Filtered flats
  const filteredFlats = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return flats;
    return flats.filter((f) => {
      return (
        f.flat_number.toLowerCase().includes(q) ||
        (f.primary_owner && f.primary_owner.toLowerCase().includes(q)) ||
        f.block_name.toLowerCase().includes(q) ||
        (f.bhk && f.bhk.toLowerCase().includes(q)) ||
        (f.status && f.status.toLowerCase().includes(q))
      );
    });
  }, [flats, searchQuery]);

  // Action handlers
  const handleOpenModal = (request: AdminRegistrationItem, type: 'approve' | 'reject' | 'correction') => {
    setSelectedRequest(request);
    setModalType(type);
    setModalInput('');
    setActionError(null);
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setModalType(null);
    setModalInput('');
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !modalType) return;
    try {
      setActionLoading(true);
      setActionError(null);

      if (modalType === 'approve') {
        await approveRegistrationRequest(selectedRequest.id);
        setActionSuccess(`Registration for flat ${selectedRequest.flat_number} approved successfully.`);
      } else if (modalType === 'reject') {
        if (!modalInput.trim()) {
          setActionError('Please provide a reason for rejection.');
          setActionLoading(false);
          return;
        }
        await rejectRegistrationRequest(selectedRequest.id, modalInput);
        setActionSuccess(`Registration for flat ${selectedRequest.flat_number} has been rejected.`);
      } else if (modalType === 'correction') {
        if (!modalInput.trim()) {
          setActionError('Please provide instructions for the required correction.');
          setActionLoading(false);
          return;
        }
        await requestRegistrationCorrection(selectedRequest.id, modalInput);
        setActionSuccess(`Correction request sent for flat ${selectedRequest.flat_number}.`);
      }

      handleCloseModal();
      await loadAllData();
    } catch (err: any) {
      console.error('Error executing admin action:', err);
      setActionError(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      {/* 1. ADMIN DESKTOP SIDEBAR (MATCHES RESIDENTS MENU ARCHITECTURE) */}
      <aside className={`admin-sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="BPS" className="admin-sidebar-logo" />
            <div>
              <div className="admin-sidebar-name">BPS Twin Towers</div>
              <div className="admin-sidebar-badge">Society Admin</div>
            </div>
          </div>
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Menu List */}
        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section-label">OPERATIONS & DIRECTORY</div>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'registrations' ? 'active' : ''}`}
            onClick={() => {
              handleTabChange('registrations');
              setIsMobileNavOpen(false);
            }}
          >
            <FileCheck size={18} />
            <span>Registration Queue</span>
            {(stats?.pendingCount ?? 0) > 0 && (
              <span className="admin-nav-badge">{stats?.pendingCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'residents' ? 'active' : ''}`}
            onClick={() => {
              handleTabChange('residents');
              setIsMobileNavOpen(false);
            }}
          >
            <Users size={18} />
            <span>Resident Directory</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'flats' ? 'active' : ''}`}
            onClick={() => {
              handleTabChange('flats');
              setIsMobileNavOpen(false);
            }}
          >
            <Building size={18} />
            <span>Flat Inventory</span>
          </button>

          <div className="admin-nav-section-label">COMMUNITY & EVENTS</div>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => {
              handleTabChange('events');
              setIsMobileNavOpen(false);
            }}
          >
            <Calendar size={18} />
            <span>Events & Festivals</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'finance' ? 'active' : ''}`}
            onClick={() => {
              handleTabChange('finance');
              setIsMobileNavOpen(false);
            }}
          >
            <HeartHandshake size={18} />
            <span>Donations & Finance</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'volunteers' ? 'active' : ''}`}
            onClick={() => {
              handleTabChange('volunteers');
              setIsMobileNavOpen(false);
            }}
          >
            <HandHelping size={18} />
            <span>Volunteers & Teams</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'sponsors' ? 'active' : ''}`}
            onClick={() => {
              handleTabChange('sponsors');
              setIsMobileNavOpen(false);
            }}
          >
            <Award size={18} />
            <span>Sponsors & Partners</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'communications' ? 'active' : ''}`}
            onClick={() => {
              handleTabChange('communications');
              setIsMobileNavOpen(false);
            }}
          >
            <Megaphone size={18} />
            <span>Communications & Notices</span>
          </button>

          <div className="admin-nav-section-label">FACILITIES & SECURITY</div>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'visitors' ? 'active' : ''}`}
            onClick={() => {
              handleTabChange('visitors');
              setIsMobileNavOpen(false);
            }}
          >
            <Shield size={18} />
            <span>Visitors & Gate</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'facilities' ? 'active' : ''}`}
            onClick={() => {
              handleTabChange('facilities');
              setIsMobileNavOpen(false);
            }}
          >
            <Sparkles size={18} />
            <span>Facilities</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => {
              handleTabChange('complaints');
              setIsMobileNavOpen(false);
            }}
          >
            <Wrench size={18} />
            <span>Helpdesk</span>
          </button>
        </nav>

        {/* Sidebar Footer: Return to resident view */}
        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-nav-return-btn"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} />
            <span>Resident Dashboard</span>
          </button>
        </div>
      </aside>

      {/* Mobile drawer backdrop */}
      {isMobileNavOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* 2. ADMIN MAIN SCROLLABLE CONTENT */}
      <main className="admin-main-area">
        {/* Executive Sticky Header (Does Not Scroll) */}
        <div className="admin-header-sticky-wrapper">
          <div className="admin-header">
            <div className="admin-header-title">
              <button
                type="button"
                className="btn-mobile-menu-toggle"
                onClick={() => setIsMobileNavOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>

              <div className="admin-title-text">
                <h1>
                  <span>Society Operations</span>
                  <span className="admin-badge">Executive Console</span>
                </h1>
                <p className="admin-subtitle">
                  BPS Twin Towers Administration • Tower A & B
                </p>
              </div>
            </div>

            <div className="admin-header-actions">
              <button
                type="button"
                className="btn-header-refresh"
                onClick={loadAllData}
                disabled={loading}
                title="Refresh Realtime Society Data"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                <span>{loading ? 'Refreshing...' : 'Sync Data'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action feedback banners */}
        {actionSuccess && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 'var(--radius-lg)',
              color: '#059669',
              fontWeight: 600,
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)',
            }}
          >
            <span>{actionSuccess}</span>
            <button
              type="button"
              onClick={() => setActionSuccess(null)}
              style={{ color: '#059669', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {actionError && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-lg)',
              color: '#dc2626',
              fontWeight: 600,
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
            }}
          >
            <span>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Luxury KPI Metrics Stat Cards Grid (Registration / Flats / Residents) */}
        {(activeTab === 'registrations' || activeTab === 'residents' || activeTab === 'flats') && (
          <div className="admin-stats-grid">
            {/* 1. Pending Approvals */}
            <div className="stat-card pending">
              <div className="stat-card-top">
                <div className="stat-icon-wrapper amber">
                  <FileCheck size={20} />
                </div>
                <span className="stat-trend-pill amber">
                  {(stats?.pendingCount ?? 0) > 0 ? '● Action Required' : '✓ Cleared'}
                </span>
              </div>
              <div>
                <div className="stat-number">{stats?.pendingCount ?? 0}</div>
                <div className="stat-label">Pending Registrations</div>
              </div>
            </div>

            {/* 2. Corrections Required */}
            <div className="stat-card action">
              <div className="stat-card-top">
                <div className="stat-icon-wrapper red">
                  <AlertTriangle size={20} />
                </div>
                <span className="stat-trend-pill">Awaiting Edit</span>
              </div>
              <div>
                <div className="stat-number">{stats?.correctionCount ?? 0}</div>
                <div className="stat-label">Resident Corrections</div>
              </div>
            </div>

            {/* 3. Approved Registrations */}
            <div className="stat-card occupancy">
              <div className="stat-card-top">
                <div className="stat-icon-wrapper emerald">
                  <CheckCircle size={20} />
                </div>
                <span className="stat-trend-pill green">Verified</span>
              </div>
              <div>
                <div className="stat-number">{stats?.approvedCount ?? 0}</div>
                <div className="stat-label">Approved Members</div>
              </div>
            </div>

            {/* 4. Active Residents */}
            <div className="stat-card residents">
              <div className="stat-card-top">
                <div className="stat-icon-wrapper blue">
                  <Users size={20} />
                </div>
                <span className="stat-trend-pill">Directory</span>
              </div>
              <div>
                <div className="stat-number">{stats?.totalResidents ?? 0}</div>
                <div className="stat-label">Total Residents</div>
              </div>
            </div>

            {/* 5. Flat Inventory & Occupancy */}
            <div className="stat-card flats">
              <div className="stat-card-top">
                <div className="stat-icon-wrapper teal">
                  <Building size={20} />
                </div>
                <span className="stat-trend-pill green">
                  {Math.round(((stats?.occupiedFlats ?? 0) / (stats?.totalFlats || 504)) * 100)}% Occupied
                </span>
              </div>
              <div>
                <div className="stat-number">
                  {stats?.occupiedFlats ?? 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {stats?.totalFlats ?? 504}</span>
                </div>
                <div className="stat-label">Occupied Flat Inventory</div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Bar (Only for Registrations, Residents, Flats) */}
        {activeTab !== 'events' && activeTab !== 'finance' && activeTab !== 'volunteers' && activeTab !== 'sponsors' && activeTab !== 'communications' && activeTab !== 'visitors' && activeTab !== 'facilities' && activeTab !== 'complaints' && (
          <div className="admin-filter-bar">
            <div className="admin-search-wrapper">
              <Search size={18} className="admin-search-icon" />
              <input
                type="text"
                className="admin-search-input"
                placeholder={
                  activeTab === 'registrations'
                    ? 'Search by applicant, flat number, block, mobile, email...'
                    : activeTab === 'residents'
                    ? 'Search residents by name, flat, block, contact...'
                    : 'Search flat number, block, BHK, or owner...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {activeTab === 'registrations' && (
              <div className="admin-status-filters">
                {(['ALL', 'Pending', 'Correction Required', 'Approved', 'Rejected'] as StatusFilter[]).map(
                  (filter) => {
                    const count =
                      filter === 'ALL'
                        ? registrations.length
                        : filter === 'Pending'
                        ? (stats?.pendingCount ?? registrations.filter(r => (r.status || '').toLowerCase() === 'pending').length)
                        : filter === 'Correction Required'
                        ? (stats?.correctionCount ?? registrations.filter(r => (r.status || '').toLowerCase().includes('correction')).length)
                        : filter === 'Approved'
                        ? (stats?.approvedCount ?? registrations.filter(r => (r.status || '').toLowerCase() === 'approved').length)
                        : (stats?.rejectedCount ?? registrations.filter(r => (r.status || '').toLowerCase() === 'rejected').length);
                    return (
                      <button
                        key={filter}
                        type="button"
                        className={`status-filter-chip ${statusFilter === filter ? 'active' : ''}`}
                        onClick={() => setStatusFilter(filter)}
                      >
                        <span>{filter === 'ALL' ? 'All Requests' : filter}</span>
                        <span
                          style={{
                            marginLeft: '0.4rem',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: statusFilter === filter ? 'var(--primary, #00897b)' : '#e2e8f0',
                            color: statusFilter === filter ? '#ffffff' : '#475569',
                          }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: REGISTRATION REQUESTS */}
        {activeTab === 'registrations' && (
          <div className="admin-requests-list">
            {loading ? (
              <div className="flex-center" style={{ padding: '3rem 0', color: 'var(--text-muted)' }}>
                Loading registrations...
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 0',
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <CheckCircle size={36} style={{ color: 'var(--success)', marginBottom: '0.75rem' }} />
                <h3>No registration requests found</h3>
                <p style={{ fontSize: '0.85rem' }}>
                  {statusFilter === 'Pending'
                    ? 'All pending registration requests have been processed.'
                    : `No registrations matching '${statusFilter}'.`}
                </p>
              </div>
            ) : (
              filteredRegistrations.map((request) => (
                <div key={request.id} className="admin-request-card">
                  <div className="admin-request-header">
                    <div className="applicant-profile">
                      <div className="applicant-avatar">
                        {request.applicant_name ? request.applicant_name[0].toUpperCase() : 'U'}
                      </div>
                      <div className="applicant-details">
                        <h4>{request.applicant_name}</h4>
                        <p>{request.applicant_email}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-primary)' }}>
                        {request.flat_number}
                      </span>
                      <StatusBadge status={request.status} />
                    </div>
                  </div>

                  <div className="admin-request-body">
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Block:</span>{' '}
                      <strong>{request.block_name || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Type:</span>{' '}
                      <strong>{request.requested_membership_type}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Relationship:</span>{' '}
                      <strong>{request.relationship}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Mobile:</span>{' '}
                      <strong>{request.mobile || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Submitted:</span>{' '}
                      <strong>{new Date(request.created_at).toLocaleDateString()}</strong>
                    </div>
                  </div>

                  {request.remarks && (
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <strong>Remarks:</strong> {request.remarks}
                    </div>
                  )}

                  {request.correction_message && (
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: '#fb923c',
                        background: 'rgba(251, 146, 60, 0.1)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <strong>Correction Sent:</strong> {request.correction_message}
                    </div>
                  )}

                  {request.rejection_reason && (
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: '#f87171',
                        background: 'rgba(239, 68, 68, 0.1)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <strong>Rejection Reason:</strong> {request.rejection_reason}
                    </div>
                  )}

                  {/* Actions (Only active for Pending / Correction Required) */}
                  {(request.status === 'Pending' || request.status === 'Correction Required') && (
                    <div className="admin-request-actions">
                      <button
                        className="btn-reject"
                        onClick={() => handleOpenModal(request, 'reject')}
                        disabled={actionLoading}
                      >
                        <XCircle size={15} />
                        Reject
                      </button>
                      <button
                        className="btn-correction"
                        onClick={() => handleOpenModal(request, 'correction')}
                        disabled={actionLoading}
                      >
                        <AlertTriangle size={15} />
                        Request Correction
                      </button>
                      <button
                        className="btn-approve"
                        onClick={() => handleOpenModal(request, 'approve')}
                        disabled={actionLoading}
                      >
                        <CheckCircle size={15} />
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: RESIDENTS DIRECTORY */}
        {activeTab === 'residents' && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Resident</th>
                  <th>Flat</th>
                  <th>Type</th>
                  <th>Role</th>
                  <th>Mobile</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredResidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No residents found.
                    </td>
                  </tr>
                ) : (
                  filteredResidents.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.email}</div>
                      </td>
                      <td>
                        <strong>{r.flat_number}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Block {r.block_name}
                        </div>
                      </td>
                      <td>{r.resident_type || 'Resident'}</td>
                      <td>{r.relationship}</td>
                      <td>{r.mobile || '—'}</td>
                      <td>{new Date(r.joined_at).toLocaleDateString()}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: FLATS INVENTORY */}
        {activeTab === 'flats' && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Flat Number</th>
                  <th>Block</th>
                  <th>Floor</th>
                  <th>Configuration</th>
                  <th>Primary Owner</th>
                  <th>Occupants</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlats.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No flats found.
                    </td>
                  </tr>
                ) : (
                  filteredFlats.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <strong>{f.flat_number}</strong>
                      </td>
                      <td>Block {f.block_name}</td>
                      <td>Floor {f.floor_number}</td>
                      <td>{f.bhk || 'Standard'}</td>
                      <td>{f.primary_owner || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                      <td>{f.occupant_count ?? 0} active</td>
                      <td>
                        <StatusBadge status={f.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: EVENTS & FESTIVALS */}
        {activeTab === 'events' && <AdminEvents />}

        {/* TAB 5: DONATIONS & FINANCE */}
        {activeTab === 'finance' && <AdminFinance />}

        {/* TAB 6: VOLUNTEERS & TEAMS */}
        {activeTab === 'volunteers' && <AdminVolunteers />}

        {/* TAB 7: SPONSORS & PARTNERS */}
        {activeTab === 'sponsors' && <AdminSponsors />}

        {/* TAB 8: COMMUNICATIONS & NOTICES */}
        {activeTab === 'communications' && <AdminCommunications />}

        {/* TAB 9: VISITORS & GATE MANAGEMENT */}
        {activeTab === 'visitors' && <AdminVisitors />}

        {/* TAB 10: FACILITIES MANAGEMENT */}
        {activeTab === 'facilities' && <AdminFacilities />}

        {/* TAB 11: HELPDESK & COMPLAINTS */}
        {activeTab === 'complaints' && <AdminComplaints />}

        {/* MODAL DIALOGS */}
        {modalType && selectedRequest && (
          <div className="modal-overlay">
            <div className="modal-content animate-fade-in">
              <div className="modal-header">
                <h3>
                  {modalType === 'approve' && 'Approve Registration'}
                  {modalType === 'reject' && 'Reject Registration'}
                  {modalType === 'correction' && 'Request Application Correction'}
                </h3>
                <button onClick={handleCloseModal} style={{ color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Applicant: <strong>{selectedRequest.applicant_name}</strong> for Flat{' '}
                  <strong>{selectedRequest.flat_number}</strong> ({selectedRequest.requested_membership_type})
                </div>

                {modalType === 'approve' && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Approving this request will create an active household membership in flat{' '}
                    <strong>{selectedRequest.flat_number}</strong> and grant the user resident access.
                  </p>
                )}

                {modalType === 'reject' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                      Rejection Reason (Required)
                    </label>
                    <textarea
                      rows={3}
                      className="admin-search-input"
                      style={{ width: '100%' }}
                      placeholder="Enter the reason for rejection..."
                      value={modalInput}
                      onChange={(e) => setModalInput(e.target.value)}
                    />
                  </div>
                )}

                {modalType === 'correction' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                      Correction Instructions (Required)
                    </label>
                    <textarea
                      rows={3}
                      className="admin-search-input"
                      style={{ width: '100%' }}
                      placeholder="e.g. Please update your phone number or provide ownership proof..."
                      value={modalInput}
                      onChange={(e) => setModalInput(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={handleCloseModal}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={
                    modalType === 'approve'
                      ? 'btn-approve'
                      : modalType === 'reject'
                      ? 'btn-reject'
                      : 'btn-correction'
                  }
                  onClick={handleConfirmAction}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : modalType === 'approve' ? 'Confirm Approval' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
