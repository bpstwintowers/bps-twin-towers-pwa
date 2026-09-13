import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  MapPin,
  Share2,
  SlidersHorizontal,
  Check,
  Sparkles,
  Calendar,
  Flame,
  Utensils,
  Music,
  X,
  Phone,
  MessageCircle,
  Award,
  RefreshCw,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { GaneshBottomNav } from '../ganesh/components/GaneshBottomNav';
import { HeaderNavbar } from '../ganesh/components/HeaderNavbar';
import { fetchLiveMasterEvents, type LiveMasterEventItem } from '../../services/liveSheetService';
import './EventList.css';

export interface FestivalEventItem {
  id: string;
  dayNumber: number;
  dayLabel: string;
  dateKey: 'sep14' | 'sep15' | 'sep16' | 'sep17' | 'sep18' | 'sep19';
  month: string;
  day: string;
  title: string;
  category: 'Rituals & Pooja' | 'Event Team';
  categoryTagClass: 'tag-lavender' | 'tag-indigo' | 'tag-emerald' | 'tag-amber' | 'tag-rose';
  accentClass: 'accent-gold' | 'accent-navy' | 'accent-emerald' | 'accent-purple' | 'accent-rose';
  badgeTheme: 'badge-dark-navy' | 'badge-light-gray';
  time: string;
  location: string;
  description: string;
  rituals?: string[];
  naivedyam?: string;
  dressCode?: string;
  spocName?: string;
  spocPhone?: string;
  attendeesCount?: number;
  hasShareBtn?: boolean;
  avatarUrls?: string[];
}

function mapLiveEventToFestivalEvent(item: LiveMasterEventItem): FestivalEventItem {
  const isRitual = item.category === 'Rituals & Pooja';
  return {
    id: item.id,
    dayNumber: item.dayNumber,
    dayLabel: item.dayLabel,
    dateKey: item.dateKey,
    month: item.month,
    day: item.day,
    title: item.title,
    category: item.category,
    categoryTagClass: isRitual ? 'tag-amber' : 'tag-lavender',
    accentClass: isRitual ? 'accent-gold' : 'accent-purple',
    badgeTheme: isRitual ? 'badge-dark-navy' : 'badge-light-gray',
    time: item.timeSlot,
    location: item.location,
    description: item.description,
    rituals: item.rituals,
    spocName: item.spocName,
    spocPhone: item.spocPhone,
    hasShareBtn: true,
  };
}

