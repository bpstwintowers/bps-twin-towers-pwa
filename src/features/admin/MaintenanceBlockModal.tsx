import React, { useState } from 'react';
import { X, Wrench } from 'lucide-react';
import {
  createFacilityBlock,
  type FacilityItem,
  type CreateBlockPayload,
} from '../../services/supabase/facilityService';

interface MaintenanceBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  facilities: FacilityItem[];
}

export const MaintenanceBlockModal: React.FC<MaintenanceBlockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  facilities,
}) => {
  const [selectedFacilityId, setSelectedFacilityId] = useState(facilities[0]?.id || '');
  const [blockDate, setBlockDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:00');
  const [reason, setReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilityId || !reason.trim()) {
      setError('Please select a facility and state the maintenance reason.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateBlockPayload = {
        facility_id: selectedFacilityId,
        block_date: blockDate,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        reason: reason.trim(),
      };

      await createFacilityBlock(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating maintenance block:', err);
      setError(err.message || 'Failed to create maintenance block.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={20} style={{ color: '#f59e0b' }} />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Schedule Maintenance Block</h3>
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
              Select Facility *
            </label>
            <select
              className="admin-search-input"
              style={{ width: '100%', padding: '0.55rem' }}
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              required
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.category})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Block Date *
            </label>
            <input
              type="date"
              className="admin-search-input"
              style={{ width: '100%' }}
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Start Time *
              </label>
              <input
                type="time"
                className="admin-search-input"
                style={{ width: '100%' }}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                End Time *
              </label>
              <input
                type="time"
                className="admin-search-input"
                style={{ width: '100%' }}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Maintenance Reason *
            </label>
            <input
              type="text"
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="e.g. Deep chemical treatment / Light replacement"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Block Facility'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
