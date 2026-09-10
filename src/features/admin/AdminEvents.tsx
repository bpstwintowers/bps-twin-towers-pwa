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
  Edit,
  Search,
  X,
  Filter,
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
import { useSearch } from '../../context/SearchContext';
import './AdminPortal.css';

export const AdminEvents: React.FC = () => {
  const { searchQuery, setSearchPlaceholder } = useSearch();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

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
      const data = await fetchAdminEvents(statusFilter, categoryFilter, searchQuery);
      setEvents(data);
    } catch (err: any) {
      console.error('Error fetching admin events:', err);
      setError('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchPlaceholder('Search events by title, venue, organizer...');
  }, [setSearchPlaceholder]);

  useEffect(() => {
    loadEvents();
  }, [statusFilter, categoryFilter]);

  // Debounced search from header input
  useEffect(() => {
    const timer = setTimeout(() => {
      loadEvents();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Helper date parsing
  const formatEventDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return {
          month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
          day: parts[2],
          year: parts[0],
        };
      }
      const d = new Date(dateStr);
      return {
        month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        day: String(d.getDate()).padStart(2, '0'),
        year: String(d.getFullYear()),
      };
    } catch {
      return { month: 'EVT', day: '--', year: '2026' };
    }
  };

  const formatTime12h = (timeStr?: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hour = parseInt(parts[0], 10);
    const min = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${min} ${ampm}`;
  };

  const getCategoryBadgeClass = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('cultur')) return 'cultural';
    if (cat.includes('sport')) return 'sports';
    if (cat.includes('festiv')) return 'festival';
    if (cat.includes('meet')) return 'meeting';
    return 'general';
  };

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: events.length,
      draft: events.filter((e) => e.status === 'Draft').length,
      pending: events.filter((e) => e.status === 'Pending Approval').length,
      approved: events.filter((e) => e.status === 'Approved').length,
      published: events.filter((e) => e.status === 'Published').length,
      cancelled: events.filter((e) => e.status === 'Cancelled').length,
      festivals: events.filter((e) => e.category === 'Festival' || e.category === 'Cultural').length,
    };
  }, [events]);

  return (
    <div className="admin-subpage-layout">
      {/* Fixed Top Section: Events KPI Cards & Controls (Does Not Scroll) */}
      <div className="admin-subpage-top">
        {/* Luxury KPI Cards Grid */}
        <div className="admin-stats-grid">
          {/* Card 1: Published / Live */}
          <div
            className="stat-card emerald"
            onClick={() => setStatusFilter(statusFilter === 'Published' ? 'ALL' : 'Published')}
            style={{ cursor: 'pointer' }}
            title="Click to filter Published events"
          >
            <div className="stat-card-header">
              <div className="stat-icon-wrapper emerald">
                <CheckCircle size={20} />
              </div>
              <span className="stat-trend-pill emerald">
                <Sparkles size={11} /> Live
              </span>
            </div>
            <div className="stat-card-body">
              <span className="stat-number">{counts.published}</span>
              <span className="stat-label">Published / Live Events</span>
            </div>
          </div>

          {/* Card 2: Drafts & In Review */}
          <div
            className="stat-card amber"
            onClick={() => setStatusFilter(statusFilter === 'Pending Approval' ? 'ALL' : 'Pending Approval')}
            style={{ cursor: 'pointer' }}
            title="Click to filter Pending Approval events"
          >
            <div className="stat-card-header">
              <div className="stat-icon-wrapper amber">
                <Clock size={20} />
              </div>
              <span className="stat-trend-pill amber">
                <AlertTriangle size={11} /> Needs Action
              </span>
            </div>
            <div className="stat-card-body">
              <span className="stat-number">{counts.draft + counts.pending}</span>
              <span className="stat-label">Drafts & In Review</span>
            </div>
          </div>

          {/* Card 3: Festivals & Cultural */}
          <div
            className="stat-card purple"
            onClick={() => setCategoryFilter(categoryFilter === 'Festival' ? 'ALL' : 'Festival')}
            style={{ cursor: 'pointer' }}
            title="Click to filter Festival & Cultural events"
          >
            <div className="stat-card-header">
              <div className="stat-icon-wrapper purple">
                <Calendar size={20} />
              </div>
              <span className="stat-trend-pill purple">
                <Sparkles size={11} /> Celebrations
              </span>
            </div>
            <div className="stat-card-body">
              <span className="stat-number">{counts.festivals}</span>
              <span className="stat-label">Festivals & Celebrations</span>
            </div>
          </div>

          {/* Card 4: Total Society Events */}
          <div
            className="stat-card blue"
            onClick={() => {
              setStatusFilter('ALL');
              setCategoryFilter('ALL');
            }}
            style={{ cursor: 'pointer' }}
            title="Click to show All Society Events"
          >
            <div className="stat-card-header">
              <div className="stat-icon-wrapper blue">
                <Users size={20} />
              </div>
              <span className="stat-trend-pill blue">
                <Calendar size={11} /> All Events
              </span>
            </div>
            <div className="stat-card-body">
              <span className="stat-number">{counts.all}</span>
              <span className="stat-label">Total Society Events</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="admin-filter-bar">
          <div className="admin-status-filters">
            {(
              [
                { key: 'ALL', label: 'ALL', count: counts.all },
                { key: 'Draft', label: 'Draft', count: counts.draft },
                { key: 'Pending Approval', label: 'Pending Approval', count: counts.pending },
                { key: 'Approved', label: 'Approved', count: counts.approved },
                { key: 'Published', label: 'Published', count: counts.published },
                { key: 'Cancelled', label: 'Cancelled', count: counts.cancelled },
              ] as const
            ).map(({ key, label, count }) => (
              <button
                key={key}
                className={`btn-filter-pill ${statusFilter === key ? 'active' : ''}`}
                onClick={() => setStatusFilter(key)}
              >
                <span>{label}</span>
                <span
                  className={`filter-count-badge ${
                    key === 'Pending Approval' || key === 'Draft'
                      ? 'amber'
                      : key === 'Published' || key === 'Approved'
                      ? 'green'
                      : key === 'Cancelled'
                      ? 'red'
                      : 'gray'
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}

            {/* Category Dropdown Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="btn-filter-pill"
              style={{
                outline: 'none',
                cursor: 'pointer',
                background: categoryFilter !== 'ALL' ? '#0f172a' : '#ffffff',
                color: categoryFilter !== 'ALL' ? '#ffffff' : '#475569',
                borderColor: categoryFilter !== 'ALL' ? '#0f172a' : '#e2e8f0',
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="Festival">Festival</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Community">Community</option>
              <option value="Meeting">Meeting</option>
              <option value="Workshop">Workshop</option>
            </select>
          </div>

          <button
            className="btn-action-approve"
            onClick={() => {
              setEditingEvent(null);
              setIsFormModalOpen(true);
            }}
            style={{
              padding: '0.6rem 1.2rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.88rem',
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #00897b, #0f172a)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(0, 137, 123, 0.3)',
            }}
          >
            <PlusCircle size={17} />
            Create Event
          </button>
        </div>
      </div>

      {/* Scrollable Events Content (Only this scrolls!) */}
      <div className="admin-subpage-scrollable">
        {success && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              color: '#047857',
              marginBottom: '1rem',
              fontSize: '0.86rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{success}</span>
            <button
              onClick={() => setSuccess(null)}
              style={{ background: 'none', border: 'none', color: '#047857', cursor: 'pointer' }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              color: '#b91c1c',
              marginBottom: '1rem',
              fontSize: '0.86rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer' }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Events Table / Cards List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="table-loading-spinner" style={{ marginBottom: '0.75rem' }} />
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>Loading events schedule...</p>
          </div>
        ) : events.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3.5rem 1.5rem',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px dashed #cbd5e1',
            }}
          >
            <Calendar size={42} style={{ color: '#94a3b8', marginBottom: '0.75rem' }} />
            <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', color: '#0f172a' }}>No events found</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem' }}>
              {statusFilter !== 'ALL' || categoryFilter !== 'ALL' || searchQuery
                ? 'Try adjusting your filters or search query.'
                : 'Click "Create Event" to schedule an upcoming festival, sports tournament, or cultural celebration.'}
            </p>
            <button
              className="btn-event-pill primary"
              onClick={() => {
                setEditingEvent(null);
                setIsFormModalOpen(true);
              }}
            >
              <PlusCircle size={15} />
              Create First Event
            </button>
          </div>
        ) : (
          <div className="admin-events-list">
            {events.map((event) => {
              const dateInfo = formatEventDate(event.start_date);
              const hasCapacity = event.capacity > 0;
              const confirmedCount = event.confirmed_count || 0;
              const fillPercent = hasCapacity ? Math.min(100, Math.round((confirmedCount / event.capacity) * 100)) : 0;

              return (
                <div key={event.id} className="admin-event-card">
                  {/* Left Calendar Date Box */}
                  <div className="admin-event-date-box">
                    <span className="admin-event-date-month">{dateInfo.month}</span>
                    <span className="admin-event-date-day">{dateInfo.day}</span>
                    <span className="admin-event-date-year">{dateInfo.year}</span>
                  </div>

                  {/* Main Event Content */}
                  <div className="admin-event-content">
                    {/* Top Row: Category, Title, Status */}
                    <div className="admin-event-top-row">
                      <div className="admin-event-title-group">
                        <span className={`admin-event-category-badge ${getCategoryBadgeClass(event.category)}`}>
                          {event.category}
                        </span>
                        <h3 className="admin-event-title">{event.title}</h3>
                      </div>

                      <StatusBadge status={event.status} />
                    </div>

                    {/* Metadata Grid */}
                    <div className="admin-event-meta-grid">
                      <div className="admin-event-meta-item">
                        <Clock size={14} color="#64748b" />
                        <span>
                          <strong>Schedule:</strong> {formatTime12h(event.start_time)} - {formatTime12h(event.end_time)}
                        </span>
                      </div>

                      <div className="admin-event-meta-item">
                        <MapPin size={14} color="#64748b" />
                        <span>
                          <strong>Venue:</strong> {event.venue}
                        </span>
                      </div>

                      {event.organizer && (
                        <div className="admin-event-meta-item">
                          <Users size={14} color="#64748b" />
                          <span>
                            <strong>Organizer:</strong> {event.organizer}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Capacity & Progress Track */}
                    <div className="admin-event-capacity-bar-wrapper">
                      {hasCapacity && (
                        <div className="admin-event-capacity-track">
                          <div className="admin-event-capacity-fill" style={{ width: `${fillPercent}%` }} />
                        </div>
                      )}
                      <span className="admin-event-capacity-label">
                        <strong>Registered:</strong> {confirmedCount} {hasCapacity ? `/ ${event.capacity} seats (${fillPercent}%)` : 'participants (Open Capacity)'}
                      </span>
                    </div>

                    {/* Cancellation Alert */}
                    {event.cancellation_reason && (
                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: '#b91c1c',
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <AlertTriangle size={15} />
                        <span>
                          <strong>Cancellation Reason:</strong> {event.cancellation_reason}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons Toolbar */}
                    <div className="admin-event-actions-bar">
                      <button
                        className="btn-event-pill outline"
                        onClick={() => setParticipantEvent(event)}
                        title="View registered residents"
                      >
                        <Users size={14} />
                        <span>Participants ({confirmedCount})</span>
                      </button>

                      <button
                        className="btn-event-pill outline"
                        onClick={() => {
                          setEditingEvent(event);
                          setIsFormModalOpen(true);
                        }}
                        title="Edit event details"
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>

                      {(event.status === 'Draft' || event.status === 'Pending Approval') && (
                        <button
                          className="btn-event-pill success"
                          onClick={() => handleApprove(event.id)}
                          disabled={actionLoading}
                        >
                          <CheckCircle size={14} />
                          <span>Approve</span>
                        </button>
                      )}

                      {event.status === 'Approved' && (
                        <button
                          className="btn-event-pill primary"
                          onClick={() => handlePublish(event.id)}
                          disabled={actionLoading}
                        >
                          <Send size={14} />
                          <span>Publish to Residents</span>
                        </button>
                      )}

                      {event.status !== 'Cancelled' && (
                        <button
                          className="btn-event-pill danger"
                          onClick={() => setCancellingEvent(event)}
                          disabled={actionLoading}
                        >
                          <XCircle size={14} />
                          <span>Cancel Event</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} /> Cancel Event
              </h3>
              <button onClick={() => setCancellingEvent(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.88rem', color: '#334155', marginBottom: '1rem', lineHeight: 1.5 }}>
                Are you sure you want to cancel <strong>"{cancellingEvent.title}"</strong>? All registered participants will be notified immediately.
              </p>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                Cancellation Reason *
              </label>
              <textarea
                rows={3}
                className="admin-search-input"
                style={{ width: '100%', borderRadius: '8px', padding: '0.65rem' }}
                placeholder="Specify reason (e.g., weather conditions, hall maintenance, rescheduled)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
              />
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={() => setCancellingEvent(null)} disabled={actionLoading}>
                Go Back
              </button>
              <button
                className="btn-reject"
                onClick={handleConfirmCancel}
                disabled={actionLoading || !cancelReason.trim()}
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