const FESTIVAL_EVENTS_14_TO_19: FestivalEventItem[] = [
  // ==========================================
  // DAY 1: 14th Sep 2026 (Monday - Live Master Sheet Items)
  // ==========================================
  {
    id: 'day1-pooja',
    dayNumber: 1,
    dayLabel: 'Day 1 • Mon, 14th Sep',
    dateKey: 'sep14',
    month: 'SEP',
    day: '14',
    title: 'Sandhya Pooja & Maha Aarti',
    category: 'Rituals & Pooja',
    categoryTagClass: 'tag-amber',
    accentClass: 'accent-gold',
    badgeTheme: 'badge-dark-navy',
    time: '7:30 PM - 8:30 PM',
    location: 'Main Ganesh Mandap',
    description: 'Evening Ganapathi Pooja, Atharvashirsha chanting and Maha Aarti',
    rituals: [
      'Deeparadhana',
      'Atharvashirsha Parayanam',
      'Maha Mangala Aarti',
    ],
    dressCode: 'Traditional Festive Attire (Kurta / Saree)',
    attendeesCount: 150,
    hasShareBtn: true,
  },
  {
    id: 'day1-dance',
    dayNumber: 1,
    dayLabel: 'Day 1 • Mon, 14th Sep',
    dateKey: 'sep14',
    month: 'SEP',
    day: '14',
    title: 'Classical Dance Performance – Ladies',
    category: 'Event Team',
    categoryTagClass: 'tag-lavender',
    accentClass: 'accent-purple',
    badgeTheme: 'badge-light-gray',
    time: '8:30 PM - 8:50 PM',
    location: 'Mandap Stage',
    description: 'Classical Dance Performance by Society Ladies',
    rituals: ['Stage Welcome', 'Classical Dance'],
    spocName: 'Ananya Deshmukh (D-102)',
    spocPhone: '+91 98450 45678',
    attendeesCount: 95,
    hasShareBtn: true,
  },
  {
    id: 'day1-singing',
    dayNumber: 1,
    dayLabel: 'Day 1 • Mon, 14th Sep',
    dateKey: 'sep14',
    month: 'SEP',
    day: '14',
    title: 'Devotional Song Performance – Pradeep & Manjari Mam',
    category: 'Event Team',
    categoryTagClass: 'tag-lavender',
    accentClass: 'accent-purple',
    badgeTheme: 'badge-light-gray',
    time: '8:50 PM - 9:15 PM',
    location: 'Mandap Stage',
    description: 'Devotional Song Performance by Pradeep & Manjari Mam',
    rituals: ['Vocal Devotional Seva'],
    spocName: 'Ananya Deshmukh (D-102)',
    spocPhone: '+91 98450 45678',
    attendeesCount: 110,
    hasShareBtn: true,
  },
  {
    id: 'day1-dinner',
    dayNumber: 1,
    dayLabel: 'Day 1 • Mon, 14th Sep',
    dateKey: 'sep14',
    month: 'SEP',
    day: '14',
    title: 'Community Dinner & Fellowship',
    category: 'Event Team',
    categoryTagClass: 'tag-lavender',
    accentClass: 'accent-purple',
    badgeTheme: 'badge-light-gray',
    time: '9:15 PM onwards',
    location: 'Dining Area',
    description: 'Festive community dinner served for all residents and volunteers',
    rituals: ['Community Dining'],
    attendeesCount: 220,
    hasShareBtn: true,
  },
  {
    id: 'day1-games',
    dayNumber: 1,
    dayLabel: 'Day 1 • Mon, 14th Sep',
    dateKey: 'sep14',
    month: 'SEP',
    day: '14',
    title: 'Children Musical Chairs Activity',
    category: 'Event Team',
    categoryTagClass: 'tag-lavender',
    accentClass: 'accent-purple',
    badgeTheme: 'badge-light-gray',
    time: '9:45 PM onwards',
    location: 'Central Podium',
    description: 'Recreational musical chairs game for children (subject to time availability)',
    rituals: ['Kids Activity & Candies'],
    attendeesCount: 65,
    hasShareBtn: true,
  },
];

type DayFilter = 'all' | 'sep14' | 'sep15' | 'sep16' | 'sep17' | 'sep18' | 'sep19';

function getDayFilterName(filter: DayFilter): string {
  switch (filter) {
    case 'sep14': return 'Day 1 (Mon, Sep 14)';
    case 'sep15': return 'Day 2 (Tue, Sep 15)';
    case 'sep16': return 'Day 3 (Wed, Sep 16)';
    case 'sep17': return 'Day 4 (Thu, Sep 17)';
    case 'sep18': return 'Day 5 (Fri, Sep 18)';
    case 'sep19': return 'Day 6 (Sat, Sep 19)';
    default: return 'All 6 Days';
  }
}

interface EventListProps {
  embedded?: boolean;
  onBackToHome?: () => void;
}

