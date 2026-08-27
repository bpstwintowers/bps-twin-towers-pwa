import React, { useState, useEffect } from 'react';
import { X, HandHelping, Calendar, Clock, MapPin, Users } from 'lucide-react';
import {
  createAdminOpportunity,
  updateAdminOpportunity,
  type VolunteerOpportunityItem,
  type VolunteerTeamItem,
  type CreateOpportunityPayload,
} from '../../services/supabase/volunteerService';
import { fetchAdminEvents, type EventItem } from '../../services/supabase/eventService';

const ROLES = [
  'Volunteer',
  'Team Lead',
  'Coordinator',
  'Registration Desk',
  'Decoration',
  'Food Distribution & Prasadam',
  'Puja Assistant',
  'Crowd Management & Security',
  'Kids Activities Support',
  'Technical & Audio Support',
  'Photography & Media',
  'First Aid & Medical',
  'Cleanup & Eco Support',
];

interface OpportunityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teams: VolunteerTeamItem[];
  opportunityToEdit?: VolunteerOpportunityItem | null;
}

export const OpportunityFormModal: React.FC<OpportunityFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  teams,
  opportunityToEdit,
}) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [teamId, setTeamId] = useState('');
  const [eventId, setEventId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roleName, setRoleName] = useState('Volunteer');
  const [requiredVolunteers, setRequiredVolunteers] = useState<number>(5);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('17:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('21:00');
  const [venue, setVenue] = useState('Clubhouse Hall');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAdminEvents().then((evs) => setEvents(evs)).catch(() => []);

      if (opportunityToEdit) {
        setTeamId(opportunityToEdit.team_id);
        setEventId(opportunityToEdit.event_id || '');
        setTitle(opportunityToEdit.title);
        setDescription(opportunityToEdit.description || '');
        setRoleName(opportunityToEdit.role_name);
        setRequiredVolunteers(opportunityToEdit.required_volunteers);
        setStartDate(opportunityToEdit.start_date);
        setStartTime(opportunityToEdit.start_time);
        setEndDate(opportunityToEdit.end_date);
        setEndTime(opportunityToEdit.end_time);
        setVenue(opportunityToEdit.venue);
      } else {
        const today = new Date().toISOString().split('T')[0];
        setTeamId(teams[0]?.id || '');
        setEventId('');
        setTitle('');
        setDescription('');
        setRoleName('Volunteer');
        setRequiredVolunteers(5);
        setStartDate(today);
        setStartTime('17:00');
        setEndDate(today);
        setEndTime('21:00');
        setVenue('Clubhouse Hall');
      }
      setError(null);
    }
  }, [opportunityToEdit, isOpen, teams]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !teamId || !startDate || !venue.trim() || requiredVolunteers <= 0) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateOpportunityPayload = {
        team_id: teamId,
        event_id: eventId || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        role_name: roleName.trim(),
        required_volunteers: Number(requiredVolunteers),
        start_date: startDate,
        start_time: startTime,
        end_date: endDate || startDate,
        end_time: endTime,
        venue: venue.trim(),
      };

      if (opportunityToEdit) {
        await updateAdminOpportunity(opportunityToEdit.id, payload);
      } else {
        await createAdminOpportunity(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving volunteer opportunity:', err);
      setError(err.message || 'Failed to save opportunity.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
            {opportunityToEdit ? 'Edit Volunteer Opportunity' : 'Create Volunteer Opportunity'}
          </h3>
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
              Opportunity Title / Shift Name *
            </label>
            <input
              type="text"
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="e.g. Mahaprasad Evening Food Counter Shift"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Volunteer Team *
              </label>
              <select
                className="admin-search-input"
                style={{ width: '100%', padding: '0.55rem' }}
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Associated Event (Optional)
              </label>
              <select
                className="admin-search-input"
                style={{ width: '100%', padding: '0.55rem' }}
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              >
                <option value="">-- No specific event --</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Volunteer Role *
              </label>
              <select
                className="admin-search-input"
                style={{ width: '100%', padding: '0.55rem' }}
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Volunteers Required *
              </label>
              <input
                type="number"
                min={1}
                max={100}
                className="admin-search-input"
                style={{ width: '100%' }}
                value={requiredVolunteers}
                onChange={(e) => setRequiredVolunteers(parseInt(e.target.value) || 1)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Date *
              </label>
              <input
                type="date"
                className="admin-search-input"
                style={{ width: '100%' }}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setEndDate(e.target.value);
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Venue / Location *
              </label>
              <input
                type="text"
                className="admin-search-input"
                style={{ width: '100%' }}
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
              />
            </div>
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
              Description & Volunteer Instructions
            </label>
            <textarea
              rows={3}
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="Provide briefing notes, reporting points, or attire suggestions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              {submitting ? 'Saving...' : opportunityToEdit ? 'Update Opportunity' : 'Publish Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
