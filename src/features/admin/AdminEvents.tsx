import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  PlusCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
  Send,
  Eye,
  Edit,
  Trash2,
  X,
} from 'lucide-react';
import {
  fetchAdminEvents,
  approveAdminEvent,
  publishAdminEvent,
  cancelAdminEvent,
  type EventItem,
} from '../../services/supabase/eventService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EventFormModal } from './EventFormModal';
import { EventParticipantsModal } from './EventParticipantsModal';

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [participantEvent, setParticipantEvent] = useState<EventItem | null>(null);

  // Cancel Modal
  const [cancellingEvent, setCancellingEvent] = useState<EventItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminEvents(statusFilter, categoryFilter, search);
      setEvents(data);
    } catch (err: any) {
      console.error('Error fetching admin events:', err);
      setError('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [statusFilter, categoryFilter]);

  const handleApprove = async (eventId: string) => {
    try {
      setActionLoading(true);
      setError(null);
      await approveAdminEvent(eventId);
      setSuccess('Event approved successfully.');
      await loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to approve event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async (eventId: string) => {
    try {
      setActionLoading(true);
      setError(null);
      await publishAdminEvent(eventId);
      setSuccess('Event published! Residents can now view and register.');
      await loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to publish event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingEvent) return;
    try {
      setActionLoading(true);
      setError(null);
      await cancelAdminEvent(cancellingEvent.id, cancelReason);
      setSuccess('Event has been cancelled and participants notified.');
      setCancellingEvent(null);
      setCancelReason('');
      await loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel event.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Top Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['ALL', 'Draft', 'Pending Approval', 'Approved', 'Published', 'Cancelled'] as const).map((s) => (
            <button
              key={s}
              className="btn-outline"
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.8rem',
                background: statusFilter === s ? 'rgba(59, 130, 246, 0.2)' : undefined,
                borderColor: statusFilter === s ? 'var(--accent-primary)' : undefined,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            setEditingEvent(null);
            setIsFormModalOpen(true);
          }}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', gap: '0.4rem' }}
        >
          <PlusCircle size={16} />
          Create Event
        </button>
      </div>

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

      {/* Events Table / Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
          }}
        >
          <Calendar size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', opacity: 0.5 }} />
          <h4 style={{ margin: '0 0 0.25rem' }}>No events found</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Click "Create Event" to schedule an upcoming festival, sports, or cultural program.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {events.map((event) => (
            <div key={event.id} className="admin-request-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: 'var(--accent-primary)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                      }}
                    >
                      {event.category}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                      {event.title}
                    </h3>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Organizer: <strong>{event.organizer || 'Society Committee'}</strong> · Venue: <strong>{event.venue}</strong>
                  </div>
                </div>

                <StatusBadge status={event.status} />
              </div>

              <div className="admin-request-body">
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Schedule:</span>{' '}
                  <strong>
                    {new Date(event.start_date).toLocaleDateString()} ({event.start_time} - {event.end_time})
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Capacity:</span>{' '}
                  <strong>{event.capacity > 0 ? `${event.capacity} seats` : 'Open'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Registered:</span>{' '}
                  <strong>{event.confirmed_count || 0} participants</strong>
                </div>
              </div>

              {event.cancellation_reason && (
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#f87171',
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '0.75rem',
                  }}
                >
                  <strong>Cancellation Reason:</strong> {event.cancellation_reason}
                </div>
              )}

              {/* Action Buttons */}
              <div className="admin-request-actions">
                <button
                  className="btn-outline"
                  onClick={() => setParticipantEvent(event)}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem', gap: '0.35rem' }}
                >
                  <Users size={14} />
                  Participants ({event.confirmed_count || 0})
                </button>

                <button
                  className="btn-outline"
                  onClick={() => {
                    setEditingEvent(event);
                    setIsFormModalOpen(true);
                  }}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem', gap: '0.35rem' }}
                >
                  <Edit size={14} />
                  Edit
                </button>

                {(event.status === 'Draft' || event.status === 'Pending Approval') && (
                  <button
                    className="btn-approve"
                    onClick={() => handleApprove(event.id)}
                    disabled={actionLoading}
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                  >
                    <CheckCircle size={14} />
                    Approve
                  </button>
                )}

                {event.status === 'Approved' && (
                  <button
                    className="btn-primary"
                    onClick={() => handlePublish(event.id)}
                    disabled={actionLoading}
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem', gap: '0.35rem' }}
                  >
                    <Send size={14} />
                    Publish to Residents
                  </button>
                )}

                {event.status !== 'Cancelled' && (
                  <button
                    className="btn-reject"
                    onClick={() => setCancellingEvent(event)}
                    disabled={actionLoading}
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                  >
                    <XCircle size={14} />
                    Cancel Event
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL */}
      <EventFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={loadEvents}
        eventToEdit={editingEvent}
      />

      {/* PARTICIPANTS MODAL */}
      <EventParticipantsModal
        isOpen={Boolean(participantEvent)}
        onClose={() => setParticipantEvent(null)}
        event={participantEvent}
      />

      {/* CANCEL MODAL */}
      {cancellingEvent && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Cancel Event</h3>
              <button onClick={() => setCancellingEvent(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Are you sure you want to cancel <strong>"{cancellingEvent.title}"</strong>? All registered participants will receive an automated cancellation notice.
              </p>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Cancellation Reason *
              </label>
              <textarea
                rows={3}
                className="admin-search-input"
                style={{ width: '100%' }}
                placeholder="Reason for cancellation (e.g. inclement weather, schedule conflict)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
              />
            </div>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setCancellingEvent(null)} disabled={actionLoading}>
                Back
              </button>
              <button className="btn-reject" onClick={handleConfirmCancel} disabled={actionLoading || !cancelReason.trim()}>
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
