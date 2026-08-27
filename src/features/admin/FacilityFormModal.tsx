import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import {
  createAdminFacility,
  updateAdminFacility,
  type FacilityItem,
  type FacilityCategory,
  type FacilityStatus,
  type CreateFacilityPayload,
} from '../../services/supabase/facilityService';

interface FacilityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  facilityToEdit?: FacilityItem | null;
}

export const FacilityFormModal: React.FC<FacilityFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  facilityToEdit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FacilityCategory>('Sports');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(10);
  const [status, setStatus] = useState<FacilityStatus>('Active');
  const [bookingRequired, setBookingRequired] = useState(true);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [openingTime, setOpeningTime] = useState('06:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [slotDuration, setSlotDuration] = useState(60);
  const [advanceDays, setAdvanceDays] = useState(7);
  const [rulesTerms, setRulesTerms] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (facilityToEdit) {
      setName(facilityToEdit.name);
      setDescription(facilityToEdit.description || '');
      setCategory(facilityToEdit.category);
      setLocation(facilityToEdit.location || '');
      setCapacity(facilityToEdit.capacity);
      setStatus(facilityToEdit.status);
      setBookingRequired(facilityToEdit.booking_required);
      setApprovalRequired(facilityToEdit.approval_required);
      setOpeningTime(facilityToEdit.opening_time.substring(0, 5));
      setClosingTime(facilityToEdit.closing_time.substring(0, 5));
      setSlotDuration(facilityToEdit.slot_duration_minutes);
      setAdvanceDays(facilityToEdit.advance_booking_days);
      setRulesTerms(facilityToEdit.rules_terms || '');
    } else {
      setName('');
      setDescription('');
      setCategory('Sports');
      setLocation('');
      setCapacity(10);
      setStatus('Active');
      setBookingRequired(true);
      setApprovalRequired(false);
      setOpeningTime('06:00');
      setClosingTime('22:00');
      setSlotDuration(60);
      setAdvanceDays(7);
      setRulesTerms('');
    }
    setError(null);
  }, [facilityToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Facility name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateFacilityPayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        location: location.trim() || undefined,
        capacity: Number(capacity),
        booking_required: bookingRequired,
        approval_required: approvalRequired,
        opening_time: `${openingTime}:00`,
        closing_time: `${closingTime}:00`,
        slot_duration_minutes: Number(slotDuration),
        advance_booking_days: Number(advanceDays),
        rules_terms: rulesTerms.trim() || undefined,
      };

      if (facilityToEdit) {
        await updateAdminFacility(facilityToEdit.id, { ...payload, status });
      } else {
        await createAdminFacility(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving facility:', err);
      setError(err.message || 'Failed to save facility.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
              {facilityToEdit ? 'Edit Facility' : 'Create New Facility'}
            </h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Facility Name *
            </label>
            <input
              type="text"
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="e.g. Badminton Court 1 / Swimming Pool"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Category *
              </label>
              <select
                className="admin-search-input"
                style={{ width: '100%', padding: '0.55rem' }}
                value={category}
                onChange={(e) => setCategory(e.target.value as FacilityCategory)}
              >
                <option value="Sports">Sports</option>
                <option value="Community">Community</option>
                <option value="Fitness">Fitness</option>
                <option value="Recreation">Recreation</option>
                <option value="Kids">Kids</option>
                <option value="Event">Event</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Max Capacity (Persons) *
              </label>
              <input
                type="number"
                className="admin-search-input"
                style={{ width: '100%' }}
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Location Details
            </label>
            <input
              type="text"
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="e.g. Tower A Podium Level / Clubhouse 1st Floor"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Opening Time *
              </label>
              <input
                type="time"
                className="admin-search-input"
                style={{ width: '100%' }}
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Closing Time *
              </label>
              <input
                type="time"
                className="admin-search-input"
                style={{ width: '100%' }}
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Slot Duration (Minutes) *
              </label>
              <select
                className="admin-search-input"
                style={{ width: '100%', padding: '0.55rem' }}
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
              >
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
                <option value={90}>90 Minutes (1.5 Hours)</option>
                <option value={120}>120 Minutes (2 Hours)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Advance Booking Limit (Days) *
              </label>
              <input
                type="number"
                className="admin-search-input"
                style={{ width: '100%' }}
                min={1}
                max={30}
                value={advanceDays}
                onChange={(e) => setAdvanceDays(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Description
            </label>
            <textarea
              rows={2}
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="Short summary of the facility..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Rules & Terms of Use
            </label>
            <textarea
              rows={2}
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="e.g. Non-marking shoes required. No outside food."
              value={rulesTerms}
              onChange={(e) => setRulesTerms(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={approvalRequired}
                onChange={(e) => setApprovalRequired(e.target.checked)}
              />
              <span>Requires Admin Approval</span>
            </label>

            {facilityToEdit && (
              <div>
                <select
                  className="admin-search-input"
                  style={{ width: '100%', padding: '0.45rem' }}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as FacilityStatus)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Temporarily Closed">Temporarily Closed</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : facilityToEdit ? 'Update Facility' : 'Create Facility'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
