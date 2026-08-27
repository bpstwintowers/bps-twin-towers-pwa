import React, { useState, useEffect } from 'react';
import { X, HandHelping, CheckCircle2, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import {
  signupVolunteer,
  type VolunteerOpportunityItem,
} from '../../services/supabase/volunteerService';

interface VolunteerSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: VolunteerOpportunityItem | null;
  flatId?: string;
  onSuccess: () => void;
}

export const VolunteerSignupModal: React.FC<VolunteerSignupModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  flatId,
  onSuccess,
}) => {
  const [volunteerName, setVolunteerName] = useState('');
  const [volunteerMobile, setVolunteerMobile] = useState('');
  const [volunteerEmail, setVolunteerEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setConfirmed(false);
      setNotes('');

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
            .then(({ data: p }) => {
              if (p) {
                setVolunteerName(p.full_name || '');
                setVolunteerEmail(p.email || '');
                setVolunteerMobile(p.mobile || '');
              }
            });
        }
      });
    }
  }, [isOpen, opportunity]);

  if (!isOpen || !opportunity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerName.trim()) {
      setError('Volunteer name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await signupVolunteer({
        opportunity_id: opportunity.id,
        flat_id: flatId,
        volunteer_name: volunteerName.trim(),
        volunteer_mobile: volunteerMobile.trim() || undefined,
        volunteer_email: volunteerEmail.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setConfirmed(true);
      onSuccess();
    } catch (err: any) {
      console.error('Error registering volunteer:', err);
      setError(err.message || 'Failed to sign up for this volunteer opportunity.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HandHelping size={22} style={{ color: '#a78bfa' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Volunteer Registration</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {opportunity.team?.name || 'Community Team'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {confirmed ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.4rem' }}>
              Volunteer Shift Confirmed!
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Thank you for stepping up to help the community. You have been assigned as{' '}
              <strong>{opportunity.role_name}</strong>.
            </p>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'left',
                fontSize: '0.88rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Activity:</span>{' '}
                <strong>{opportunity.title}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Role:</span>{' '}
                <strong>{opportunity.role_name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>{' '}
                <strong>
                  {new Date(opportunity.start_date).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  · {opportunity.start_time} - {opportunity.end_time}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Venue:</span>{' '}
                <strong>{opportunity.venue}</strong>
              </div>
            </div>

            <button className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
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

            {/* Shift Briefing Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.35rem' }}>
                {opportunity.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span>
                    {new Date(opportunity.start_date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span>{opportunity.start_time} to {opportunity.end_time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span>{opportunity.venue}</span>
                </div>
              </div>
            </div>

            {/* Volunteer Name */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Volunteer Name *
              </label>
              <input
                type="text"
                className="admin-search-input"
                style={{ width: '100%' }}
                value={volunteerName}
                onChange={(e) => setVolunteerName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Contact Mobile
                </label>
                <input
                  type="tel"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  value={volunteerMobile}
                  onChange={(e) => setVolunteerMobile(e.target.value)}
                  maxLength={10}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  value={volunteerEmail}
                  onChange={(e) => setVolunteerEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Note / Prior Experience (Optional)
              </label>
              <input
                type="text"
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="e.g. Can also assist with audio equipment setup"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
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
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
              >
                {submitting ? 'Registering...' : 'Confirm Volunteer Shift →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
