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
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'correction' | null>(null);
  const [modalInput, setModalInput] = useState('');

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
    const regPending = stats?.pendingCount ?? registrations.filter(r => r.status === 'PENDING').length;
    const regCorrection = stats?.correctionCount ?? registrations.filter(r => r.status === 'CORRECTION_REQUIRED').length;
    const regApproved = stats?.approvedCount ?? registrations.filter(r => r.status === 'APPROVED').length;
    const regRejected = stats?.rejectedCount ?? registrations.filter(r => r.status === 'REJECTED').length;

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
    if (!selectedRequest || !modalType) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (modalType === 'approve') {
        await approveRegistrationRequest(selectedRequest.id);
        setActionSuccess(`Approved registration for flat ${selectedRequest.flat_number}.`);
      } else if (modalType === 'reject') {
        const reason = modalInput.trim() || 'Application rejected by administration.';
        await rejectRegistrationRequest(selectedRequest.id, reason);
        setActionSuccess(`Rejected registration for flat ${selectedRequest.flat_number}.`);
      } else if (modalType === 'correction') {
        if (!modalInput.trim()) {
          throw new Error('Please specify what the resident needs to correct.');
        }
        await requestRegistrationCorrection(selectedRequest.id, modalInput.trim());
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
                    <tr key={req.id}>
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
                        <div className="table-actions">
                          {req.status === 'PENDING' || req.status === 'CORRECTION_REQUIRED' ? (
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

      {/* 4. REGISTRATION APPROVE / REJECT / CORRECTION MODALS */}
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
                    Rejection Reason (Optional)
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
      {/* Menu Visibility Settings Modal */}
      <MenuVisibilityModal
        isOpen={isMenuVisibilityModalOpen}
        onClose={() => setIsMenuVisibilityModalOpen(false)}
      />
    </div>
  );
};
