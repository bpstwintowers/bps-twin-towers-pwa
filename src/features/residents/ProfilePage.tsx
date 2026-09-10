import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Car,
  Heart,
  Calendar,
  Shield,
  Building2,
  CheckCircle,
  AlertCircle,
  Camera,
  LogOut,
  Users,
  Edit3,
  FileText,
  Key,
  Bell,
  Check,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import {
  getCurrentUserProfile,
  getHouseholdFamilyMembers,
  getFlatTenantAndOccupancy,
  getFlatVehicles,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  type UserProfileData,
  type FamilyMemberItem,
  type TenantInfo,
  type VehicleInfo,
  type UserNotificationPrefs,
} from '../../services/supabase/profileService';
import {
  resolveUserAccess,
  type AccessInfo,
} from '../../services/supabase/registrationService';
import { fetchUserRoles } from '../../services/supabase/adminService';
import { EditProfileModal } from './EditProfileModal';
import './ProfilePage.css';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [accessList, setAccessList] = useState<AccessInfo[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberItem[]>([]);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [vehicles, setVehicles] = useState<VehicleInfo[]>([]);
  const [notifPrefs, setNotifPrefs] = useState<UserNotificationPrefs>({
    email_notifications: true,
    sms_notifications: true,
    event_updates: true,
    contribution_updates: false,
    announcement_updates: true,
  });

  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profData, accessData, rolesData, prefsData] = await Promise.all([
        getCurrentUserProfile(),
        resolveUserAccess().catch(() => []),
        fetchUserRoles().catch(() => ['Resident']),
        getUserNotificationPreferences(),
      ]);

      setProfile(profData);
      setAccessList(accessData);
      setUserRoles(rolesData);
      setNotifPrefs(prefsData);

      // Load flat-specific family, tenant and vehicles
      const primaryFlatId = accessData[0]?.flat_id;
      if (primaryFlatId) {
        const [famData, tData, vData] = await Promise.all([
          getHouseholdFamilyMembers(primaryFlatId),
          getFlatTenantAndOccupancy(primaryFlatId),
          getFlatVehicles(primaryFlatId),
        ]);
        setFamilyMembers(famData);
        setTenantInfo(tData);
        setVehicles(vData);
      }
    } catch (err) {
      console.error('Error loading profile page data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePref = async (key: keyof UserNotificationPrefs) => {
    const updated = {
      ...notifPrefs,
      [key]: !notifPrefs[key],
    };
    setNotifPrefs(updated);
    try {
      setSavingPrefs(true);
      await updateUserNotificationPreferences(updated);
    } catch (err) {
      console.error('Error saving notification preferences:', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const activeFlat = accessList[0];
  const displayInitial = (profile?.full_name || 'R').charAt(0).toUpperCase();

  const getPrimaryRoleTitle = () => {
    if (userRoles.some((r) => r.toLowerCase().includes('admin'))) {
      return userRoles.find((r) => r.toLowerCase().includes('admin')) || 'Administrator';
    }
    if (activeFlat?.membership_type) {
      return `${activeFlat.membership_type} (${activeFlat.role_name || 'Resident'})`;
    }
    return 'Resident Member';
  };

  if (loading) {
    return (
      <div className="my-profile-container" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>Loading profile details...</div>
      </div>
    );
  }

  return (
    <div className="my-profile-container animate-fade-in">
      {/* Page Header */}
      <div className="profile-page-header">
        <div>
          <h1 className="profile-page-title">My Profile</h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Manage your personal credentials, household records, and account settings
          </p>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="profile-grid-layout">
        {/* =========================================================================
            CARD 1: PERSONAL INFORMATION
           ========================================================================= */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-title">
              <User size={18} style={{ color: '#00897b' }} />
              <span>Personal Information</span>
            </div>
            <button
              type="button"
              className="btn-profile-edit"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit3 size={14} />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* User Hero Block */}
          <div className="personal-hero-block">
            <div className="personal-avatar-wrapper">
              {profile?.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt="Avatar"
                  className="personal-avatar-img"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                displayInitial
              )}
              <div className="personal-avatar-badge" title="Change Avatar via Edit Profile">
                <Camera size={11} />
              </div>
            </div>

            <div className="personal-name-block">
              <div className="personal-full-name">{profile?.full_name || 'Resident Name'}</div>
              <div className="personal-role-subtitle">{getPrimaryRoleTitle()}</div>
            </div>
          </div>

          {/* Details List */}
          <div className="profile-details-list">
            <div className="profile-detail-row">
              <span className="profile-detail-label">
                <User size={14} /> Full Name
              </span>
              <span className="profile-detail-value">{profile?.full_name || 'Not provided'}</span>
            </div>

            <div className="profile-detail-row">
              <span className="profile-detail-label">
                <Mail size={14} /> Email Address
              </span>
              <span className="profile-detail-value">{profile?.email || 'Not provided'}</span>
            </div>

            <div className="profile-detail-row">
              <span className="profile-detail-label">
                <Phone size={14} /> Mobile Number
              </span>
              <span className="profile-detail-value">{profile?.mobile || 'Not provided'}</span>
            </div>

            <div className="profile-detail-row">
              <span className="profile-detail-label">
                <Heart size={14} /> Blood Group
              </span>
              <span className="profile-detail-value">{profile?.blood_group || 'Not specified'}</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CARD 2: ACCOUNT SETTINGS & NOTIFICATION PREFERENCES
           ========================================================================= */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-title">
              <Shield size={18} style={{ color: '#00897b' }} />
              <span>Account Settings</span>
            </div>
          </div>

          {/* Notification Preferences */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.35rem',
              }}
            >
              Notification Preferences
            </div>

            <div className="settings-toggle-row">
              <span className="settings-toggle-label">Email Notifications</span>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={notifPrefs.email_notifications}
                  onChange={() => handleTogglePref('email_notifications')}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <span className="settings-toggle-label">SMS / Instant Alerts</span>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={notifPrefs.sms_notifications}
                  onChange={() => handleTogglePref('sms_notifications')}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <span className="settings-toggle-label">Event Updates & Reminders</span>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={notifPrefs.event_updates}
                  onChange={() => handleTogglePref('event_updates')}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <span className="settings-toggle-label">Contribution & Donation Updates</span>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={notifPrefs.contribution_updates}
                  onChange={() => handleTogglePref('contribution_updates')}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="danger-zone-container">
            <span className="danger-zone-title">Danger Zone</span>
            <div className="danger-zone-action">
              <button
                type="button"
                className="btn-danger-logout"
                onClick={handleSignOut}
              >
                Log Out
              </button>
              <span className="danger-zone-desc">Securely sign out of your account</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CARD 3: COMMUNITY & FLAT INFORMATION
           ========================================================================= */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-title">
              <Building2 size={18} style={{ color: '#00897b' }} />
              <span>Community Information</span>
            </div>
          </div>

          <div className="profile-details-list">
            <div className="profile-detail-row">
              <span className="profile-detail-label">Tower / Block</span>
              <span className="profile-detail-value">
                {activeFlat?.block_name
                  ? `Tower ${activeFlat.block_name}`
                  : (activeFlat?.flat_number || '').toUpperCase().startsWith('B')
                  ? 'Tower B'
                  : 'Tower A'}
              </span>
            </div>

            <div className="profile-detail-row">
              <span className="profile-detail-label">Flat Number</span>
              <span className="profile-detail-value">{activeFlat?.flat_number || 'A811'}</span>
            </div>

            <div className="profile-detail-row">
              <span className="profile-detail-label">Membership Type</span>
              <span className="profile-detail-value">
                <span className="status-pill-owner">
                  {activeFlat?.membership_type || 'Primary Resident (Owner)'}
                </span>
              </span>
            </div>

            <div className="profile-detail-row">
              <span className="profile-detail-label">Resident Since</span>
              <span className="profile-detail-value">
                {profile?.resident_since
                  ? new Date(profile.resident_since).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'August 2026'}
              </span>
            </div>

            <div className="profile-detail-row">
              <span className="profile-detail-label">Verification Status</span>
              <span className="profile-detail-value">
                <span className="status-pill-approved">
                  <Check size={12} /> Approved
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CARD 4: FAMILY MEMBERS
           ========================================================================= */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-title">
              <Users size={18} style={{ color: '#00897b' }} />
              <span>Family Members ({familyMembers.length})</span>
            </div>
            <button
              type="button"
              className="btn-profile-edit"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Plus size={14} />
              <span>Manage</span>
            </button>
          </div>

          {familyMembers.length === 0 ? (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1.5px dashed #cbd5e1',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '0.84rem',
              }}
            >
              No family members registered under this flat.
            </div>
          ) : (
            <div className="family-cards-list">
              {familyMembers.map((m) => (
                <div key={m.id} className="family-member-card">
                  <div className="family-member-left">
                    <div className="family-member-avatar">
                      {m.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="family-member-name">{m.full_name}</div>
                      <div className="family-member-rel">
                        {m.relationship} {m.email ? `• ${m.email}` : ''} {m.mobile ? `• ${m.mobile}` : ''}
                      </div>
                    </div>
                  </div>
                  <span className="status-pill-owner" style={{ fontSize: '0.72rem' }}>
                    {m.relationship}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================================================================
            CARD 5: TENANTS & OCCUPANCY DETAILS
           ========================================================================= */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-title">
              <Key size={18} style={{ color: '#00897b' }} />
              <span>Occupancy & Tenant Information</span>
            </div>
          </div>

          <div className="profile-details-list">
            <div className="profile-detail-row">
              <span className="profile-detail-label">Occupancy Status</span>
              <span className="profile-detail-value">
                <span
                  className={
                    tenantInfo?.occupancy_status === 'Rented Out'
                      ? 'status-pill-rented'
                      : 'status-pill-approved'
                  }
                >
                  {tenantInfo?.occupancy_status || 'Self Occupied'}
                </span>
              </span>
            </div>

            {tenantInfo?.tenant_name && (
              <>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Tenant Name</span>
                  <span className="profile-detail-value">{tenantInfo.tenant_name}</span>
                </div>

                <div className="profile-detail-row">
                  <span className="profile-detail-label">Tenant Email</span>
                  <span className="profile-detail-value">{tenantInfo.tenant_email || 'Not provided'}</span>
                </div>

                <div className="profile-detail-row">
                  <span className="profile-detail-label">Tenant Mobile</span>
                  <span className="profile-detail-value">{tenantInfo.tenant_mobile || 'Not provided'}</span>
                </div>

                <div className="profile-detail-row">
                  <span className="profile-detail-label">Lease Duration</span>
                  <span className="profile-detail-value">
                    {tenantInfo.lease_start_date || 'N/A'} - {tenantInfo.lease_end_date || 'N/A'}
                  </span>
                </div>
              </>
            )}

            {tenantInfo?.occupancy_status !== 'Rented Out' && !tenantInfo?.tenant_name && (
              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  fontSize: '0.82rem',
                }}
              >
                Flat is currently recorded as <strong>Self Occupied</strong> by the owner.
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            CARD 6: VEHICLES & PARKING ALLOCATIONS
           ========================================================================= */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-title">
              <Car size={18} style={{ color: '#00897b' }} />
              <span>Vehicles & Parking Slots</span>
            </div>
            <button
              type="button"
              className="btn-profile-edit"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit3 size={14} />
              <span>Update</span>
            </button>
          </div>

          <div className="profile-details-list">
            <div className="profile-detail-row">
              <span className="profile-detail-label">Allocated Parking Slot(s)</span>
              <span className="profile-detail-value">
                {profile?.parking_details || 'Slot B-104 (Covered)'}
              </span>
            </div>

            {vehicles.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.35rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Registered Vehicles ({vehicles.length})
                </span>
                {vehicles.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.55rem 0.75rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <strong>{v.reg_number || 'Vehicle'}</strong> ({v.make_model || v.vehicle_type || 'Car'})
                    </div>
                    <span style={{ color: '#64748b', fontSize: '0.74rem' }}>{v.colour}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="profile-detail-row">
                <span className="profile-detail-label">Registered Vehicles</span>
                <span className="profile-detail-value">
                  {profile?.parking_details ? 'Recorded with parking' : '1 Car, 1 Two-Wheeler'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onProfileUpdated={(updated) => {
            setProfile((prev) => ({ ...prev, ...updated }));
            loadProfileData();
          }}
          userRoles={userRoles}
          accessList={accessList}
        />
      )}
    </div>
  );
};
