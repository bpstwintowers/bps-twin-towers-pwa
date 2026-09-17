import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle,
  AlertTriangle,
  Users,
  Building,
  FileCheck,
  Search,
  RefreshCw,
  X,
  Car,
  Shield,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Key,
  HeartHandshake,
  UserCheck,
  Home,
  ShieldX,
  Layers,
  Sliders,
  Eye,
  FileText,
  Mail,
  Phone,
  Calendar,
  User,
  Paperclip,
  ExternalLink,
  Download,
  ShieldCheck,
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
  deleteAdminResident,
  updateAdminResidentParking,
  fetchAllAvailableRoles,
  fetchAllUsersForPermissionDropdown,
  generateRegistrationEmail,
  sendRegistrationNotification,
  type AdminRegistrationItem,
  type AdminResidentItem,
  type AdminFlatItem,
  type AdminStats,
  type RoleItem,
} from '../../services/supabase/adminService';
import { PermissionModal } from './PermissionModal';
import { MenuVisibilityModal } from '../../components/layout/MenuVisibilityModal';
import { useSearch } from '../../context/SearchContext';
import './AdminPortal.css';

type ActiveTab = 'registrations' | 'residents' | 'flats';
type StatusFilter = 'ALL' | 'Pending' | 'Correction Required' | 'Approved' | 'Rejected';
type ResidentCategoryFilter = 'ALL' | 'Owner' | 'Family Member' | 'Tenant';

export const getResidentCategory = (r: AdminResidentItem): 'Owner' | 'Family Member' | 'Tenant' => {
  const mType = (r.membership_type || '').toLowerCase();
  const rType = (r.resident_type || '').toLowerCase();
  const rel = (r.relationship || '').toLowerCase();

  if (mType.includes('tenant') || rType.includes('tenant')) {
    return 'Tenant';
  }
  if (mType.includes('family') || rType.includes('family') || (rel && rel !== 'self' && rel !== 'primary' && rel !== 'owner')) {
    return 'Family Member';
  }
  return 'Owner';
};

interface FlatGroup {
  flatKey: string;
  flat_number: string;
  block_name: string;
  owner: AdminResidentItem | null;
  familyMembers: AdminResidentItem[];
  tenants: AdminResidentItem[];
  allMembers: AdminResidentItem[];
}

