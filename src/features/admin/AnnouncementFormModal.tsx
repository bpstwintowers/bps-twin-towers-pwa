import React, { useState, useEffect } from 'react';
import { X, Megaphone, Users, Eye } from 'lucide-react';
import {
  createAdminAnnouncement,
  updateAdminAnnouncement,
  estimateAudienceCount,
  type AnnouncementItem,
  type AnnouncementCategory,
  type AnnouncementPriority,
  type TargetAudience,
  type CreateAnnouncementPayload,
} from '../../services/supabase/communicationService';

interface AnnouncementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  announcementToEdit?: AnnouncementItem | null;
}

export const AnnouncementFormModal: React.FC<AnnouncementFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  announcementToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('General');
  const [priority, setPriority] = useState<AnnouncementPriority>('Normal');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('ALL');
  const [actionUrl, setActionUrl] = useState('');
  const [estimatedRecipients, setEstimatedRecipients] = useState<number>(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (announcementToEdit) {
      setTitle(announcementToEdit.title);
      setMessage(announcementToEdit.message);
      setCategory(announcementToEdit.category);
      setPriority(announcementToEdit.priority);
      setTargetAudience(announcementToEdit.target_audience);
      setActionUrl(announcementToEdit.action_url || '');
    } else {
      setTitle('');
      setMessage('');
      setCategory('General');
      setPriority('Normal');
      setTargetAudience('ALL');
      setActionUrl('');
    }
    setError(null);
  }, [announcementToEdit, isOpen]);

  useEffect(() => {
    if (isOpen) {
      estimateAudienceCount(targetAudience)
        .then((count) => setEstimatedRecipients(count))
        .catch(() => setEstimatedRecipients(0));
    }
  }, [targetAudience, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Please provide announcement title and body message.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateAnnouncementPayload = {
        title: title.trim(),
        message: message.trim(),
        category,
        priority,
        target_audience: targetAudience,
        action_url: actionUrl.trim() || undefined,
      };

      if (announcementToEdit) {
        await updateAdminAnnouncement(announcementToEdit.id, payload);
      } else {
        await createAdminAnnouncement(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving announcement:', err);
      setError(err.message || 'Failed to save announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Megaphone size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
              {announcementToEdit ? 'Edit Announcement' : 'Create Community Announcement'}
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
              Title / Subject *
            </label>
            <input
              type="text"
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="e.g. Overhead Tank Cleaning Schedule — Block A"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
                onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
              >
                <option value="General">General</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Festival">Festival</option>
                <option value="Emergency">Emergency</option>
                <option value="Security">Security</option>
                <option value="Meeting">Meeting</option>
                <option value="Notice">Notice</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Priority Level *
              </label>
              <select
                className="admin-search-input"
                style={{ width: '100%', padding: '0.55rem' }}
                value={priority}
                onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
              >
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent (Emergency Banner)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Target Audience *
            </label>
            <select
              className="admin-search-input"
              style={{ width: '100%', padding: '0.55rem' }}
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as TargetAudience)}
            >
              <option value="ALL">All Society Residents</option>
              <option value="BLOCK_A">Block A Residents Only</option>
              <option value="BLOCK_B">Block B Residents Only</option>
              <option value="OWNERS">Property Owners</option>
              <option value="TENANTS">Tenants</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <Users size={14} style={{ color: 'var(--accent-primary)' }} />
              <span>
                Estimated Audience: <strong>{estimatedRecipients} registered profiles</strong>
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Detailed Message / Notice Body *
            </label>
            <textarea
              rows={4}
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="Full details, timings, instructions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Action Destination (Optional Route)
            </label>
            <input
              type="text"
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="e.g. /events or /donations"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : announcementToEdit ? 'Update Draft' : 'Save Announcement Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
