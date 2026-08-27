import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  UserCheck,
  Shield,
} from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import {
  fetchEventDetails,
  registerForEvent,
  cancelEventRegistration,
  type EventItem,
} from '../../services/supabase/eventService';
import { resolveUserAccess, type AccessInfo } from '../../services/supabase/registrationService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import './EventDetails.css';

interface FlatMember {
  id: string;
  full_name: string | null;
  relationship: string;
  resident_type: string | null;
  mobile: string | null;
  email: string | null;
}

export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAccess, setActiveAccess] = useState<AccessInfo[]>([]);
  const [householdMembers, setHouseholdMembers] = useState<FlatMember[]>([]);
  const [userRegistration, setUserRegistration] = useState<any | null>(null);

  // Form states
  const [selectedPersonType, setSelectedPersonType] = useState<'self' | string>('self');
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [participantMobile, setParticipantMobile] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Action states
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setActionError(null);

      const [eventData, accessData] = await Promise.all([
        fetchEventDetails(id),
        resolveUserAccess().catch(() => []),
      ]);

      setEvent(eventData);
      setActiveAccess(accessData);

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch current user's profile to default form
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setParticipantName(profile.full_name || '');
          setParticipantEmail(profile.email || '');
          setParticipantMobile(profile.mobile || '');
        }

        // Fetch user's existing registration for this event
        const { data: existingReg } = await supabase
          .from('event_registrations')
          .select('*')
          .eq('event_id', id)
          .eq('user_id', user.id)
          .eq('status', 'Confirmed')
          .maybeSingle();

        setUserRegistration(existingReg);

        // If user has an active flat, load household members
        if (accessData.length > 0) {
          const flatId = accessData[0].flat_id;
          const { data: members } = await supabase
            .from('flat_members')
            .select('id, full_name, relationship, resident_type, mobile, email')
            .eq('flat_id', flatId)
            .eq('status', 'Active');

          setHouseholdMembers(members || []);
        }
      }
    } catch (err: any) {
      console.error('Error loading event details:', err);
      setActionError('Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handlePersonSelect = (type: 'self' | string) => {
    setSelectedPersonType(type);
    if (type === 'self') {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
            .then(({ data: p }) => {
              if (p) {
                setParticipantName(p.full_name || '');
                setParticipantEmail(p.email || '');
                setParticipantMobile(p.mobile || '');
              }
            });
        }
      });
    } else {
      const member = householdMembers.find((m) => m.id === type);
      if (member) {
        setParticipantName(member.full_name || '');
        setParticipantEmail(member.email || '');
        setParticipantMobile(member.mobile || '');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !id) return;

    try {
      setSubmitting(true);
      setActionError(null);

      const flatId = activeAccess[0]?.flat_id;
      const flatMemberId = selectedPersonType === 'self' ? undefined : selectedPersonType;
      const selectedMember = householdMembers.find((m) => m.id === flatMemberId);

      await registerForEvent({
        event_id: id,
        flat_id: flatId,
        flat_member_id: flatMemberId,
        participant_name: participantName,
        participant_email: participantEmail,
        participant_mobile: participantMobile,
        participant_type: selectedMember ? selectedMember.relationship : 'Primary Resident',
        quantity: quantity,
        notes: notes,
      });

      setActionSuccess('Successfully registered for event!');
      await loadData();
    } catch (err: any) {
      console.error('Registration error:', err);
      setActionError(err.message || 'Failed to register for event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!userRegistration) return;
    const confirmCancel = window.confirm('Are you sure you want to cancel your registration?');
    if (!confirmCancel) return;

    try {
      setSubmitting(true);
      setActionError(null);
      await cancelEventRegistration(userRegistration.id);
      setActionSuccess('Registration cancelled.');
      await loadData();
    } catch (err: any) {
      console.error('Cancellation error:', err);
      setActionError(err.message || 'Failed to cancel registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div className="animate-fade-in" style={{ color: 'var(--text-muted)' }}>
          Loading event details...
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-details-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Event Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          This event may have been removed or is not available.
        </p>
        <button className="btn-primary" onClick={() => navigate('/events')}>
          Back to Events
        </button>
      </div>
    );
  }

  const confirmed = event.confirmed_count || 0;
  const hasCapacity = event.capacity > 0;
  const spotsLeft = hasCapacity ? Math.max(0, event.capacity - confirmed) : null;
  const isFull = hasCapacity && spotsLeft === 0;
  const fillPercentage = hasCapacity ? Math.min(100, Math.round((confirmed / event.capacity) * 100)) : 0;

  return (
    <div className="event-details-container">
      {/* Top Banner */}
      <div className="event-hero-banner">
        {event.banner_url ? (
          <img src={event.banner_url} alt={event.title} />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background:
                event.category === 'Festival'
                  ? 'linear-gradient(135deg, #b45309, #451a03)'
                  : event.category === 'Cultural'
                  ? 'linear-gradient(135deg, #6d28d9, #2e1065)'
                  : 'linear-gradient(135deg, #1e293b, #0f172a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            <Sparkles size={56} />
          </div>
        )}
        <button
          className="btn-outline"
          onClick={() => navigate('/events')}
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            padding: '0.5rem',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="event-details-content">
        {/* Main Event Card */}
        <div className="event-main-card animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--accent-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                }}
              >
                {event.category}
              </span>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.5rem' }}>{event.title}</h1>
              {event.organizer && (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Organized by: <strong>{event.organizer}</strong>
                </p>
              )}
            </div>
            <StatusBadge status={event.status} />
          </div>

          {/* Schedule & Venue Meta */}
          <div className="event-meta-grid">
            <div className="event-meta-item">
              <div className="event-meta-icon">
                <Calendar size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {new Date(event.start_date).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <div className="event-meta-item">
              <div className="event-meta-icon">
                <Clock size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {event.start_time} - {event.end_time}
                </div>
              </div>
            </div>

            <div className="event-meta-item">
              <div className="event-meta-icon">
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Venue</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{event.venue}</div>
              </div>
            </div>

            <div className="event-meta-item">
              <div className="event-meta-icon">
                <Users size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capacity</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {hasCapacity ? `${confirmed} / ${event.capacity} seats` : 'Open for All'}
                </div>
              </div>
            </div>
          </div>

          {/* Capacity Progress Bar */}
          {hasCapacity && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>{confirmed} Registered</span>
                <span>{spotsLeft} Spots Left</span>
              </div>
              <div className="event-capacity-bar">
                <div className="event-capacity-fill" style={{ width: `${fillPercentage}%` }} />
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div style={{ marginTop: '1.25rem', fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                About the Event
              </h3>
              <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{event.description}</p>
            </div>
          )}
        </div>

        {/* Action Banners */}
        {actionSuccess && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#34d399',
              marginBottom: '1.5rem',
            }}
          >
            {actionSuccess}
          </div>
        )}

        {actionError && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#f87171',
              marginBottom: '1.5rem',
            }}
          >
            {actionError}
          </div>
        )}

        {/* REGISTRATION STATE: ALREADY REGISTERED */}
        {userRegistration ? (
          <div className="registration-card animate-fade-in" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  You are Registered!
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Confirmed participant: <strong>{userRegistration.participant_name}</strong> (Qty: {userRegistration.quantity})
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-outline"
                onClick={handleCancelRegistration}
                disabled={submitting}
                style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '0.85rem' }}
              >
                {submitting ? 'Cancelling...' : 'Cancel Registration'}
              </button>
            </div>
          </div>
        ) : isFull ? (
          <div className="registration-card animate-fade-in" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <AlertCircle size={36} style={{ color: 'var(--danger)', marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem' }}>Event is Full</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              All {event.capacity} seats for this event have been filled.
            </p>
          </div>
        ) : (
          /* REGISTRATION FORM */
          <div className="registration-card animate-fade-in">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Event Registration
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Register yourself or a member of your household for this event.
            </p>

            {/* Choose Person */}
            {householdMembers.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Who is participating?
                </label>
                <div className="participant-selector">
                  <div
                    className={`participant-option ${selectedPersonType === 'self' ? 'selected' : ''}`}
                    onClick={() => handlePersonSelect('self')}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Myself</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Primary Account</div>
                  </div>

                  {householdMembers.map((m) => (
                    <div
                      key={m.id}
                      className={`participant-option ${selectedPersonType === m.id ? 'selected' : ''}`}
                      onClick={() => handlePersonSelect(m.id)}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{m.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {m.resident_type || m.relationship}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Participant Name *
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  placeholder="Full name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    className="admin-search-input"
                    style={{ width: '100%' }}
                    placeholder="10-digit mobile"
                    value={participantMobile}
                    onChange={(e) => setParticipantMobile(e.target.value)}
                    maxLength={10}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Quantity (Attendees) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="admin-search-input"
                    style={{ width: '100%' }}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Special Notes / Diet / Comments
                </label>
                <textarea
                  rows={2}
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  placeholder="Optional notes for the event organizer..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              >
                {submitting ? 'Registering...' : 'Confirm Registration'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
