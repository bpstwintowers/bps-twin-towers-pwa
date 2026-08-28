import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Sparkles, Clock, AlertCircle } from 'lucide-react';
import {
  createAdminEvent,
  updateAdminEvent,
  type EventItem,
  type EventCategory,
  type CreateEventPayload,
} from '../../services/supabase/eventService';

const CATEGORIES: EventCategory[] = [
  'Festival',
  'Cultural',
  'Sports',
  'Community',
  'Kids',
  'Religious',
  'Workshop',
  'Meeting',
  'Other',
];

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventToEdit?: EventItem | null;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  eventToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Festival');
  const [organizer, setOrganizer] = useState('');
  const [venue, setVenue] = useState('Community Clubhouse & Podium');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('21:00');
  const [capacity, setCapacity] = useState<number>(0);
  const [registrationRequired, setRegistrationRequired] = useState(true);
  const [bannerUrl, setBannerUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      setCategory(eventToEdit.category);
      setOrganizer(eventToEdit.organizer || '');
      setVenue(eventToEdit.venue);
      setStartDate(eventToEdit.start_date);
      setStartTime(eventToEdit.start_time);
      setEndDate(eventToEdit.end_date);
      setEndTime(eventToEdit.end_time);
      setCapacity(eventToEdit.capacity);
      setRegistrationRequired(eventToEdit.registration_required);
      setBannerUrl(eventToEdit.banner_url || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setCategory('Festival');
      setOrganizer('BPS Cultural Committee');
      setVenue('Community Clubhouse & Podium');
      setStartDate(today);
      setStartTime('18:00');
      setEndDate(today);
      setEndTime('21:00');
      setCapacity(100);
      setRegistrationRequired(true);
      setBannerUrl('');
    }
    setError(null);
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !venue.trim() || !startDate || !endDate) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateEventPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category,
        organizer: organizer.trim() || undefined,
        venue: venue.trim(),
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        banner_url: bannerUrl.trim() || undefined,
        capacity: Number(capacity) || 0,
        registration_required: registrationRequired,
      };

      if (eventToEdit) {
        await updateAdminEvent(eventToEdit.id, payload);
      } else {
        await createAdminEvent(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving event:', err);
      setError(err.message || 'Failed to save event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
            {eventToEdit ? 'Edit Event' : 'Create New Event'}
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
              Event Title *
            </label>
            <input
              type="text"
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="e.g. Ganesh Utsav Grand Mahaprasad"
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
                onChange={(e) => setCategory(e.target.value as EventCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Organizer / Team
              </label>
              <input
                type="text"
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="e.g. Cultural Committee"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Venue / Location *
            </label>
            <input
              type="text"
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="e.g. Clubhouse Amphitheatre / Podium"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Start Date *
              </label>
              <input
                type="date"
                className="admin-search-input"
                style={{ width: '100%' }}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!endDate) setEndDate(e.target.value);
                }}
                required
              />
            </div>

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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                End Date *
              </label>
              <input
                type="date"
                className="admin-search-input"
                style={{ width: '100%' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                Capacity (0 = Unlimited)
              </label>
              <input
                type="number"
                min={0}
                className="admin-search-input"
                style={{ width: '100%' }}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '1.2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={registrationRequired}
                  onChange={(e) => setRegistrationRequired(e.target.checked)}
                />
                Registration Required
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              Description / Instructions
            </label>
            <textarea
              rows={3}
              className="admin-search-input"
              style={{ width: '100%' }}
              placeholder="Event highlights, program flow, dress code, etc."
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
            >
              {submitting ? 'Saving...' : eventToEdit ? 'Update Event' : 'Create Event (Draft)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
