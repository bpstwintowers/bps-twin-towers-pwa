import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
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
  Save,
} from 'lucide-react';
import {
  getCurrentUserProfile,
  updateUserProfile,
  type UserProfileData,
} from '../../services/supabase/profileService';
import type { AccessInfo } from '../../services/supabase/registrationService';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updated: UserProfileData) => void;
  userRoles?: string[];
  accessList?: AccessInfo[];
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
  userRoles = [],
  accessList = [],
}) => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [parkingDetails, setParkingDetails] = useState('');
  const [residentSince, setResidentSince] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccessMsg(null);
        const data = await getCurrentUserProfile();
        if (data) {
          setProfile(data);
          setFullName(data.full_name || '');
          setMobile(data.mobile || '');
          setPhotoUrl(data.photo_url || '');
          setBloodGroup(data.blood_group || '');
          setParkingDetails(data.parking_details || '');
          setResidentSince(data.resident_since || '');
        }
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const updated = await updateUserProfile({
        full_name: fullName,
        mobile: mobile || null,
        photo_url: photoUrl || null,
        blood_group: bloodGroup || null,
        parking_details: parkingDetails || null,
        resident_since: residentSince || null,
      });

      setProfile(updated);
      setSuccessMsg('Profile updated successfully!');
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }

      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const displayInitial = (fullName || profile?.full_name || 'R').charAt(0).toUpperCase();

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
          maxWidth: '560px',
          width: '100%',
          maxHeight: '88vh',
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
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(0, 137, 123, 0.25)',
                color: '#2dd4bf',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, color: '#ffffff' }}>
                Resident Profile & Account
              </h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
                View and edit your personal details & preferences
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

        {/* Modal Body */}
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
          {/* Alerts */}
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

          {successMsg && (
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
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
              Loading profile details...
            </div>
          ) : (
            <form id="edit-profile-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Profile Avatar Card */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#00897b',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    flexShrink: 0,
                    overflow: 'hidden',
                    boxShadow: '0 4px 10px rgba(0, 137, 123, 0.25)',
                  }}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    displayInitial
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#0f172a' }}>
                    {fullName || 'Resident'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    {profile?.email || 'Authenticated User'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                    {userRoles.map((r, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          background: r.toLowerCase().includes('admin') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 137, 123, 0.1)',
                          color: r.toLowerCase().includes('admin') ? '#dc2626' : '#00685f',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Input Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                {/* Full Name */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <User size={13} /> Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Enter full name"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Email (Readonly) */}
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <Mail size={13} /> Email (Auth)
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.85rem',
                      color: '#64748b',
                      background: '#f1f5f9',
                      boxSizing: 'border-box',
                      cursor: 'not-allowed',
                    }}
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <Phone size={13} /> Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 9876543210"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Blood Group */}
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <Heart size={13} /> Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resident Since */}
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <Calendar size={13} /> Resident Since
                  </label>
                  <input
                    type="date"
                    value={residentSince}
                    onChange={(e) => setResidentSince(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Parking / Vehicle Details */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <Car size={13} /> Parking Slot & Vehicle Details
                  </label>
                  <input
                    type="text"
                    value={parkingDetails}
                    onChange={(e) => setParkingDetails(e.target.value)}
                    placeholder="e.g. Slot B-104 (Car: TN09AB1234, Bike: TN09CD5678)"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Photo / Avatar URL */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <Camera size={13} /> Avatar / Profile Photo URL
                  </label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Registered Flats Overview */}
              {accessList.length > 0 && (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building2 size={13} /> Registered Flats ({accessList.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {accessList.map((a) => (
                      <div
                        key={a.membership_id || a.flat_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.45rem 0.65rem',
                          background: '#ffffff',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.8rem',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          Flat {a.flat_number || 'Unit'} ({a.block_name ? `Block ${a.block_name}` : 'Tower'})
                        </span>
                        <span style={{ color: '#00685f', fontWeight: 600, fontSize: '0.74rem' }}>
                          {a.membership_type || a.role_name || 'Resident'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.85rem 1.4rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.65rem',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: '9999px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-profile-form"
            disabled={saving || loading}
            style={{
              padding: '0.55rem 1.35rem',
              borderRadius: '9999px',
              border: 'none',
              background: '#00897b',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 6px rgba(0, 137, 123, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
