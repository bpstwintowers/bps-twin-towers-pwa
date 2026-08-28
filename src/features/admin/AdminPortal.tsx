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
      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.flat_number && item.flat_number.toLowerCase().includes(q)) ||
        (item.applicant_name && item.applicant_name.toLowerCase().includes(q)) ||
        (item.applicant_email && item.applicant_email.toLowerCase().includes(q)) ||
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
        f.block_name.toLowerCase().includes(q)
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
    <div className="admin-container">
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        {/* Modern Executive Header */}
        <div className="admin-header">
          <div className="admin-header-title">
            <button
              className="btn-header-back"
              onClick={() => navigate('/')}
              title="Return to Resident Dashboard"
            >
              <ArrowLeft size={16} />
              <span>Resident View</span>
            </button>

            <div className="admin-header-icon-badge">
              <Shield size={24} />
            </div>

            <div className="admin-title-text">
              <h1>
                <span>Executive Command Console</span>
                <span className="admin-badge">Live Management</span>
              </h1>
              <p className="admin-subtitle">
                BPS Twin Towers Society Operations • Tower A & B
              </p>
            </div>
          </div>

          <div className="admin-header-actions">
            <button
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
            <button onClick={() => setActionSuccess(null)} style={{ color: '#059669', background: 'none', border: 'none', cursor: 'pointer' }}>
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
            <button onClick={() => setActionError(null)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Luxury KPI Metrics Stat Cards Grid */}
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

        {/* Segmented Admin Navigation Tabs */}
        <div className="admin-tabs-container">
          <div className="admin-tabs">
            <button
              className={`admin-tab ${activeTab === 'registrations' ? 'active' : ''}`}
              onClick={() => handleTabChange('registrations')}
            >
              <FileCheck size={16} />
              <span>Registration Queue</span>
              {(stats?.pendingCount ?? 0) > 0 && (
                <span className="admin-tab-count">{stats?.pendingCount}</span>
              )}
            </button>

            <button
              className={`admin-tab ${activeTab === 'residents' ? 'active' : ''}`}
              onClick={() => handleTabChange('residents')}
            >
              <Users size={16} />
              <span>Resident Directory</span>
            </button>

            <button
              className={`admin-tab ${activeTab === 'flats' ? 'active' : ''}`}
              onClick={() => handleTabChange('flats')}
            >
              <Building size={16} />
              <span>Flat Inventory</span>
            </button>

            <button
              className={`admin-tab ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => handleTabChange('events')}
            >
              <Calendar size={16} />
              <span>Events & Festivals</span>
            </button>

            <button
              className={`admin-tab ${activeTab === 'finance' ? 'active' : ''}`}
              onClick={() => handleTabChange('finance')}
            >
              <HeartHandshake size={16} />
              <span>Donations & Finance</span>
            </button>

            <button
              className={`admin-tab ${activeTab === 'volunteers' ? 'active' : ''}`}
              onClick={() => handleTabChange('volunteers')}
            >
              <HandHelping size={16} />
              <span>Volunteers & Teams</span>
            </button>

            <button
              className={`admin-tab ${activeTab === 'sponsors' ? 'active' : ''}`}
              onClick={() => handleTabChange('sponsors')}
            >
              <Award size={16} />
              <span>Sponsors & Partners</span>
            </button>

            <button
              className={`admin-tab ${activeTab === 'communications' ? 'active' : ''}`}
              onClick={() => handleTabChange('communications')}
            >
              <Megaphone size={16} />
              <span>Communications & Notices</span>
            </button>

            <button
              className={`admin-tab ${activeTab === 'visitors' ? 'active' : ''}`}
              onClick={() => handleTabChange('visitors')}
            >
              <Shield size={16} />
              <span>Visitors & Gate</span>
            </button>

            <button
              className={`admin-tab ${activeTab === 'facilities' ? 'active' : ''}`}
              onClick={() => handleTabChange('facilities')}
            >
              <Sparkles size={16} />
              <span>Facilities</span>
            </button>

            <button
              className={`admin-tab ${activeTab === 'complaints' ? 'active' : ''}`}
              onClick={() => handleTabChange('complaints')}
            >
              <Wrench size={16} />
              <span>Helpdesk</span>
            </button>
          </div>
        </div>

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
                    ? 'Search by applicant, flat number, or contact...'
                    : activeTab === 'residents'
                    ? 'Search residents...'
                    : 'Search flat number or block...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {activeTab === 'registrations' && (
              <div className="admin-status-filters">
                {(['Pending', 'Correction Required', 'Approved', 'Rejected', 'ALL'] as StatusFilter[]).map(
                  (filter) => (
                    <button
                      key={filter}
                      type="button"
                      className={`status-filter-chip ${statusFilter === filter ? 'active' : ''}`}
                      onClick={() => setStatusFilter(filter)}
                    >
                      {filter === 'ALL' ? 'All Requests' : filter}
                    </button>
                  )
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
      </div>
    </div>
  );
};
