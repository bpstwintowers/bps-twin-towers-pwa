import React, { useState, useEffect } from 'react';
import { X, Wrench, CheckCircle2 } from 'lucide-react';
import {
  updateAdminComplaintStatus,
  addComplaintComment,
  type ComplaintItem,
  type ComplaintStatus,
} from '../../services/supabase/complaintService';

interface ComplaintAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  complaint: ComplaintItem | null;
}

export const ComplaintAssignModal: React.FC<ComplaintAssignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  complaint,
}) => {
  const [status, setStatus] = useState<ComplaintStatus>('In Progress');
  const [assignedTeam, setAssignedTeam] = useState('Maintenance Team');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (complaint) {
      setStatus(complaint.status);
      setAssignedTeam(complaint.assigned_team || 'Maintenance Team');
      setResolutionSummary(complaint.resolution_summary || '');
      setInternalNote('');
    }
    setError(null);
  }, [complaint, isOpen]);

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'Resolved' && !resolutionSummary.trim()) {
      setError('Please provide a resolution summary describing what was fixed.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await updateAdminComplaintStatus(
        complaint.id,
        status,
        assignedTeam,
        undefined,
        resolutionSummary.trim() || undefined
      );

      // Post internal staff note if provided
      if (internalNote.trim()) {
        await addComplaintComment(complaint.id, internalNote.trim(), true);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating complaint:', err);
      setError(err.message || 'Failed to update complaint.');
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
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
              Manage Ticket {complaint.complaint_number}
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
              Update Status *
            </label>
            <select
              className="admin-search-input"
              style={{ width: '100%', padding: '0.55rem' }}
              value={status}
              onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
            >
              <option value="Open">Open</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting for Resident">Waiting for Resident</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Assigned Team / Department *
            </label>
            <select
              className="admin-search-input"
              style={{ width: '100%', padding: '0.55rem' }}
              value={assignedTeam}
              onChange={(e) => setAssignedTeam(e.target.value)}
            >
              <option value="Maintenance Team">Maintenance Team</option>
              <option value="Plumbing Team">Plumbing Team</option>
              <option value="Electrical Team">Electrical Team</option>
              <option value="Lift & Elevator Team">Lift & Elevator Team</option>
              <option value="Housekeeping Team">Housekeeping Team</option>
              <option value="Security Team">Security Team</option>
              <option value="Facility Team">Facility Team</option>
            </select>
          </div>

          {status === 'Resolved' && (
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Resolution Summary *
              </label>
              <textarea
                rows={3}
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="Explain the work done and fix applied..."
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                required
              />
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Internal Staff Note (Hidden from Resident)
            </label>
            <textarea
              rows={2}
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="Vendor coordination, spare parts, or internal notes..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Save & Update Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