export const EventList: React.FC<EventListProps> = ({ embedded = false, onBackToHome }) => {
  const navigate = useNavigate();
  const [eventsList, setEventsList] = useState<FestivalEventItem[]>(FESTIVAL_EVENTS_14_TO_19);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [activeDayFilter, setActiveDayFilter] = useState<DayFilter>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedEventModal, setSelectedEventModal] = useState<FestivalEventItem | null>(null);

  const loadLiveEvents = async () => {
    setIsSyncing(true);
    try {
      const liveItems = await fetchLiveMasterEvents();
      if (liveItems && liveItems.length > 0) {
        const mapped = liveItems.map(mapLiveEventToFestivalEvent);
        setEventsList(mapped);
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Could not load live events from Master Portal:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadLiveEvents();
  }, []);

  const categories = [
    'ALL',
    'Rituals & Pooja',
    'Event Team',
  ];

  const filteredEvents = useMemo(() => {
    return eventsList.filter((event) => {
      // Day filter (14th to 19th Sep)
      if (activeDayFilter !== 'all' && event.dateKey !== activeDayFilter) return false;

      // Category filter (support Rituals & Pooja, Event Team, or ALL)
      if (selectedCategory !== 'ALL') {
        if (selectedCategory === 'Rituals & Pooja' && event.category !== 'Rituals & Pooja') return false;
        if (selectedCategory === 'Event Team' && event.category !== 'Event Team') return false;
      }

      return true;
    });
  }, [eventsList, activeDayFilter, selectedCategory]);

  const handleShare = (e: React.MouseEvent, event: FestivalEventItem) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/events#${event.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedId(event.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className={embedded ? 'fest-events-embedded-wrap' : 'festival-events-page-root'}>
      {/* 1. UNIFIED TOP WHITE NAVBAR (Only on standalone page) */}
      {!embedded && <HeaderNavbar />}

      {/* Embedded Back Button */}
      {embedded && onBackToHome && (
        <div style={{ padding: '0.25rem 0 0.75rem 0' }}>
          <button
            type="button"
            onClick={onBackToHome}
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.45rem 0.95rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#0f172a',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <ArrowLeft size={16} color="#ea580c" />
            <span>← Back to Festival Home</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          2. PAGE MAIN CONTENT
         ========================================================================= */}
      <main className="fest-events-body">
        {/* Title Header Row with Filter Toggle & Live Sync Button */}
        <div className="fest-title-header-row">
          <div>
            <h1 className="fest-main-title">Festival Events</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                Master Festival Schedule (14th – 19th Sep 2026)
              </span>
              {lastSyncTime && (
                <span style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                  Synced {lastSyncTime}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="fest-filter-toggle-btn"
              onClick={loadLiveEvents}
              disabled={isSyncing}
              title="Sync Live with Google Sheets Master Portal"
              style={{
                background: '#fff7ed',
                borderColor: '#fed7aa',
                color: '#ea580c',
              }}
            >
              <RefreshCw size={17} className={isSyncing ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              className={`fest-filter-toggle-btn ${isFilterOpen ? 'is-active' : ''}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              title="Filter by Category"
              aria-label="Filter"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Category Filter Drawer / Bar (Conditional) */}
        {isFilterOpen && (
          <div className="fest-category-filter-bar animate-fade-in">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`fest-cat-chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        )}

        {/* =======================================================================
            3. HORIZONTAL DATE PILLS (14TH TO 19TH SEP)
           ======================================================================= */}
        <div className="fest-date-pills-scroll">
          <button
            type="button"
            className={`fest-date-pill ${
              activeDayFilter === 'all' ? 'is-today-active' : ''
            }`}
            onClick={() => setActiveDayFilter('all')}
          >
            All 6 Days
          </button>

          <button
            type="button"
            className={`fest-date-pill ${
              activeDayFilter === 'sep14' ? 'is-today-active' : ''
            }`}
            onClick={() => setActiveDayFilter('sep14')}
          >
            Sep 14 (Day 1)
          </button>

          <button
            type="button"
            className={`fest-date-pill ${
              activeDayFilter === 'sep15' ? 'is-tomorrow-active' : ''
            }`}
            onClick={() => setActiveDayFilter('sep15')}
          >
            Sep 15 (Day 2)
          </button>

          <button
            type="button"
            className={`fest-date-pill ${
              activeDayFilter === 'sep16' ? 'is-active-generic' : ''
            }`}
            onClick={() => setActiveDayFilter('sep16')}
          >
            Sep 16 (Day 3)
          </button>

          <button
            type="button"
            className={`fest-date-pill ${
              activeDayFilter === 'sep17' ? 'is-active-generic' : ''
            }`}
            onClick={() => setActiveDayFilter('sep17')}
          >
            Sep 17 (Day 4)
          </button>

          <button
            type="button"
            className={`fest-date-pill ${
              activeDayFilter === 'sep18' ? 'is-active-generic' : ''
            }`}
            onClick={() => setActiveDayFilter('sep18')}
          >
            Sep 18 (Day 5)
          </button>

          <button
            type="button"
            className={`fest-date-pill ${
              activeDayFilter === 'sep19' ? 'is-today-active' : ''
            }`}
            onClick={() => setActiveDayFilter('sep19')}
          >
            Sep 19 (Day 6)
          </button>
        </div>

        {/* =======================================================================
            4. SEQUENTIAL TIME EVENT CARDS LIST (MATCHING LIVE GOOGLE SHEET)
           ======================================================================= */}
        <div className="fest-cards-list">
          {filteredEvents.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1.5px dashed #cbd5e1',
                padding: '2.5rem 1.25rem',
                textAlign: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: '#fff7ed',
                  color: '#ea580c',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.85rem',
                }}
              >
                <Calendar size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem' }}>
                {getDayFilterName(activeDayFilter)} Schedule In Progress
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
                The Event & Cultural Committee is actively preparing the lineup for this day. Fixed daily rituals are confirmed below:
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '14px',
                  padding: '1rem 1.15rem',
                  maxWidth: '420px',
                  margin: '0 auto 1.5rem',
                  textAlign: 'left',
                  fontSize: '0.84rem',
                  color: '#334155',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#ea580c', fontWeight: 800 }}>🪔 7:30 PM:</span>
                  <span>Daily Sandhya Pooja & Maha Aarti</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>🍲 8:30 PM:</span>
                  <span>Community Maha Prasadam Dinner</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={loadLiveEvents}
                  disabled={isSyncing}
                  style={{
                    background: '#fff7ed',
                    border: '1.5px solid #fed7aa',
                    borderRadius: '12px',
                    padding: '0.55rem 1rem',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#ea580c',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Live Sheet'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDayFilter('all');
                    setSelectedCategory('ALL');
                  }}
                  style={{
                    background: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.55rem 1rem',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  View All 6 Days
                </button>
              </div>
            </div>
          ) : (
            <>
              {filteredEvents.map((event) => (
                <article key={event.id} className="fest-event-card">
                  {/* Top Accent Stripe */}
                  <div className={`fest-card-accent-top ${event.accentClass}`} />

                  {/* Card Top Row: Tag + Date Badge */}
                  <div className="fest-card-top-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <span className={`fest-team-tag ${event.categoryTagClass}`}>
                        {event.category}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#9a3412',
                          background: '#fff7ed',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          border: '1px solid #fed7aa',
                        }}
                      >
                        {event.dayLabel}
                      </span>
                    </div>

                    <div className={`fest-date-badge-block ${event.badgeTheme}`}>
                      <span className="fest-badge-month">{event.month}</span>
                      <span className="fest-badge-day">{event.day}</span>
                    </div>
                  </div>

                  {/* Event Title */}
                  <h2 className="fest-card-event-title">{event.title}</h2>

                  {/* Event Description */}
                  <p className="fest-card-event-desc">{event.description}</p>

                  {/* Metadata: Time & Location */}
                  <div className="fest-card-meta-list">
                    <div className="fest-meta-item">
                      <Clock size={16} className="fest-meta-icon" style={{ color: '#ea580c' }} />
                      <strong style={{ color: '#0f172a' }}>{event.time}</strong>
                    </div>
                    <div className="fest-meta-item">
                      <MapPin size={16} className="fest-meta-icon" style={{ color: '#0284c7' }} />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  {/* SPOC / Coordinator info if available */}
                  {event.spocName && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        paddingTop: '0.65rem',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        fontSize: '0.78rem',
                      }}
                    >
                      <span style={{ color: '#64748b' }}>
                        Coord: <strong style={{ color: '#0f172a' }}>{event.spocName}</strong>
                      </span>
                      {event.spocPhone && (
                        <a
                          href={`tel:${event.spocPhone.replace(/\s+/g, '')}`}
                          style={{
                            color: '#0284c7',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <Phone size={13} />
                          {event.spocPhone}
                        </a>
                      )}
                    </div>
                  )}
                </article>
              ))}

              {/* Informative Footer Banner when viewing All Days */}
              {activeDayFilter === 'all' && (
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '1rem 1.15rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <Info size={20} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>
                      Master Portal Live Sync Connected
                    </strong>
                    Showing 5 confirmed events scheduled for Day 1. Days 2 to 6 cultural activities and rituals will sync automatically as the Committee finalizes slots.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* =======================================================================
          5. EVENT DETAILS MODAL POPUP
         ======================================================================= */}
      {selectedEventModal && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setSelectedEventModal(null)}
        >
          <div
            className="animate-fade-in"
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '1px solid #fed7aa',
              padding: '1.5rem',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedEventModal(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#f1f5f9',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              <X size={18} />
            </button>

            {/* Header Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.6rem' }}>
              <span className={`fest-team-tag ${selectedEventModal.categoryTagClass}`}>
                {selectedEventModal.category}
              </span>
              <span
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#9a3412',
                  background: '#fff7ed',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '9999px',
                }}
              >
                {selectedEventModal.dayLabel}
              </span>
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem' }}>
              {selectedEventModal.title}
            </h2>

            <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
              {selectedEventModal.description}
            </p>

            {/* Timings & Location Card */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '16px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Clock size={18} color="#ea580c" />
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>TIMING</div>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{selectedEventModal.time}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <MapPin size={18} color="#0284c7" />
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>VENUE / LOCATION</div>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{selectedEventModal.location}</strong>
                </div>
              </div>
            </div>

            {/* Rituals & Program List (if any) */}
            {selectedEventModal.rituals && selectedEventModal.rituals.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
                  🪔 Rituals &amp; Highlights:
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  {selectedEventModal.rituals.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Naivedyam & Dress Code */}
            {(selectedEventModal.naivedyam || selectedEventModal.dressCode) && (
              <div
                style={{
                  background: '#fffbeb',
                  borderRadius: '14px',
                  padding: '0.85rem 1rem',
                  border: '1px solid #fde68a',
                  marginBottom: '1.25rem',
                  fontSize: '0.84rem',
                  color: '#92400e',
                }}
              >
                {selectedEventModal.naivedyam && (
                  <div style={{ marginBottom: selectedEventModal.dressCode ? '0.35rem' : '0' }}>
                    <strong>🍽️ Naivedyam: </strong> {selectedEventModal.naivedyam}
                  </div>
                )}
                {selectedEventModal.dressCode && (
                  <div>
                    <strong>👗 Dress Code: </strong> {selectedEventModal.dressCode}
                  </div>
                )}
              </div>
            )}

            {/* SPOC Contact */}
            {selectedEventModal.spocName && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f1f5f9',
                  borderRadius: '14px',
                  padding: '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  marginTop: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>LEAD SPOC</div>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{selectedEventModal.spocName}</strong>
                </div>

                {selectedEventModal.spocPhone && (
                  <a
                    href={`https://wa.me/91${selectedEventModal.spocPhone}?text=Hi%20${selectedEventModal.spocName},%20regarding%20${selectedEventModal.title}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: '#25D366',
                      color: '#ffffff',
                      textDecoration: 'none',
                      borderRadius: '10px',
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Festival Bottom Navigation (Standalone Route Only) */}
      {!embedded && <GaneshBottomNav activeTab="pooja" />}
    </div>
  );
};
