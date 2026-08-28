import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Sparkles,
  ArrowLeft,
  Users,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Flame,
} from 'lucide-react';
import {
  fetchPublishedEvents,
  type EventItem,
  type EventCategory,
} from '../../services/supabase/eventService';
import { resolveUserAccess, type AccessInfo } from '../../services/supabase/registrationService';
import { PoojaBookingModal } from './PoojaBookingModal';
import './EventList.css';

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'All Events', value: 'ALL' },
  { label: 'Festivals', value: 'Festival' },
  { label: 'Cultural', value: 'Cultural' },
  { label: 'Sports', value: 'Sports' },
  { label: 'Kids & Teens', value: 'Kids' },
  { label: 'Religious', value: 'Religious' },
  { label: 'Workshops', value: 'Workshop' },
  { label: 'Society Meetings', value: 'Meeting' },
];

export const EventList: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAccess, setActiveAccess] = useState<AccessInfo[]>([]);

  // Puja modal
  const [isPoojaModalOpen, setIsPoojaModalOpen] = useState(false);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const [eventsData, accessData] = await Promise.all([
        fetchPublishedEvents(selectedCategory, searchQuery),
        resolveUserAccess().catch(() => []),
      ]);
      setEvents(eventsData);
      setActiveAccess(accessData);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadEvents();
  };

  const primaryFlat = activeAccess[0];

  return (
    <div className="events-container">
      {/* Main Content */}
      <div className="events-content">
        {/* Top Actions Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="category-pills" style={{ marginBottom: 0 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className={`category-pill ${selectedCategory === cat.value ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            className="btn-primary"
            onClick={() => setIsPoojaModalOpen(true)}
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.82rem',
              gap: '0.35rem',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            }}
          >
            <Sparkles size={14} />
            Book Puja Slot
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="events-filter-row">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="events-search-input"
              placeholder="Search events by title or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-outline" style={{ padding: '0.6rem 1rem', fontSize: '0.88rem' }}>
            Search
          </button>
        </form>

        {/* Events Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
            Loading community events...
          </div>
        ) : events.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Calendar size={42} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.4rem' }}>No Events Scheduled</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
              There are currently no published events in this category. Check back soon or explore other categories.
            </p>
          </div>
        ) : (
          <div className="events-grid animate-fade-in">
            {events.map((event) => {
              const confirmed = event.confirmed_count || 0;
              const hasCapacity = event.capacity > 0;
              const spotsLeft = hasCapacity ? Math.max(0, event.capacity - confirmed) : null;
              const isFull = hasCapacity && spotsLeft === 0;

              return (
                <div
                  key={event.id}
                  className="event-card"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div className="event-card-banner">
                    {event.banner_url ? (
                      <img src={event.banner_url} alt={event.title} />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background:
                            event.category === 'Festival'
                              ? 'linear-gradient(135deg, #b45309, #78350f)'
                              : event.category === 'Cultural'
                              ? 'linear-gradient(135deg, #7c3aed, #4c1d95)'
                              : event.category === 'Sports'
                              ? 'linear-gradient(135deg, #047857, #064e3b)'
                              : 'linear-gradient(135deg, #1e293b, #0f172a)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        <Sparkles size={32} />
                      </div>
                    )}
                    <span className="event-category-badge">{event.category}</span>
                    {event.is_registered && (
                      <span className="event-registered-badge">Registered ✓</span>
                    )}
                  </div>

                  <div className="event-card-body">
                    <h3 className="event-card-title">{event.title}</h3>

                    <div className="event-meta-row">
                      <Calendar size={14} style={{ color: 'var(--accent-primary)' }} />
                      <span>
                        {new Date(event.start_date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <div className="event-meta-row">
                      <Clock size={14} style={{ color: 'var(--accent-primary)' }} />
                      <span>
                        {event.start_time} - {event.end_time}
                      </span>
                    </div>

                    <div className="event-meta-row">
                      <MapPin size={14} style={{ color: 'var(--accent-primary)' }} />
                      <span>{event.venue}</span>
                    </div>

                    <div className="event-card-footer">
                      <div className="event-capacity-info">
                        {hasCapacity ? (
                          isFull ? (
                            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Housefull</span>
                          ) : (
                            <span>{spotsLeft} spots left</span>
                          )
                        ) : (
                          <span>Open Entry</span>
                        )}
                      </div>

                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: event.is_registered ? 'var(--success)' : 'var(--accent-primary)',
                        }}
                      >
                        {event.is_registered ? 'View Pass →' : 'View Details →'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* POOJA MODAL */}
      <PoojaBookingModal
        isOpen={isPoojaModalOpen}
        onClose={() => setIsPoojaModalOpen(false)}
        flatId={primaryFlat?.flat_id}
        flatNumber={primaryFlat?.flat_number}
      />
    </div>
  );
};
