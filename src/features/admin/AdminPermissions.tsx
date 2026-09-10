import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  Calendar,
  Building2,
  CreditCard,
  HandHelping,
  Megaphone,
  Home,
  Sliders,
} from 'lucide-react';
import {
  fetchUserPermissionsList,
  fetchAllAvailableRoles,
  fetchAllUsersForPermissionDropdown,
  revokeUserRole,
  type AdminPermissionItem,
  type RoleItem,
} from '../../services/supabase/adminService';
import { PermissionModal } from './PermissionModal';
import { MenuVisibilityModal } from '../../components/layout/MenuVisibilityModal';
import { useSearch } from '../../context/SearchContext';
import './AdminPermissions.css';

export const AdminPermissions: React.FC = () => {
  const { searchQuery, setSearchPlaceholder } = useSearch();
  const [permissions, setPermissions] = useState<AdminPermissionItem[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuVisibilityModalOpen, setIsMenuVisibilityModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdminPermissionItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<AdminPermissionItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [permList, roleList, userList] = await Promise.all([
        fetchUserPermissionsList(),
        fetchAllAvailableRoles(),
        fetchAllUsersForPermissionDropdown(),
      ]);
      setPermissions(permList);
      setRoles(roleList);
      setUsers(userList);
    } catch (err: any) {
      console.error('Error loading permissions:', err);
      setAlertMessage({ type: 'error', text: 'Failed to load permissions list.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setSearchPlaceholder('Search permissions by name, email, or role...');
  }, [setSearchPlaceholder]);

  const handleOpenNewModal = () => {
    setEditItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: AdminPermissionItem) => {
    setEditItem(item);
    setIsModalOpen(true);
  };

  const handleRevokeRole = async () => {
    if (!deleteConfirmItem) return;
    try {
      setActionLoading(true);
      await revokeUserRole(deleteConfirmItem.id);
      setAlertMessage({
        type: 'success',
        text: `Permissions revoked for ${deleteConfirmItem.user_name}. User has been reverted to Resident.`,
      });
      setDeleteConfirmItem(null);
      await loadData();
    } catch (err: any) {
      console.error('Error revoking permission:', err);
      setAlertMessage({ type: 'error', text: err.message || 'Failed to revoke permissions.' });
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeClass = (roleName: string) => {
    const r = (roleName || '').toLowerCase();
    if (r.includes('admin') && !r.includes('event') && !r.includes('facility')) return 'admin';
    if (r.includes('event') || r.includes('festival')) return 'event';
    if (r.includes('facility') || r.includes('helpdesk')) return 'facility';
    if (r.includes('finance') || r.includes('treasurer')) return 'finance';
    if (r.includes('volunteer')) return 'volunteer';
    if (r.includes('security') || r.includes('gate')) return 'security';
    return 'default';
  };

  const getTabIcon = (roleName: string) => {
    const r = (roleName || '').toLowerCase();
    if (r === 'all') return Users;
    if (r.includes('admin') && !r.includes('event') && !r.includes('facility')) return Shield;
    if (r.includes('event') || r.includes('festival')) return Calendar;
    if (r.includes('facility') || r.includes('helpdesk')) return Building2;
    if (r.includes('finance') || r.includes('treasurer')) return CreditCard;
    if (r.includes('volunteer')) return HandHelping;
    if (r.includes('communication') || r.includes('pr')) return Megaphone;
    if (r.includes('security') || r.includes('gate')) return Shield;
    return Home;
  };

  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

  // Compute distinct role tabs with counts
  const roleTabs = useMemo(() => {
    const counts: Record<string, number> = { ALL: permissions.length };
    permissions.forEach((p) => {
      const r = p.role_name || 'Resident';
      counts[r] = (counts[r] || 0) + 1;
    });

    const tabs = [
      { name: 'ALL', label: 'All Roles', count: counts.ALL || 0, icon: Users },
    ];

    Object.keys(counts)
      .filter((k) => k !== 'ALL')
      .forEach((roleKey) => {
        tabs.push({
          name: roleKey,
          label: roleKey,
          count: counts[roleKey],
          icon: getTabIcon(roleKey),
        });
      });

    return tabs;
  }, [permissions]);

  // Filter permissions by search query & role filter
  const filteredPermissions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return permissions.filter((p) => {
      const matchesSearch =
        !q ||
        p.user_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.role_name.toLowerCase().includes(q) ||
        p.modules.toLowerCase().includes(q);

      const matchesRole =
        selectedRoleFilter === 'ALL' ||
        p.role_name.toLowerCase() === selectedRoleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [permissions, searchQuery, selectedRoleFilter]);

  return (
    <div className="permissions-container animate-fade-in">
      {/* Alert Banner */}
      {alertMessage && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: alertMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${alertMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: alertMessage.type === 'success' ? '#166534' : '#991b1b',
            fontSize: '0.86rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {alertMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{alertMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertMessage(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Tab Wise Role Filter (Matches Reference UI) */}
      {permissions.length > 0 && (
        <div className="permissions-tabs-bar">
          {roleTabs.map((tab) => {
            const isSelected = selectedRoleFilter.toLowerCase() === tab.name.toLowerCase();
            const Icon = tab.icon;
            return (
              <button
                key={tab.name}
                type="button"
                className={`permissions-tab-btn ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedRoleFilter(tab.name)}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                <span className="tab-count-badge">{tab.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Toolbar */}
      <div className="permissions-toolbar" style={{ justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-outline"
            onClick={() => setIsMenuVisibilityModalOpen(true)}
            title="Configure which menus residents can see"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0d9488', borderColor: '#99f6e4', background: '#f0fdfa', fontWeight: 600, padding: '0.6rem 0.95rem', borderRadius: '20px' }}
          >
            <Sliders size={14} />
            <span>Resident Menus</span>
          </button>

          <button
            type="button"
            className="btn-outline"
            onClick={loadData}
            title="Refresh permissions list"
            style={{ padding: '0.6rem 0.85rem', borderRadius: '20px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            className="btn-new-permission"
            onClick={handleOpenNewModal}
          >
            <Plus size={16} />
            <span>+ New Permission</span>
          </button>
        </div>
      </div>

      {/* Data Card & Table */}
      <div className="permissions-card">
        {loading ? (
          <div className="permissions-empty">
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid #e2e8f0',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span>Loading user permissions...</span>
          </div>
        ) : filteredPermissions.length === 0 ? (
          <div className="permissions-empty">
            <div className="permissions-empty-icon">
              <Users size={24} />
            </div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>No Permissions Found</div>
            <div style={{ fontSize: '0.82rem', maxWidth: '320px' }}>
              {searchQuery
                ? 'No users matched your search criteria.'
                : 'No administrative role permissions have been assigned yet.'}
            </div>
          </div>
        ) : (
          <div className="permissions-table-responsive">
            <table className="permissions-table">
              <thead>
                <tr>
                  <th>USER</th>
                  <th>EMAIL</th>
                  <th>ROLE</th>
                  <th>MODULES</th>
                  <th>ACTIVE</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPermissions.map((item) => (
                  <tr key={item.id}>
                    {/* User */}
                    <td>
                      <div className="permission-user-cell">
                        <div className="permission-user-avatar">
                          {item.user_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="permission-user-name">{item.user_name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td>
                      <span className="permission-email-text">{item.email}</span>
                    </td>

                    {/* Role */}
                    <td>
                      <span className={`role-badge-pill ${getRoleBadgeClass(item.role_name)}`}>
                        {item.role_name}
                      </span>
                    </td>

                    {/* Modules */}
                    <td>
                      <div className="permission-modules-text">{item.modules}</div>
                    </td>

                    {/* Active */}
                    <td>
                      <span className="badge-active-pill">Active</span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="permission-actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-permission-action edit"
                          onClick={() => handleOpenEditModal(item)}
                          title="Edit user permission"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-permission-action delete"
                          onClick={() => setDeleteConfirmItem(item)}
                          title="Revoke permission"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permission Modal */}
      {isModalOpen && (
        <PermissionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(msg) => {
            setAlertMessage({ type: 'success', text: msg });
            loadData();
          }}
          editItem={editItem}
          users={users}
          roles={roles}
        />
      )}

      {/* Revoke Confirmation Dialog */}
      {deleteConfirmItem && (
        <div className="modal-overlay animate-fade-in" onClick={() => setDeleteConfirmItem(null)}>
          <div
            className="modal-content animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '100%', padding: '1.5rem', borderRadius: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  Revoke Role Permission?
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                  User will lose administrative access to their assigned modules
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, margin: '1rem 0' }}>
              Are you sure you want to revoke <strong>{deleteConfirmItem.role_name}</strong> permissions for{' '}
              <strong>{deleteConfirmItem.user_name}</strong> ({deleteConfirmItem.email})?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleRevokeRole}
                disabled={actionLoading}
                style={{ background: '#dc2626', color: '#ffffff' }}
              >
                {actionLoading ? 'Revoking...' : 'Confirm Revoke'}
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
