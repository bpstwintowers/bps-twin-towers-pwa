import React, { useState, useEffect } from 'react';
import { X, UserPlus, Users, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface HouseholdMember {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  relationship: string;
  membership_type: string;
  resident_type: string | null;
  status: string;
  joined_at: string;
}

interface HouseholdModalProps {
  flatId: string;
  flatNumber: string;
  blockName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const HouseholdModal: React.FC<HouseholdModalProps> = ({
  flatId,
  flatNumber,
  blockName,
  isOpen,
  onClose,
}) => {
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states for adding a member
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [relationship, setRelationship] = useState('Spouse');
  const [residentType, setResidentType] = useState('Family Member');

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('flat_members')
        .select('*')
        .eq('flat_id', flatId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (err: any) {
      console.error('Error loading household members:', err);
      setError('Failed to load household members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && flatId) {
      fetchMembers();
      setIsAdding(false);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, flatId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please provide a full name.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const membershipType =
        residentType === 'Tenant'
          ? 'Tenant'
          : residentType === 'Staff'
          ? 'Staff'
          : 'Family Member';

      const { error: insertError } = await supabase.from('flat_members').insert({
        flat_id: flatId,
        full_name: fullName.trim(),
        email: email.trim() || null,
        mobile: mobile.trim() || null,
        relationship: relationship,
        membership_type: membershipType,
        resident_type: residentType,
        status: 'Active',
      });

      if (insertError) throw insertError;

      setSuccess(`Added ${fullName} to household.`);
      setFullName('');
      setEmail('');
      setMobile('');
      setIsAdding(false);
      await fetchMembers();
    } catch (err: any) {
      console.error('Error adding member:', err);
      setError(err.message || 'Failed to add household member.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 9999,
      }}
    >
      <div
        className="modal-content animate-fade-in"
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
      >
        <div
          className="modal-header"
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>Household Management</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Flat {flatNumber} (Block {blockName})
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {success && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#34d399',
                marginBottom: '1rem',
                fontSize: '0.85rem',
              }}
            >
              {success}
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#f87171',
                marginBottom: '1rem',
                fontSize: '0.85rem',
              }}
            >
              {error}
            </div>
          )}

          {!isAdding ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Registered Members ({members.length})
                </span>
                <button
                  className="btn-primary"
                  onClick={() => setIsAdding(true)}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
                >
                  <UserPlus size={14} />
                  Add Member / Child
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                  Loading household members...
                </div>
              ) : members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                  No additional household members registered.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
                  {members.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                          {m.full_name || 'Resident'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {m.resident_type || m.membership_type} · {m.relationship}
                          {m.mobile ? ` · ${m.mobile}` : ''}
                        </div>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleAddMember}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                Add Household Member / Child
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                    Type *
                  </label>
                  <select
                    className="admin-search-input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={residentType}
                    onChange={(e) => {
                      setResidentType(e.target.value);
                      if (e.target.value === 'Child') setRelationship('Child');
                    }}
                  >
                    <option value="Family Member">Family Member</option>
                    <option value="Child">Child (No account needed)</option>
                    <option value="Tenant">Tenant</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                    Relationship *
                  </label>
                  <select
                    className="admin-search-input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Son / Daughter</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Tenant">Tenant</option>
                    <option value="Staff">Staff</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    className="admin-search-input"
                    style={{ width: '100%' }}
                    placeholder="10-digit mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    maxLength={10}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    className="admin-search-input"
                    style={{ width: '100%' }}
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setIsAdding(false)}
                  disabled={submitting}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  {submitting ? 'Saving...' : 'Add to Household'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
