import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Shield,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  assignUserRole,
  revokeUserRole,
  fetchRolesForUser,
  getModulesForRole,
  type AdminPermissionItem,
  type RoleItem,
  type UserAssignedRoleItem,
} from '../../services/supabase/adminService';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  editItem?: AdminPermissionItem | null;
  users: Array<{ id: string; full_name: string; email: string }>;
  roles: RoleItem[];
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editItem,
  users,
  roles,
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignedRoles, setAssignedRoles] = useState<UserAssignedRoleItem[]>([]);
  const [selectedRoleIdToAdd, setSelectedRoleIdToAdd] = useState('');
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [removingRoleId, setRemovingRoleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showAllRolesDirectory, setShowAllRolesDirectory] = useState(false);

  // Initialize selected user and load their assigned roles
  useEffect(() => {
    if (!isOpen) return;

    let targetUid = '';
    if (editItem) {
      targetUid = editItem.user_id;
    } else if (users.length > 0) {
      targetUid = users[0].id;
    }

    setSelectedUserId(targetUid);
    setError(null);
    setFeedback(null);

    if (targetUid) {
      loadUserRoles(targetUid);
    }
  }, [editItem, users, isOpen]);

  // Load roles whenever selectedUserId changes
  const loadUserRoles = async (userId: string) => {
    if (!userId) {
      setAssignedRoles([]);
      return;
    }
    try {
      setLoadingRoles(true);
      const userRoles = await fetchRolesForUser(userId);
      setAssignedRoles(userRoles);

      // Preselect first role not already assigned
      const assignedRoleIds = new Set(userRoles.map((r) => r.role_id));
      const availableToAdd = roles.filter((r) => !assignedRoleIds.has(r.id));
      if (availableToAdd.length > 0) {
        setSelectedRoleIdToAdd(availableToAdd[0].id);
      } else if (roles.length > 0) {
        setSelectedRoleIdToAdd(roles[0].id);
      }
    } catch (err: any) {
      console.error('Error loading roles for user:', err);
      setError('Failed to load assigned roles.');
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    setError(null);
    setFeedback(null);
    loadUserRoles(userId);
  };

  // Add new role to user
  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select a resident.');
      return;
    }
    if (!selectedRoleIdToAdd) {
      setError('Please select a role to assign.');
      return;
    }

    // Check if user already has this role
    if (assignedRoles.some((r) => r.role_id === selectedRoleIdToAdd)) {
      setError('This user is already assigned this role.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await assignUserRole(selectedUserId, selectedRoleIdToAdd);
      
      const roleObj = roles.find((r) => r.id === selectedRoleIdToAdd);
      setFeedback(`Assigned "${roleObj?.name || 'Role'}" to resident.`);
      onSuccess(`Assigned "${roleObj?.name || 'Role'}" successfully.`);

      await loadUserRoles(selectedUserId);
    } catch (err: any) {
      console.error('Error adding role:', err);
      setError(err.message || 'Failed to assign role.');
    } finally {
      setActionLoading(false);
    }
  };

  // Remove / Revoke a specific role from user
  const handleRemoveRole = async (userRole: UserAssignedRoleItem) => {
    try {
      setRemovingRoleId(userRole.id);
      setError(null);
      await revokeUserRole(userRole.id);

      setFeedback(`Removed "${userRole.role_name}" from resident.`);
      onSuccess(`Removed "${userRole.role_name}" role.`);

      await loadUserRoles(selectedUserId);
    } catch (err: any) {
      console.error('Error removing role:', err);
      setError(err.message || 'Failed to remove role.');
    } finally {
      setRemovingRoleId(null);
    }
  };

  if (!isOpen) return null;

  const currentRoleToAdd = roles.find((r) => r.id === selectedRoleIdToAdd);
  const modulesPreview = currentRoleToAdd ? getModulesForRole(currentRoleToAdd.name) : '';
  const selectedUserObj = users.find((u) => u.id === selectedUserId) || (editItem ? { full_name: editItem.user_name, email: editItem.email } : null);

  const assignedRoleIds = new Set(assignedRoles.map((r) => r.role_id));
  const remainingRoles = roles.filter((r) => !assignedRoleIds.has(r.id));

  return createPortal(
    <div
      className="modal-overlay animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        zIndex: 99999,
        boxSizing: 'border-box',
      }}
    >
      <div
        className="modal-content animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          width: '100%',
          maxHeight: '85vh',
          borderRadius: '16px',
          background: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.1rem 1.4rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.25)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, color: '#ffffff' }}>
                User Roles & Permissions
              </h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
                Manage clearance and module permissions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body (Scrollable Container) */}
        <div
          style={{
            padding: '1.25rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.15rem',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Error Alert */}
          {error && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Feedback Success Alert */}
          {feedback && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <CheckCircle size={15} style={{ flexShrink: 0 }} />
              <span>{feedback}</span>
            </div>
          )}

          {/* Target Resident Profile Card */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#475569',
                marginBottom: '0.4rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Target Resident
            </label>
            {editItem ? (
              <div
                style={{
                  padding: '0.75rem 0.9rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                  }}
                >
                  {(selectedUserObj?.full_name || 'R').charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedUserObj?.full_name || 'Resident'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedUserObj?.email}
                  </div>
                </div>
              </div>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => handleUserChange(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  color: '#0f172a',
                  outline: 'none',
                }}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || 'Resident'} ({u.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Section 1: Assigned Roles */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.45rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Currently Assigned Roles ({assignedRoles.length})
              </label>
            </div>

            {loadingRoles ? (
              <div style={{ padding: '0.85rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                Loading roles...
              </div>
            ) : assignedRoles.length === 0 ? (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1.5px dashed #cbd5e1',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '0.82rem',
                }}
              >
                No special roles assigned (Default resident access).
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {assignedRoles.map((ur) => {
                  const isRemoving = removingRoleId === ur.id;
                  const roleModules = getModulesForRole(ur.role_name);
                  const isRoleAdmin = ur.role_name.toLowerCase().includes('admin');

                  return (
                    <div
                      key={ur.id}
                      style={{
                        padding: '0.7rem 0.85rem',
                        borderRadius: '10px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              background: isRoleAdmin ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                              color: isRoleAdmin ? '#dc2626' : '#2563eb',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                            }}
                          >
                            {ur.role_name}
                          </span>
                          {ur.role_description && (
                            <span style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ur.role_description}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: '0.74rem',
                            color: '#0d9488',
                            fontWeight: 500,
                            marginTop: '0.2rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={`Access: ${roleModules}`}
                        >
                          ↳ Access: {roleModules}
                        </div>
                      </div>

                      {/* Compact Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(ur)}
                        disabled={isRemoving || actionLoading}
                        title={`Remove ${ur.role_name}`}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          border: '1px solid #fecaca',
                          background: '#fff5f5',
                          color: '#dc2626',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Trash2 size={12} />
                        <span>{isRemoving ? 'Removing...' : 'Remove'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Assign Additional Role */}
          <div
            style={{
              padding: '0.95rem 1rem',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <label
              style={{
                display: 'block',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#475569',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Assign Additional Role
            </label>

            {remainingRoles.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                All available roles are already assigned to this resident.
              </div>
            ) : (
              <form onSubmit={handleAddRole} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select
                    value={selectedRoleIdToAdd}
                    onChange={(e) => setSelectedRoleIdToAdd(e.target.value)}
                    required
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '0.88rem',
                      fontWeight: 500,
                      color: '#0f172a',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {remainingRoles.map((r) => (
                      <option key={r.id} value={r.id} style={{ fontSize: '0.86rem', color: '#0f172a' }}>
                        {r.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    disabled={actionLoading || !selectedRoleIdToAdd}
                    style={{
                      padding: '0.6rem 1.05rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      boxShadow: '0 2px 5px rgba(37, 99, 235, 0.2)',
                    }}
                  >
                    <Plus size={15} />
                    <span>{actionLoading ? 'Adding...' : 'Add Role'}</span>
                  </button>
                </div>

                {/* Module & Description Preview */}
                {currentRoleToAdd && (
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: '#f0fdfa',
                      border: '1px solid #ccfbf1',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    {currentRoleToAdd.description && (
                      <div style={{ color: '#134e4a', fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.35 }}>
                        {currentRoleToAdd.description}
                      </div>
                    )}
                    {modulesPreview && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', fontSize: '0.76rem', color: '#0d9488', lineHeight: 1.35 }}>
                        <Sparkles size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span><strong>Grants access to:</strong> {modulesPreview}</span>
                      </div>
                    )}
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Section 3: Collapsible Role Directory */}
          <div>
            <button
              type="button"
              onClick={() => setShowAllRolesDirectory(!showAllRolesDirectory)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: 0,
              }}
            >
              <Info size={14} />
              <span>{showAllRolesDirectory ? 'Hide System Roles Matrix' : 'View All System Roles & Permissions Matrix'}</span>
              {showAllRolesDirectory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAllRolesDirectory && (
              <div
                className="animate-fade-in"
                style={{
                  marginTop: '0.55rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  background: '#f8fafc',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  maxHeight: '150px',
                  overflowY: 'auto',
                }}
              >
                {roles.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '0.4rem 0.55rem',
                      borderRadius: '6px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                      {r.name}
                      <span style={{ fontWeight: 400, color: '#64748b', marginLeft: '0.35rem' }}>
                        {r.description || ''}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#0d9488', marginTop: '0.1rem' }}>
                      Access: {getModulesForRole(r.name)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.85rem 1.4rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1.35rem',
              borderRadius: '9999px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