export const AdminPortal: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchQuery, setSearchPlaceholder } = useSearch();

  const getInitialTab = (): ActiveTab => {
    const tabParam = searchParams.get('tab') as ActiveTab;
    if (tabParam === 'residents' || tabParam === 'flats') return tabParam;
    return 'registrations';
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Pending');
  const [residentCategoryFilter, setResidentCategoryFilter] = useState<ResidentCategoryFilter>('ALL');

  // Expanded Flats in Directory
  const [expandedFlats, setExpandedFlats] = useState<Record<string, boolean>>({});

  // Action Menu Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Data States
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [registrations, setRegistrations] = useState<AdminRegistrationItem[]>([]);
  const [residents, setResidents] = useState<AdminResidentItem[]>([]);
  const [flats, setFlats] = useState<AdminFlatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Available Users & Roles for Permission Modal
  const [allUsersList, setAllUsersList] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [allRolesList, setAllRolesList] = useState<RoleItem[]>([]);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permissionTargetUser, setPermissionTargetUser] = useState<AdminResidentItem | null>(null);
  const [isMenuVisibilityModalOpen, setIsMenuVisibilityModalOpen] = useState(false);

  // Parking Edit Modal
  const [parkingEditResident, setParkingEditResident] = useState<AdminResidentItem | null>(null);
  const [parkingInputValue, setParkingInputValue] = useState('');

  // Delete Resident Modal
  const [deleteTargetResident, setDeleteTargetResident] = useState<AdminResidentItem | null>(null);

  // Registration Action Modals
  const [selectedRequest, setSelectedRequest] = useState<AdminRegistrationItem | null>(null);
  const [modalType, setModalType] = useState<'view' | 'approve' | 'reject' | 'correction' | null>(null);
  const [modalInput, setModalInput] = useState('');
  const [sendEmailEnabled, setSendEmailEnabled] = useState(true);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target && (target.closest('.resident-action-dropdown') || target.closest('.btn-action-more'))) {
        return;
      }
      setOpenDropdownId(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setActionError(null);

      const [statsData, regsData, residentsData, flatsData, usersList, rolesList] = await Promise.all([
        fetchAdminStats(),
        fetchAdminRegistrations(),
        fetchAdminResidents(),
        fetchAdminFlats(),
        fetchAllUsersForPermissionDropdown(),
        fetchAllAvailableRoles(),
      ]);

      setStats(statsData);
      setRegistrations(regsData);
      setResidents(residentsData);
      setFlats(flatsData);

      // Merge residents into usersList for Permission Modal
      const mergedUsers = [...usersList];
      residentsData.forEach((r) => {
        const uid = r.user_id || r.id;
        if (uid && !mergedUsers.some((u) => u.id === uid)) {
          mergedUsers.push({
            id: uid,
            full_name: r.full_name || 'Resident',
            email: r.email || '',
          });
        }
      });
      setAllUsersList(mergedUsers);
      setAllRolesList(rolesList);

      // Auto-expand all flats by default
      const initialExpanded: Record<string, boolean> = {};
      residentsData.forEach((r) => {
        const key = r.flat_number || 'unknown';
        initialExpanded[key] = true;
      });
      setExpandedFlats(initialExpanded);
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

  // Update header search placeholder based on active tab
  useEffect(() => {
    if (activeTab === 'registrations') {
      setSearchPlaceholder('Search flat number, applicant name, mobile...');
    } else if (activeTab === 'residents') {
      setSearchPlaceholder('Search resident name, flat, role, parking...');
    } else {
      setSearchPlaceholder('Search flat number or tower...');
    }
  }, [activeTab, setSearchPlaceholder]);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const toggleFlatExpand = (flatKey: string) => {
    setExpandedFlats((prev) => ({
      ...prev,
      [flatKey]: !prev[flatKey],
    }));
  };

  // Group residents by flat for Hierarchical / Sub-rows presentation
  const flatGroups = useMemo<FlatGroup[]>(() => {
    const groupsMap = new Map<string, FlatGroup>();

    residents.forEach((r) => {
      const flatKey = r.flat_number || 'Unknown Unit';
      if (!groupsMap.has(flatKey)) {
        groupsMap.set(flatKey, {
          flatKey,
          flat_number: r.flat_number || 'N/A',
          block_name: r.block_name || 'Tower A',
          owner: null,
          familyMembers: [],
          tenants: [],
          allMembers: [],
        });
      }

      const group = groupsMap.get(flatKey)!;
      group.allMembers.push(r);

      const cat = getResidentCategory(r);
      if (cat === 'Owner' && !group.owner) {
        group.owner = r;
      } else if (cat === 'Family Member') {
        group.familyMembers.push(r);
      } else if (cat === 'Tenant') {
        group.tenants.push(r);
      } else {
        if (!group.owner) group.owner = r;
        else group.familyMembers.push(r);
      }
    });

    return Array.from(groupsMap.values());
  }, [residents]);

  // Filtered Flat Groups based on Category & Search
  const filteredFlatGroups = useMemo<FlatGroup[]>(() => {
    const q = searchQuery.toLowerCase().trim();

    return flatGroups
      .map((group) => {
        // Filter members inside group according to search query and category filter
        const matchesMember = (r: AdminResidentItem) => {
          const cat = getResidentCategory(r);
          const matchesCategory =
            residentCategoryFilter === 'ALL' || cat === residentCategoryFilter;

          const matchesSearch =
            !q ||
            (r.full_name && r.full_name.toLowerCase().includes(q)) ||
            (r.email && r.email.toLowerCase().includes(q)) ||
            (r.mobile && r.mobile.toLowerCase().includes(q)) ||
            (r.flat_number && r.flat_number.toLowerCase().includes(q)) ||
            (r.relationship && r.relationship.toLowerCase().includes(q)) ||
            (r.parking_details && r.parking_details.toLowerCase().includes(q)) ||
            cat.toLowerCase().includes(q);

          return matchesCategory && matchesSearch;
        };

        const matchingOwner = group.owner && matchesMember(group.owner) ? group.owner : null;
        const matchingFamily = group.familyMembers.filter(matchesMember);
        const matchingTenants = group.tenants.filter(matchesMember);
        const allMatching = group.allMembers.filter(matchesMember);

        return {
          ...group,
          owner: matchingOwner || (matchingFamily.length === 0 && matchingTenants.length === 0 ? null : group.owner),
          familyMembers: matchingFamily,
          tenants: matchingTenants,
          allMembers: allMatching,
        };
      })
      .filter((group) => group.allMembers.length > 0 || (group.owner !== null));
  }, [flatGroups, searchQuery, residentCategoryFilter]);

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

  // Filtered flats
  const filteredFlats = useMemo(() => {
    return flats.filter((f) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        (f.flat_number && f.flat_number.toLowerCase().includes(q)) ||
        (f.block_name && f.block_name.toLowerCase().includes(q)) ||
        (f.status && f.status.toLowerCase().includes(q))
      );
    });
  }, [flats, searchQuery]);

  // Context-aware dynamic statistics for active tabs
  const dynamicStats = useMemo(() => {
    // 1. Registrations Tab Stats
    const isStatus = (status: string | null | undefined, target: string) => {
      const s = (status || '').toLowerCase().trim();
      if (target === 'pending') return s.includes('pending');
      if (target === 'correction') return s.includes('correction');
      if (target === 'approved') return s.includes('approved');
      if (target === 'rejected') return s.includes('rejected');
      return false;
    };

    const regPending = stats?.pendingCount ?? registrations.filter(r => isStatus(r.status, 'pending')).length;
    const regCorrection = stats?.correctionCount ?? registrations.filter(r => isStatus(r.status, 'correction')).length;
    const regApproved = stats?.approvedCount ?? registrations.filter(r => isStatus(r.status, 'approved')).length;
    const regRejected = stats?.rejectedCount ?? registrations.filter(r => isStatus(r.status, 'rejected')).length;

    // 2. Residents Tab Stats
    const resTotal = residents.length;
    const resOwners = residents.filter((r) => getResidentCategory(r) === 'Owner').length;
    const resFamily = residents.filter((r) => getResidentCategory(r) === 'Family Member').length;
    const resTenants = residents.filter((r) => getResidentCategory(r) === 'Tenant').length;

    // 3. Flat Inventory Tab Stats
    const flatTotal = flats.length;
    const flatOccupied = flats.filter(
      (f) => f.status === 'Occupied' || (f.occupant_count && f.occupant_count > 0)
    ).length;
    const flatVacant = flatTotal >= flatOccupied ? flatTotal - flatOccupied : 0;
    const occupancyRate = flatTotal > 0 ? Math.round((flatOccupied / flatTotal) * 100) : 0;
    const parkingAssigned = residents.filter((r) => Boolean(r.parking_details)).length;

    return {
      registrations: {
        pending: regPending,
        correction: regCorrection,
        approved: regApproved,
        rejected: regRejected,
      },
      residents: {
        total: resTotal,
        owners: resOwners,
        family: resFamily,
        tenants: resTenants,
      },
      flats: {
        total: flatTotal,
        occupied: flatOccupied,
        vacant: flatVacant,
        occupancyRate,
        parkingAssigned,
      },
    };
  }, [stats, registrations, residents, flats]);

  // Actions for Resident Member
  const handleOpenPermissions = (r: AdminResidentItem) => {
    setOpenDropdownId(null);
    setPermissionTargetUser(r);
    setIsPermissionModalOpen(true);
  };

  const handleOpenParkingModal = (r: AdminResidentItem) => {
    setOpenDropdownId(null);
    setParkingEditResident(r);
    setParkingInputValue(r.parking_details || `Slot P-${r.flat_number || 'A'}`);
  };

  const handleSaveParking = async () => {
    if (!parkingEditResident) return;
    try {
      setActionLoading(true);
      await updateAdminResidentParking(parkingEditResident.id, parkingInputValue.trim());
      setActionSuccess(`Updated parking for ${parkingEditResident.full_name} to "${parkingInputValue.trim()}".`);
      setParkingEditResident(null);
      await loadAllData();
    } catch (err: any) {
      console.error('Error saving parking:', err);
      setActionError(err.message || 'Failed to update parking details.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteResident = async () => {
    if (!deleteTargetResident) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await deleteAdminResident(deleteTargetResident.id);
      setActionSuccess(`Removed ${deleteTargetResident.full_name} from Flat ${deleteTargetResident.flat_number}.`);
      setDeleteTargetResident(null);
      await loadAllData();
    } catch (err: any) {
      console.error('Error deleting resident:', err);
      setActionError(err.message || 'Failed to remove member.');
    } finally {
      setActionLoading(false);
    }
  };

  // Modal Triggers for Registrations
  const handleOpenView = (req: AdminRegistrationItem) => {
    setSelectedRequest(req);
    setModalType('view');
    setModalInput('');
    setActionError(null);
  };

  const handleOpenApprove = (req: AdminRegistrationItem) => {
    setSelectedRequest(req);
    setModalType('approve');
    setModalInput('');
    setActionError(null);
  };

  const handleOpenReject = (req: AdminRegistrationItem) => {
    setSelectedRequest(req);
    setModalType('reject');
    setModalInput(req.rejection_reason || '');
    setActionError(null);
  };

  const handleOpenCorrection = (req: AdminRegistrationItem) => {
    setSelectedRequest(req);
    setModalType('correction');
    setModalInput(req.correction_message || '');
    setActionError(null);
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setModalType(null);
    setModalInput('');
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !modalType || modalType === 'view') return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const emailInfo = generateRegistrationEmail(modalType, selectedRequest, modalInput.trim());

      if (modalType === 'approve') {
        await approveRegistrationRequest(selectedRequest.id);
        await sendRegistrationNotification(selectedRequest.user_id, 'APPROVED', selectedRequest.flat_number || '');
        setActionSuccess(`Approved registration for Flat ${selectedRequest.flat_number}. Notification sent.`);
      } else if (modalType === 'reject') {
        const reason = modalInput.trim() || 'Application rejected by administration.';
        await rejectRegistrationRequest(selectedRequest.id, reason);
        await sendRegistrationNotification(selectedRequest.user_id, 'REJECTED', selectedRequest.flat_number || '', reason);
        setActionSuccess(`Rejected registration for Flat ${selectedRequest.flat_number}. Notification sent.`);
      } else if (modalType === 'correction') {
        if (!modalInput.trim()) {
          throw new Error('Please specify what the resident needs to correct.');
        }
        await requestRegistrationCorrection(selectedRequest.id, modalInput.trim());
        await sendRegistrationNotification(selectedRequest.user_id, 'CORRECTION', selectedRequest.flat_number || '', modalInput.trim());
        setActionSuccess(`Correction request sent for Flat ${selectedRequest.flat_number}. Notification sent.`);
      }

      if (sendEmailEnabled && emailInfo && emailInfo.to) {
        window.open(emailInfo.gmailUrl, '_blank');
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
    <div className="admin-portal-container animate-fade-in" ref={actionMenuRef}>
      {/* Top Operations Sub-Navigation & Refresh Bar */}
      <div className="admin-operations-bar">
        <div className="admin-operations-tabs">
          <button
            type="button"
            className={`admin-op-tab ${activeTab === 'registrations' ? 'active' : ''}`}
            onClick={() => handleTabChange('registrations')}
          >
            <FileCheck size={16} />
            <span>Registration Queue</span>
            {(stats?.pendingCount ?? 0) > 0 && (
              <span className="admin-op-badge">{stats?.pendingCount}</span>
            )}
          </button>
          <button
            type="button"
            className={`admin-op-tab ${activeTab === 'residents' ? 'active' : ''}`}
            onClick={() => handleTabChange('residents')}
          >
            <Users size={16} />
            <span>Resident Directory</span>
            <span className="admin-op-count">{stats?.totalResidents ?? 0}</span>
          </button>
          <button
            type="button"
            className={`admin-op-tab ${activeTab === 'flats' ? 'active' : ''}`}
            onClick={() => handleTabChange('flats')}
          >
            <Building size={16} />
            <span>Flat Inventory</span>
            <span className="admin-op-count">{stats?.totalFlats ?? 0}</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            className="btn-header-refresh"
            onClick={() => setIsMenuVisibilityModalOpen(true)}
            title="Configure which menus and feature modules residents can see"
            style={{ background: '#f0fdfa', borderColor: '#99f6e4', color: '#0d9488', fontWeight: 700 }}
          >
            <Sliders size={14} />
            <span>Resident Menus</span>
          </button>

          <button
            type="button"
            className="btn-header-refresh"
            onClick={loadAllData}
            disabled={loading}
            title="Refresh Realtime Society Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
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
            marginBottom: '0.5rem',
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
            marginBottom: '0.5rem',
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

      {/* Context-Aware Dynamic KPI Metrics Stat Cards Grid */}
      <div className="admin-stats-grid">
        {/* TAB 1: REGISTRATIONS METRICS */}
        {activeTab === 'registrations' && (
          <>
            {/* 1. Pending Approvals */}
            <div
              className={`stat-card pending interactive ${statusFilter === 'Pending' ? 'selected' : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'ALL' : 'Pending')}
              title="Click to filter Pending applications"
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrapper amber">
                  <FileCheck size={20} />
                </div>
                <span className="stat-trend-pill amber">
                  {dynamicStats.registrations.pending > 0 ? '● Action Needed' : '✓ Cleared'}
                </span>
              </div>
              <div>
                <div className="stat-number">{dynamicStats.registrations.pending}</div>
                <div className="stat-label">Pending Approvals</div>
              </div>
            </div>

            {/* 2. Corrections Required */}
            <div
              className={`stat-card action interactive ${statusFilter === 'Correction Required' ? 'selected' : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'Correction Required' ? 'ALL' : 'Correction Required')}
              title="Click to filter Corrections Required"
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrapper red">
                  <AlertTriangle size={20} />
                </div>
                <span className="stat-trend-pill red">
                  {dynamicStats.registrations.correction > 0 ? 'Awaiting Edit' : '✓ None'}
                </span>
              </div>
              <div>
                <div className="stat-number">{dynamicStats.registrations.correction}</div>
                <div className="stat-label">Resident Corrections</div>
              </div>
            </div>

            {/* 3. Approved Applications */}
            <div
              className={`stat-card emerald interactive ${statusFilter === 'Approved' ? 'selected' : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'Approved' ? 'ALL' : 'Approved')}
              title="Click to filter Approved applications"
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrapper emerald">
                  <CheckCircle size={20} />
                </div>
                <span className="stat-trend-pill green">Verified</span>
              </div>
              <div>
                <div className="stat-number">{dynamicStats.registrations.approved}</div>
                <div className="stat-label">Approved Applications</div>
              </div>
            </div>

            {/* 4. Rejected Applications */}
            <div
              className={`stat-card slate interactive ${statusFilter === 'Rejected' ? 'selected' : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'Rejected' ? 'ALL' : 'Rejected')}
              title="Click to filter Rejected applications"
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrapper slate">
                  <ShieldX size={20} />
                </div>
                <span className="stat-trend-pill">Processed</span>
              </div>
              <div>
                <div className="stat-number">{dynamicStats.registrations.rejected}</div>
                <div className="stat-label">Rejected Requests</div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: RESIDENT DIRECTORY METRICS */}
        {activeTab === 'residents' && (
          <>
            {/* 1. Total Active Residents */}
            <div
              className={`stat-card blue interactive ${residentCategoryFilter === 'ALL' ? 'selected' : ''}`}
              onClick={() => setResidentCategoryFilter('ALL')}
              title="Click to view all residents"
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrapper blue">
                  <Users size={20} />
                </div>
                <span className="stat-trend-pill blue">All Members</span>
              </div>
              <div>
                <div className="stat-number">{dynamicStats.residents.total}</div>
                <div className="stat-label">Total Residents</div>
              </div>
            </div>

            {/* 2. Flat Owners */}
            <div
              className={`stat-card indigo interactive ${residentCategoryFilter === 'Owner' ? 'selected' : ''}`}
              onClick={() => setResidentCategoryFilter(residentCategoryFilter === 'Owner' ? 'ALL' : 'Owner')}
              title="Click to filter Primary Owners"
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrapper indigo">
                  <Home size={20} />
                </div>
                <span className="stat-trend-pill indigo">Primary</span>
              </div>
              <div>
                <div className="stat-number">{dynamicStats.residents.owners}</div>
                <div className="stat-label">Flat Owners</div>
              </div>
            </div>

            {/* 3. Family Members */}
            <div
              className={`stat-card emerald interactive ${residentCategoryFilter === 'Family Member' ? 'selected' : ''}`}
              onClick={() => setResidentCategoryFilter(residentCategoryFilter === 'Family Member' ? 'ALL' : 'Family Member')}
              title="Click to filter Family Members"
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrapper emerald">
                  <HeartHandshake size={20} />
                </div>
                <span className="stat-trend-pill green">Household</span>
              </div>
              <div>
                <div className="stat-number">{dynamicStats.residents.family}</div>
                <div className="stat-label">Family Members</div>
              </div>
            </div>

            {/* 4. Tenants */}
            <div
              className={`stat-card purple interactive ${residentCategoryFilter === 'Tenant' ? 'selected' : ''}`}
              onClick={() => setResidentCategoryFilter(residentCategoryFilter === 'Tenant' ? 'ALL' : 'Tenant')}
              title="Click to filter Tenants"
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrapper purple">
                  <Key size={20} />
                </div>
                <span className="stat-trend-pill purple">Rented</span>
              </div>
              <div>
                <div className="stat-number">{dynamicStats.residents.tenants}</div>
                <div className="stat-label">Tenants</div>
              </div>
            </div>
          </>
        )}

        {/* TAB 3: FLAT INVENTORY METRICS */}
        {activeTab === 'flats' && (
          <>
            {/* 1. Total Flats */}
            <div className="stat-card teal">
              <div className="stat-card-top">
                <div className="stat-icon-wrapper teal">
                  <Building size={20} />
                </div>
                <span className="stat-trend-pill teal">All Units</span>
              </div>
              <div>
                <div className="stat-number">{dynamicStats.flats.total}</div>
                <div className="stat-label">Total Flats</div>
              </div>
            </div>

            {/* 2. Occupied Units */}
            <div className="stat-card emerald">
              <div className="stat-card-top">
                <div className="stat-icon-wrapper emerald">
                  <CheckCircle size={20} />
                </div>
                <span className="stat-trend-pill green">{dynamicStats.flats.occupancyRate}% Occupied</span>
              </div>
              <div>
                <div className="stat-number">{dynamicStats.flats.occupied}</div>
                <div className="stat-label">Occupied Flats</div>
              </div>
            </div>

            {/* 3. Vacant Units */}
            <div className="stat-card amber">
              <div className="stat-card-top">
                <div className="stat-icon-wrapper amber">
                  <Layers size={20} />
                </div>
                <span className="stat-trend-pill amber">Available</span>
              </div>
              <div>
                <div className="stat-number">{dynamicStats.flats.vacant}</div>
                <div className="stat-label">Vacant Flats</div>
              </div>
            </div>

            {/* 4. Parking Slots Assigned */}
            <div className="stat-card blue">
              <div className="stat-card-top">
                <div className="stat-icon-wrapper blue">
                  <Car size={20} />
                </div>
                <span className="stat-trend-pill blue">Allocated</span>
              </div>
              <div>
                <div className="stat-number">{dynamicStats.flats.parkingAssigned}</div>
                <div className="stat-label">Assigned Parking Slots</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* STATUS & CATEGORY FILTER PILLS BAR */}
      <div className="admin-filter-bar">
        {activeTab === 'registrations' && (
          <div className="admin-status-filters">
            {(['Pending', 'Correction Required', 'Approved', 'Rejected', 'ALL'] as StatusFilter[]).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  className={`btn-filter-pill ${statusFilter === st ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st === 'Pending' && (
                    <span className="filter-count-badge">{stats?.pendingCount ?? 0}</span>
                  )}
                  {st === 'Correction Required' && (
                    <span className="filter-count-badge red">{stats?.correctionCount ?? 0}</span>
                  )}
                  {st === 'Approved' && (
                    <span className="filter-count-badge green">{stats?.approvedCount ?? 0}</span>
                  )}
                  {st === 'Rejected' && (
                    <span className="filter-count-badge gray">{stats?.rejectedCount ?? 0}</span>
                  )}
                  {st}
                </button>
              )
            )}
          </div>
        )}

        {activeTab === 'residents' && (
          <div className="admin-status-filters">
            {[
              { key: 'ALL', label: 'All Residents', count: residents.length },
              {
                key: 'Owner',
                label: 'Owners',
                count: residents.filter((r) => getResidentCategory(r) === 'Owner').length,
              },
              {
                key: 'Family Member',
                label: 'Family Members',
                count: residents.filter((r) => getResidentCategory(r) === 'Family Member').length,
              },
              {
                key: 'Tenant',
                label: 'Tenants',
                count: residents.filter((r) => getResidentCategory(r) === 'Tenant').length,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`btn-filter-pill ${residentCategoryFilter === tab.key ? 'active' : ''}`}
                onClick={() => setResidentCategoryFilter(tab.key as ResidentCategoryFilter)}
              >
                <span className="filter-count-badge gray">{tab.count}</span>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB CONTENT TABLES */}
      <div className="admin-content-card">
        {/* TAB 1: REGISTRATIONS QUEUE */}
        {activeTab === 'registrations' && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Flat</th>
                  <th>Applicant</th>
                  <th>Type</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                      <div className="table-loading-spinner" />
                      <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Loading registrations queue...
                      </div>
                    </td>
                  </tr>
                ) : filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                      <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>📋</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        No registration records found
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Try switching the status filter or clearing your search term.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => handleOpenView(req)}
                      style={{ cursor: 'pointer' }}
                      title="Click to view full application details form"
                    >
                      <td>
                        <span className="flat-badge">
                          Flat {req.flat_number || 'Unit'} ({req.block_name || 'Tower A'})
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {req.applicant_name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {req.applicant_email} {req.mobile ? `• ${req.mobile}` : ''}
                        </div>
                      </td>
                      <td>
                        <span className="membership-type-tag">
                          {req.requested_membership_type || 'Resident'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <StatusBadge status={req.status} />
                        {(req.rejection_reason || req.correction_message || req.remarks) && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--warning)',
                              marginTop: '0.25rem',
                              maxWidth: '220px',
                            }}
                          >
                            Note: {req.rejection_reason || req.correction_message || req.remarks}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn-action-view"
                            onClick={() => handleOpenView(req)}
                            title="View Full Application Form & Details"
                            style={{
                              padding: '0.4rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Eye size={13} />
                            <span>View Form</span>
                          </button>

                          {(req.status?.toLowerCase().includes('pending') ||
                          req.status?.toLowerCase().includes('correction')) ? (
                            <>
                              <button
                                type="button"
                                className="btn-action-approve"
                                onClick={() => handleOpenApprove(req)}
                                title="Approve Request"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn-action-correct"
                                onClick={() => handleOpenCorrection(req)}
                                title="Request Corrections"
                              >
                                Correction
                              </button>
                              <button
                                type="button"
                                className="btn-action-reject"
                                onClick={() => handleOpenReject(req)}
                                title="Reject Request"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Processed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: RESIDENT DIRECTORY (WITH SUB-ROWS FOR FAMILY & TENANTS, PARKING, & ACTION MENUS) */}
        {activeTab === 'residents' && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Resident</th>
                  <th>Flat Unit</th>
                  <th>Type</th>
                  <th>Relationship</th>
                  <th>Parking Details</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                      <div className="table-loading-spinner" />
                    </td>
                  </tr>
                ) : filteredFlatGroups.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                      No {residentCategoryFilter === 'ALL' ? 'residents' : residentCategoryFilter.toLowerCase() + 's'} found matching your filter or search.
                    </td>
                  </tr>
                ) : (
                  filteredFlatGroups.map((group) => {
                    const isExpanded = expandedFlats[group.flatKey] ?? true;
                    const hasSubRows = group.familyMembers.length > 0 || group.tenants.length > 0;
                    const owner = group.owner;

                    return (
                      <React.Fragment key={group.flatKey}>
                        {/* 1. PRIMARY OWNER / PARENT ROW */}
                        {owner && (
                          <tr className="resident-parent-row">
                            <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                              {hasSubRows ? (
                                <button
                                  type="button"
                                  className="btn-toggle-subrows"
                                  onClick={() => toggleFlatExpand(group.flatKey)}
                                  title={isExpanded ? 'Collapse household members' : 'Expand household members'}
                                >
                                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>
                              ) : (
                                <span className="subrow-leaf-dot" />
                              )}
                            </td>
                            <td>
                              <div className="resident-name-cell">
                                <div className="resident-avatar-circle owner">
                                  {(owner.full_name || 'R').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {owner.full_name || 'Unknown Resident'}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {owner.email} {owner.mobile ? `• ${owner.mobile}` : ''}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="flat-badge">
                                Flat {group.flat_number} ({group.block_name})
                              </span>
                            </td>
                            <td>
                              <span className="membership-type-tag owner">
                                Owner
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                {owner.relationship || 'Self'}
                              </span>
                            </td>
                            <td>
                              <div className="parking-chip" onClick={() => handleOpenParkingModal(owner)} title="Click to edit parking">
                                <Car size={13} />
                                <span>{owner.parking_details || `Slot P-${group.flat_number}`}</span>
                                <Edit3 size={11} className="parking-edit-hover-icon" />
                              </div>
                            </td>
                            <td>
                              <StatusBadge status={owner.status} />
                            </td>
                            <td style={{ textAlign: 'right', position: 'relative' }}>
                              <div className="resident-actions-wrapper">
                                <button
                                  type="button"
                                  className="btn-action-more"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(openDropdownId === owner.id ? null : owner.id);
                                  }}
                                  title="Actions"
                                >
                                  <MoreVertical size={16} />
                                </button>

                                {openDropdownId === owner.id && (
                                  <div className="resident-action-dropdown animate-fade-in" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      className="action-dropdown-item"
                                      onClick={() => handleOpenPermissions(owner)}
                                    >
                                      <Shield size={14} style={{ color: '#2563eb' }} />
                                      <span>Roles & Permissions</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="action-dropdown-item"
                                      onClick={() => handleOpenParkingModal(owner)}
                                    >
                                      <Car size={14} style={{ color: '#059669' }} />
                                      <span>Edit Parking Slot</span>
                                    </button>
                                    <div className="dropdown-divider" />
                                    <button
                                      type="button"
                                      className="action-dropdown-item danger"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setDeleteTargetResident(owner);
                                      }}
                                    >
                                      <Trash2 size={14} />
                                      <span>Remove Resident</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* 2. SUB-ROWS: FAMILY MEMBERS & TENANTS (Shown when flat is expanded) */}
                        {isExpanded && (
                          <>
                            {/* Family Members Sub-rows */}
                            {group.familyMembers.map((fm) => (
                              <tr key={fm.id} className="resident-sub-row family">
                                <td></td>
                                <td>
                                  <div className="resident-name-cell subrow-indent">
                                    <span className="subrow-tree-line">↳</span>
                                    <div className="resident-avatar-circle family">
                                      <HeartHandshake size={13} />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.86rem' }}>
                                        {fm.full_name || 'Family Member'}
                                      </div>
                                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                        {fm.email} {fm.mobile ? `• ${fm.mobile}` : ''}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="flat-badge sub">
                                    Flat {group.flat_number}
                                  </span>
                                </td>
                                <td>
                                  <span className="membership-type-tag family">
                                    Family Member
                                  </span>
                                </td>
                                <td>
                                  <span style={{ fontSize: '0.82rem', color: '#2563eb', fontWeight: 600 }}>
                                    {fm.relationship || 'Family'}
                                  </span>
                                </td>
                                <td>
                                  <div className="parking-chip sub" onClick={() => handleOpenParkingModal(fm)} title="Click to edit parking">
                                    <Car size={13} />
                                    <span>{fm.parking_details || owner?.parking_details || `Slot P-${group.flat_number}`}</span>
                                    <Edit3 size={11} className="parking-edit-hover-icon" />
                                  </div>
                                </td>
                                <td>
                                  <StatusBadge status={fm.status} />
                                </td>
                                <td style={{ textAlign: 'right', position: 'relative' }}>
                                  <div className="resident-actions-wrapper">
                                    <button
                                      type="button"
                                      className="btn-action-more"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(openDropdownId === fm.id ? null : fm.id);
                                      }}
                                    >
                                      <MoreVertical size={16} />
                                    </button>

                                    {openDropdownId === fm.id && (
                                      <div className="resident-action-dropdown animate-fade-in" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          className="action-dropdown-item"
                                          onClick={() => handleOpenPermissions(fm)}
                                        >
                                          <Shield size={14} style={{ color: '#2563eb' }} />
                                          <span>Roles & Permissions</span>
                                        </button>
                                        <button
                                          type="button"
                                          className="action-dropdown-item"
                                          onClick={() => handleOpenParkingModal(fm)}
                                        >
                                          <Car size={14} style={{ color: '#059669' }} />
                                          <span>Edit Parking Slot</span>
                                        </button>
                                        <div className="dropdown-divider" />
                                        <button
                                          type="button"
                                          className="action-dropdown-item danger"
                                          onClick={() => {
                                            setOpenDropdownId(null);
                                            setDeleteTargetResident(fm);
                                          }}
                                        >
                                          <Trash2 size={14} />
                                          <span>Remove Member</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}

                            {/* Tenants Sub-rows */}
                            {group.tenants.map((tn) => (
                              <tr key={tn.id} className="resident-sub-row tenant">
                                <td></td>
                                <td>
                                  <div className="resident-name-cell subrow-indent">
                                    <span className="subrow-tree-line">↳</span>
                                    <div className="resident-avatar-circle tenant">
                                      <Key size={13} />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.86rem' }}>
                                        {tn.full_name || 'Tenant'}
                                      </div>
                                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                        {tn.email} {tn.mobile ? `• ${tn.mobile}` : ''}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="flat-badge sub">
                                    Flat {group.flat_number}
                                  </span>
                                </td>
                                <td>
                                  <span className="membership-type-tag tenant">
                                    Tenant
                                  </span>
                                </td>
                                <td>
                                  <span style={{ fontSize: '0.82rem', color: '#7c3aed', fontWeight: 600 }}>
                                    {tn.relationship || 'Tenant'}
                                  </span>
                                </td>
                                <td>
                                  <div className="parking-chip sub" onClick={() => handleOpenParkingModal(tn)} title="Click to edit parking">
                                    <Car size={13} />
                                    <span>{tn.parking_details || `Slot P-${group.flat_number}`}</span>
                                    <Edit3 size={11} className="parking-edit-hover-icon" />
                                  </div>
                                </td>
                                <td>
                                  <StatusBadge status={tn.status} />
                                </td>
                                <td style={{ textAlign: 'right', position: 'relative' }}>
                                  <div className="resident-actions-wrapper">
                                    <button
                                      type="button"
                                      className="btn-action-more"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(openDropdownId === tn.id ? null : tn.id);
                                      }}
                                    >
                                      <MoreVertical size={16} />
                                    </button>

                                    {openDropdownId === tn.id && (
                                      <div className="resident-action-dropdown animate-fade-in" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          className="action-dropdown-item"
                                          onClick={() => handleOpenPermissions(tn)}
                                        >
                                          <Shield size={14} style={{ color: '#2563eb' }} />
                                          <span>Roles & Permissions</span>
                                        </button>
                                        <button
                                          type="button"
                                          className="action-dropdown-item"
                                          onClick={() => handleOpenParkingModal(tn)}
                                        >
                                          <Car size={14} style={{ color: '#059669' }} />
                                          <span>Edit Parking Slot</span>
                                        </button>
                                        <div className="dropdown-divider" />
                                        <button
                                          type="button"
                                          className="action-dropdown-item danger"
                                          onClick={() => {
                                            setOpenDropdownId(null);
                                            setDeleteTargetResident(tn);
                                          }}
                                        >
                                          <Trash2 size={14} />
                                          <span>Remove Tenant</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: FLAT INVENTORY */}
        {activeTab === 'flats' && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Flat Unit</th>
                  <th>Tower Block</th>
                  <th>Floor</th>
                  <th>Occupant Count</th>
                  <th>Primary Resident</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                      <div className="table-loading-spinner" />
                    </td>
                  </tr>
                ) : filteredFlats.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                      No flats found.
                    </td>
                  </tr>
                ) : (
                  filteredFlats.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <span className="flat-badge">Flat {f.flat_number}</span>
                      </td>
                      <td>{f.block_name}</td>
                      <td>Floor {f.floor_number ?? '1'}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{f.occupant_count ?? 0} members</span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)' }}>{f.primary_owner || 'Vacant'}</span>
                      </td>
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
      </div>

      {/* 1. PERMISSION MODAL FOR RESIDENT ACTION */}
      {isPermissionModalOpen && (
        <PermissionModal
          isOpen={isPermissionModalOpen}
          onClose={() => {
            setIsPermissionModalOpen(false);
            setPermissionTargetUser(null);
          }}
          onSuccess={(msg) => {
            setActionSuccess(msg);
            setIsPermissionModalOpen(false);
            setPermissionTargetUser(null);
            loadAllData();
          }}
          editItem={
            permissionTargetUser && permissionTargetUser.user_id
              ? {
                  id: '',
                  user_id: permissionTargetUser.user_id,
                  user_name: permissionTargetUser.full_name || '',
                  email: permissionTargetUser.email || '',
                  role_id: '',
                  role_name: '',
                  modules: '',
                  status: 'Active',
                  created_at: '',
                }
              : null
          }
          users={allUsersList}
          roles={allRolesList}
        />
      )}

      {/* 2. PARKING EDIT MODAL */}
      {parkingEditResident && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3>
                <Car size={18} style={{ display: 'inline', marginRight: '0.45rem', verticalAlign: 'middle' }} />
                Edit Parking Details
              </h3>
              <button onClick={() => setParkingEditResident(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Assign or update vehicle parking slot for <strong>{parkingEditResident.full_name}</strong> (Flat {parkingEditResident.flat_number}).
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Parking Slot / Bay ID
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  style={{ width: '100%', paddingLeft: '1rem' }}
                  placeholder="e.g. Slot P-A811 (Basement 1, Bay 4)"
                  value={parkingInputValue}
                  onChange={(e) => setParkingInputValue(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setParkingEditResident(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-approve"
                onClick={handleSaveParking}
                disabled={actionLoading}
              >
                {actionLoading ? 'Saving...' : 'Save Parking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. DELETE RESIDENT CONFIRMATION MODAL */}
      {deleteTargetResident && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3 style={{ color: '#dc2626' }}>
                <Trash2 size={18} style={{ display: 'inline', marginRight: '0.45rem', verticalAlign: 'middle' }} />
                Remove Resident Member
              </h3>
              <button onClick={() => setDeleteTargetResident(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {actionError && (
                <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(239,68,68,0.1)', color: '#dc2626', borderRadius: '8px', fontSize: '0.84rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                  {actionError}
                </div>
              )}
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Are you sure you want to remove <strong>{deleteTargetResident.full_name}</strong> from Flat <strong>{deleteTargetResident.flat_number}</strong>?
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                This will revoke their household access rights for this unit. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setDeleteTargetResident(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-reject"
                onClick={handleDeleteResident}
                disabled={actionLoading}
              >
                {actionLoading ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. REGISTRATION APPLICATION VIEW / APPROVE / REJECT / CORRECTION MODALS */}
      {modalType && selectedRequest && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-content animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: modalType === 'view' ? '680px' : '520px', width: '92%' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {modalType === 'view' && <FileText size={20} style={{ color: 'var(--accent-primary, #6366f1)' }} />}
                <h3 style={{ margin: 0 }}>
                  {modalType === 'view' && 'Registration Application Form'}
                  {modalType === 'approve' && 'Approve Registration'}
                  {modalType === 'reject' && 'Reject Registration'}
                  {modalType === 'correction' && 'Request Application Correction'}
                </h3>
              </div>
              <button onClick={handleCloseModal} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {/* VIEW FULL APPLICATION FORM */}
              {modalType === 'view' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Top Applicant Highlight Card */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {selectedRequest.applicant_name ? selectedRequest.applicant_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
                          {selectedRequest.applicant_name}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          Application ID: <code style={{ fontSize: '0.78rem' }}>{selectedRequest.id.slice(0, 8)}</code>
                        </div>
                      </div>
                    </div>
                    <div>
                      <StatusBadge status={selectedRequest.status} />
                    </div>
                  </div>

                  {/* Form Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                    <div style={{ padding: '0.75rem 1rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Flat & Block
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building size={15} style={{ color: '#6366f1' }} />
                        Flat {selectedRequest.flat_number || 'Unit'} ({selectedRequest.block_name || 'Tower A'})
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem 1rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Membership Category
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                        {selectedRequest.requested_membership_type || 'Resident'}
                        {selectedRequest.relationship && selectedRequest.relationship.toLowerCase() !== 'self' ? ` (${selectedRequest.relationship})` : ''}
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem 1rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Email Address
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem', wordBreak: 'break-all' }}>
                        <Mail size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                        {selectedRequest.applicant_email || 'Not provided'}
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem 1rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Mobile Contact
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Phone size={14} style={{ color: '#64748b' }} />
                        {selectedRequest.mobile || 'Not provided'}
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem 1rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Resident Since
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={14} style={{ color: '#64748b' }} />
                        {selectedRequest.resident_since ? new Date(selectedRequest.resident_since).toLocaleDateString() : 'Current'}
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem 1rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Parking / Vehicle Details
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Car size={14} style={{ color: '#64748b' }} />
                        {selectedRequest.parking_details || 'None assigned'}
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Documents & Attachments Section */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Paperclip size={16} style={{ color: '#6366f1' }} />
                      <span>Uploaded Attachments & Documents</span>
                    </div>

                    {selectedRequest.rental_agreement_url || selectedRequest.parking_document_url ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                        {selectedRequest.rental_agreement_url && (
                          <div
                            style={{
                              padding: '0.85rem',
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#166534' }}>
                                Rental / Lease Agreement
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#15803d' }}>
                                Signed tenancy contract
                              </div>
                            </div>
                            <a
                              href={selectedRequest.rental_agreement_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.4rem 0.75rem',
                                background: '#16a34a',
                                color: '#ffffff',
                                borderRadius: '9999px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)',
                              }}
                            >
                              <ExternalLink size={13} />
                              <span>View File</span>
                            </a>
                          </div>
                        )}

                        {selectedRequest.parking_document_url && (
                          <div
                            style={{
                              padding: '0.85rem',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e40af' }}>
                                Parking Allocation Letter
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#1d4ed8' }}>
                                Parking slot ownership proof
                              </div>
                            </div>
                            <a
                              href={selectedRequest.parking_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.4rem 0.75rem',
                                background: '#2563eb',
                                color: '#ffffff',
                                borderRadius: '9999px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
                              }}
                            >
                              <ExternalLink size={13} />
                              <span>View File</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '0.85rem',
                          background: '#f8fafc',
                          border: '1px dashed #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          color: '#64748b',
                          textAlign: 'center',
                        }}
                      >
                        No document files attached with this registration.
                      </div>
                    )}
                  </div>

                  {/* Family Members Section (if provided) */}
                  {(() => {
                    let fams: any[] = [];
                    if (Array.isArray(selectedRequest.family_members)) {
                      fams = selectedRequest.family_members;
                    } else if (typeof selectedRequest.family_members === 'string') {
                      try { fams = JSON.parse(selectedRequest.family_members); } catch {}
                    }
                    if (!fams || fams.length === 0) return null;

                    return (
                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '1rem',
                        }}
                      >
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                          <Users size={16} style={{ color: '#059669' }} />
                          <span>Household Family Members ({fams.length})</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem' }}>
                          {fams.map((fm: any, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                padding: '0.65rem 0.85rem',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                              }}
                            >
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{fm.name || 'Member'}</div>
                              <div style={{ color: '#64748b' }}>
                                {fm.relation || 'Family'} {fm.dob ? `• DOB: ${fm.dob}` : ''}
                              </div>
                              {fm.mobile && <div style={{ color: '#64748b' }}>📞 {fm.mobile}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Registered Vehicles Section (if provided) */}
                  {(() => {
                    let vehi: any[] = [];
                    if (Array.isArray(selectedRequest.vehicles)) {
                      vehi = selectedRequest.vehicles;
                    } else if (typeof selectedRequest.vehicles === 'string') {
                      try { vehi = JSON.parse(selectedRequest.vehicles); } catch {}
                    }
                    if (!vehi || vehi.length === 0) return null;

                    return (
                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '1rem',
                        }}
                      >
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                          <Car size={16} style={{ color: '#2563eb' }} />
                          <span>Registered Vehicles ({vehi.length})</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                          {vehi.map((v: any, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                padding: '0.65rem 0.85rem',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                              }}
                            >
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                {v.registrationNumber || v.regNumber || 'Vehicle'} ({v.vehicleType || v.type || '4W'})
                              </div>
                              <div style={{ color: '#64748b' }}>
                                {v.makeModel || 'Model'} {v.colour ? `• ${v.colour}` : ''}
                              </div>
                              {v.slotNumber && <div style={{ color: '#2563eb', fontWeight: 600 }}>Slot: {v.slotNumber}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Tenant Details Section (if rented) */}
                  {(selectedRequest.tenant_name || selectedRequest.tenant_email) && (
                    <div
                      style={{
                        background: '#faf5ff',
                        border: '1px solid #e9d5ff',
                        borderRadius: '12px',
                        padding: '1rem',
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                        <Key size={16} />
                        <span>Tenant Information</span>
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#581c87', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div><strong>Name:</strong> {selectedRequest.tenant_name}</div>
                        {selectedRequest.tenant_email && <div><strong>Email:</strong> {selectedRequest.tenant_email}</div>}
                        {selectedRequest.tenant_mobile && <div><strong>Mobile:</strong> {selectedRequest.tenant_mobile}</div>}
                        {(selectedRequest.lease_start_date || selectedRequest.lease_end_date) && (
                          <div>
                            <strong>Lease Term:</strong> {selectedRequest.lease_start_date || 'N/A'} to {selectedRequest.lease_end_date || 'N/A'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Applicant Notes / Remarks */}
                  {(selectedRequest.remarks || selectedRequest.rejection_reason || selectedRequest.correction_message) && (
                    <div style={{ padding: '0.85rem 1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', fontSize: '0.85rem' }}>
                      {selectedRequest.remarks && (
                        <div style={{ marginBottom: (selectedRequest.rejection_reason || selectedRequest.correction_message) ? '0.5rem' : 0 }}>
                          <strong style={{ color: '#92400e' }}>Applicant Note:</strong> {selectedRequest.remarks}
                        </div>
                      )}
                      {selectedRequest.correction_message && (
                        <div style={{ color: '#b45309', marginBottom: selectedRequest.rejection_reason ? '0.5rem' : 0 }}>
                          <strong>Correction Instructions:</strong> {selectedRequest.correction_message}
                        </div>
                      )}
                      {selectedRequest.rejection_reason && (
                        <div style={{ color: '#b91c1c' }}>
                          <strong>Rejection Reason:</strong> {selectedRequest.rejection_reason}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>
                    Application Submitted: {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString() : 'N/A'}
                  </div>
                </div>
              )}

              {/* APPROVE ACTION STEP */}
              {modalType === 'approve' && (
                <div>
                  <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Applicant: <strong>{selectedRequest.applicant_name}</strong> for Flat{' '}
                    <strong>{selectedRequest.flat_number}</strong> ({selectedRequest.requested_membership_type})
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Approving this request will immediately activate household access in Flat{' '}
                    <strong>{selectedRequest.flat_number}</strong> ({selectedRequest.block_name || 'Tower A'}) and notify the applicant.
                  </p>
                </div>
              )}

              {/* REJECT ACTION STEP */}
              {modalType === 'reject' && (
                <div>
                  <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Applicant: <strong>{selectedRequest.applicant_name}</strong> for Flat{' '}
                    <strong>{selectedRequest.flat_number}</strong>
                  </div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Rejection Reason (Optional)
                  </label>
                  <textarea
                    rows={3}
                    className="admin-search-input"
                    style={{ width: '100%', padding: '0.65rem' }}
                    placeholder="Enter the reason for rejection (e.g. Unverified identity proof)..."
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                  />
                </div>
              )}

              {/* CORRECTION ACTION STEP */}
              {modalType === 'correction' && (
                <div>
                  <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Applicant: <strong>{selectedRequest.applicant_name}</strong> for Flat{' '}
                    <strong>{selectedRequest.flat_number}</strong>
                  </div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Correction Instructions (Required)
                  </label>
                  <textarea
                    rows={3}
                    className="admin-search-input"
                    style={{ width: '100%', padding: '0.65rem' }}
                    placeholder="e.g. Please update your flat number or upload proof of ownership..."
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                  />
                </div>
              )}

              {/* Email Notification Preview for Approve, Reject, and Correction */}
              {modalType !== 'view' && selectedRequest.applicant_email && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '0.85rem 1rem',
                    background: 'linear-gradient(135deg, #f8faff 0%, #f1f5f9 100%)',
                    border: '1px solid #e0e7ff',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem', fontSize: '0.8rem', color: '#1e293b' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: '#e0e7ff',
                          color: '#4f46e5',
                          flexShrink: 0,
                        }}
                      >
                        <Mail size={13} />
                      </div>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>From:</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: '#065f46',
                          background: '#d1fae5',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid #a7f3d0',
                          fontSize: '0.78rem',
                          fontFamily: 'monospace',
                        }}
                        title="Official Society Email Account"
                      >
                        bpstwintowers.society@gmail.com
                      </span>
                      <span style={{ color: '#94a3b8' }}>➔</span>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>To:</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: '#1e1b4b',
                          background: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.78rem',
                          fontFamily: 'monospace',
                        }}
                      >
                        {selectedRequest.applicant_email}
                      </span>
                    </div>

                    {(() => {
                      const emailData = generateRegistrationEmail(modalType as any, selectedRequest, modalInput.trim());
                      return (
                        <a
                          href={emailData.gmailUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#4f46e5',
                            background: '#ffffff',
                            border: '1px solid #c7d2fe',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            transition: 'all 0.15s ease',
                          }}
                          title="Preview draft in Gmail Web compose"
                        >
                          <ExternalLink size={12} />
                          <span>Preview in Gmail</span>
                        </a>
                      );
                    })()}
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      fontSize: '0.8rem',
                      color: '#475569',
                      cursor: 'pointer',
                      userSelect: 'none',
                      paddingTop: '0.45rem',
                      borderTop: '1px dashed #e2e8f0',
                      margin: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={sendEmailEnabled}
                      onChange={(e) => setSendEmailEnabled(e.target.checked)}
                      style={{
                        width: '16px',
                        height: '16px',
                        minWidth: '16px',
                        minHeight: '16px',
                        maxWidth: '16px',
                        maxHeight: '16px',
                        accentColor: '#4f46e5',
                        cursor: 'pointer',
                        margin: 0,
                        padding: 0,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontWeight: 500, lineHeight: 1.3 }}>
                      Open prefilled Gmail draft upon confirmation
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              {modalType === 'view' ? (
                <>
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={handleCloseModal}
                  >
                    Close Form
                  </button>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-action-correct"
                      onClick={() => handleOpenCorrection(selectedRequest)}
                    >
                      Request Correction
                    </button>
                    <button
                      type="button"
                      className="btn-action-reject"
                      onClick={() => handleOpenReject(selectedRequest)}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="btn-action-approve"
                      onClick={() => handleOpenApprove(selectedRequest)}
                    >
                      Approve Application
                    </button>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Menu Visibility Settings Modal */}
      <MenuVisibilityModal
        isOpen={isMenuVisibilityModalOpen}
        onClose={() => setIsMenuVisibilityModalOpen(false)}
      />
    </div>
  );
};
