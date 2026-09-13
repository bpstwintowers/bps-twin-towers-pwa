import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Mic,
  Users,
  Star,
  Clock,
  Send,
  CheckCircle2,
  Calendar,
  Flame,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  MapPin,
  Tag,
  Info,
} from 'lucide-react';
import { GaneshBottomNav } from './components/GaneshBottomNav';
import { HeaderNavbar } from './components/HeaderNavbar';
import {
  fetchLiveMasterCultural,
  type LiveMasterCulturalItem,
  submitCulturalEntryToGoogleSheet,
  type CulturalRegistrationEntry,
  MASTER_PORTAL_URL,
} from '../../services/liveSheetService';
import './GaneshCultural.css';

interface PerformanceScheduleItem {
  id: string;
  date: string;
  dayLabel?: string;
  time: string;
  title: string;
  duration?: string;
  description: string;
  performerAvatarText: string;
  performerAvatarType: 'orange' | 'indigo' | 'yellow' | 'star' | 'emerald';
  performerName: string;
  flatNo?: string;
  category: string;
  iconType: 'dance' | 'mic' | 'group' | 'star' | 'music';
  stripeType: 'orange' | 'coral' | 'yellow' | 'special';
  isSpecial?: boolean;
}

const DEFAULT_FALLBACK_ACTS: PerformanceScheduleItem[] = [
  {
    id: 'act-1',
    date: '2026-09-14',
    dayLabel: 'Day 1 • Mon, Sep 14',
    time: '08:30 PM - 08:50 PM',
    title: 'Classical Dance Performance - Ladies',
    duration: '10 Mins',
    description: 'Bharatanatyam & classical invocatory dance presentation by BPS ladies group.',
    performerAvatarText: 'L',
    performerAvatarType: 'orange',
    performerName: 'Society Ladies',
    flatNo: 'Multiple Flats',
    category: 'Classical Dance',
    iconType: 'dance',
    stripeType: 'orange',
  },
  {
    id: 'act-2',
    date: '2026-09-14',
    dayLabel: 'Day 1 • Mon, Sep 14',
    time: '08:50 PM - 09:15 PM',
    title: 'Devotional Song Performance - Pradeep & Manjari Mam',
    duration: '15 Mins',
    description: 'Devotional vocal bhajans and abhangs dedicated to Lord Ganesha.',
    performerAvatarText: 'P',
    performerAvatarType: 'indigo',
    performerName: 'Pradeep & Manjari Mam',
    flatNo: 'Society Residents',
    category: 'Vocal Performance',
    iconType: 'mic',
    stripeType: 'coral',
  },
  {
    id: 'act-3',
    date: '2026-09-15',
    dayLabel: 'Day 2 • Tue, Sep 15',
    time: '08:30 PM - 09:30 PM',
    title: 'Kids Sloka & Vedic Chanting',
    duration: '60 Mins',
    description: 'Ganesha Pancharatnam & Vedic chanting by resident kids.',
    performerAvatarText: '⭐',
    performerAvatarType: 'star',
    performerName: 'BPS Balagokulam Kids',
    flatNo: 'Society Children',
    category: 'Devotional Chanting',
    iconType: 'star',
    stripeType: 'special',
    isSpecial: true,
  },
];

const FESTIVAL_DAYS = [
  { key: 'all', label: 'All Acts', date: '' },
  { key: '2026-09-14', label: 'Day 1 (Sep 14)', date: '2026-09-14' },
  { key: '2026-09-15', label: 'Day 2 (Sep 15)', date: '2026-09-15' },
  { key: '2026-09-16', label: 'Day 3 (Sep 16)', date: '2026-09-16' },
  { key: '2026-09-17', label: 'Day 4 (Sep 17)', date: '2026-09-17' },
  { key: '2026-09-18', label: 'Day 5 (Sep 18)', date: '2026-09-18' },
  { key: '2026-09-19', label: 'Day 6 (Sep 19)', date: '2026-09-19' },
];

function mapLiveItemToSchedule(item: LiveMasterCulturalItem, index: number): PerformanceScheduleItem {
  const catLower = item.actCategory.toLowerCase();
  let iconType: 'dance' | 'mic' | 'group' | 'star' | 'music' = 'dance';
  let stripeType: 'orange' | 'coral' | 'yellow' | 'special' = 'orange';
  let avatarType: 'orange' | 'indigo' | 'yellow' | 'star' | 'emerald' = 'orange';

  if (catLower.includes('vocal') || catLower.includes('sing') || catLower.includes('song') || catLower.includes('bhajan')) {
    iconType = 'mic';
    stripeType = 'coral';
    avatarType = 'indigo';
  } else if (catLower.includes('dance') || catLower.includes('classical')) {
    iconType = 'dance';
    stripeType = 'orange';
    avatarType = 'orange';
  } else if (catLower.includes('kid') || catLower.includes('child') || catLower.includes('game') || catLower.includes('group')) {
    iconType = 'group';
    stripeType = 'yellow';
    avatarType = 'yellow';
  } else if (catLower.includes('sloka') || catLower.includes('chant') || catLower.includes('special')) {
    iconType = 'star';
    stripeType = 'special';
    avatarType = 'star';
  }

  const firstLetter = item.performers ? item.performers.trim().charAt(0).toUpperCase() : 'P';

  return {
    id: item.id || `live-act-${index}`,
    date: item.date,
    dayLabel: item.date ? `Date: ${item.date}` : undefined,
    time: item.timeSlot,
    title: item.performanceTitle,
    duration: item.durationMins || '15 Mins',
    description: item.description,
    performerAvatarText: firstLetter,
    performerAvatarType: avatarType,
    performerName: item.performers || 'Society Residents',
    flatNo: item.flatNo,
    category: item.actCategory,
    iconType,
    stripeType,
    isSpecial: stripeType === 'special',
  };
}

interface GaneshCulturalPageProps {
  embedded?: boolean;
  onBackToHome?: () => void;
}

export const GaneshCulturalPage: React.FC<GaneshCulturalPageProps> = ({ embedded = false, onBackToHome }) => {
  const navigate = useNavigate();

  // Schedule & Live Sync State
  const [scheduleItems, setScheduleItems] = useState<PerformanceScheduleItem[]>(DEFAULT_FALLBACK_ACTS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('all');

  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [flatNo, setFlatNo] = useState('');
  const [mobile, setMobile] = useState('');
  const [actType, setActType] = useState('');
  const [preferredDate, setPreferredDate] = useState('2026-09-14');
  const [duration, setDuration] = useState('');
  const [actDescription, setActDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastSubmittedEntry, setLastSubmittedEntry] = useState<CulturalRegistrationEntry | null>(null);
  const [submitFeedbackMsg, setSubmitFeedbackMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadLiveCultural = async () => {
    setIsSyncing(true);
    try {
      const liveData = await fetchLiveMasterCultural();
      if (liveData && liveData.length > 0) {
        const mapped = liveData.map(mapLiveItemToSchedule);
        setScheduleItems(mapped);
      } else {
        setScheduleItems(DEFAULT_FALLBACK_ACTS);
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Could not sync live cultural acts:', err);
      setScheduleItems(DEFAULT_FALLBACK_ACTS);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadLiveCultural();
  }, []);

  const filteredItems = scheduleItems.filter((item) => {
    if (selectedDay === 'all') return true;
    return item.date === selectedDay;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !flatNo.trim() || !mobile.trim() || !actType) {
      setErrorMessage('Please fill in all required fields (Name, Flat No, Mobile & Act Type).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await submitCulturalEntryToGoogleSheet({
        fullName: fullName.trim(),
        flatNo: flatNo.trim().toUpperCase(),
        mobile: mobile.trim(),
        actType,
        preferredDate,
        duration: duration.trim() || '15 mins',
        actDescription: actDescription.trim(),
      });

      setLastSubmittedEntry(res.entry);
      setSubmitFeedbackMsg(res.message);
      setIsSubmitted(true);
      setFullName('');
      setFlatNo('');
      setMobile('');
      setActType('');
      setDuration('');
      setActDescription('');
    } catch (err) {
      console.warn('Error submitting cultural registration:', err);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cultural-page-root">
      {/* Top Navbar (Standalone only) */}
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

      {/* Main Content */}
      <main className="cultural-main-container">
        {/* Live Sheet Synchronization Status Card */}
        <section
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '0.85rem 1rem',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isSyncing ? '#f59e0b' : '#10b981',
                boxShadow: isSyncing ? '0 0 8px #f59e0b' : '0 0 8px #10b981',
              }}
            />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>Master Portal Live Synced</span>
                <span
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                  }}
                >
                  Cultural Tab
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                {lastSyncTime ? `Updated at ${lastSyncTime}` : 'Fetching live acts...'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={loadLiveCultural}
              disabled={isSyncing}
              style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.4rem 0.65rem',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: '#1e293b',
                cursor: isSyncing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            <a
              href={MASTER_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Google Sheet Master Portal"
              style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.4rem 0.5rem',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </section>

        {/* 1. Hero Stage Photo Card */}
        <section className="cultural-hero-card">
          <img
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80"
            alt="Cultural Utsav Stage"
            className="cultural-hero-bg"
          />
          <div className="cultural-hero-overlay">
            <div className="cultural-hero-lineup-pill">
              <Mic size={13} />
              <span>CULTURAL UTSAV 2026</span>
            </div>
            <h2 className="cultural-hero-title">Stage Performances</h2>
            <div className="cultural-hero-sub">
              <Calendar size={14} color="#f97316" />
              <span>Daily Evenings 8:30 PM • Main Stage Mandap</span>
            </div>
          </div>
        </section>

        {/* Day Selector Pills */}
        <section style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
          {FESTIVAL_DAYS.map((d) => {
            const isActive = selectedDay === (d.date || d.key);
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelectedDay(d.date || d.key)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: isActive ? '1.5px solid #ea580c' : '1.5px solid #cbd5e1',
                  background: isActive ? '#fff7ed' : '#ffffff',
                  color: isActive ? '#c2410c' : '#475569',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 6px rgba(234, 88, 12, 0.15)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {d.label}
              </button>
            );
          })}
        </section>

        {/* 2. Vertical Timeline Schedule */}
        <section className="cultural-timeline-wrap" aria-label="Cultural Event Timeline">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div key={item.id} className="timeline-entry">
                {/* Left Node with Circular Icon and Time */}
                <div className="timeline-node-col">
                  <div
                    className={`timeline-circle-icon ${
                      item.isSpecial
                        ? 'star-gold'
                        : item.iconType === 'dance'
                          ? 'indigo'
                          : item.iconType === 'mic'
                            ? 'slate'
                            : 'teal'
                    }`}
                  >
                    {item.iconType === 'dance' && <Flame size={18} color="#ffffff" />}
                    {item.iconType === 'mic' && <Mic size={18} color="#ffffff" />}
                    {item.iconType === 'group' && <Users size={18} color="#ffffff" />}
                    {item.iconType === 'star' && <Star size={18} fill="#f59e0b" color="#f59e0b" />}
                  </div>

                  <div className="timeline-time-label">
                    {(() => {
                      const parts = item.time.split(/[-–—]/);
                      if (parts.length === 2) {
                        return (
                          <div className="time-badge-inner">
                            <span className="time-val">{parts[0].trim()}</span>
                            <span className="time-to">to</span>
                            <span className="time-val">{parts[1].trim()}</span>
                          </div>
                        );
                      }
                      return <span className="time-val">{item.time}</span>;
                    })()}
                  </div>
                </div>

                {/* Timeline Card */}
                <div
                  className={`timeline-card ${
                    item.isSpecial
                      ? 'is-special-card'
                      : item.stripeType === 'orange'
                        ? 'stripe-orange'
                        : item.stripeType === 'coral'
                          ? 'stripe-coral'
                          : 'stripe-yellow'
                  }`}
                >
                  <div className="timeline-card-header">
                    <h3 className="timeline-card-title">{item.title}</h3>
                    {item.duration && (
                      <span className="duration-pill">
                        <Clock size={12} />
                        <span>{item.duration}</span>
                      </span>
                    )}
                  </div>

                  {item.category && (
                    <div style={{ marginBottom: '0.45rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          background: '#f1f5f9',
                          color: '#475569',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                        }}
                      >
                        <Tag size={11} color="#ea580c" />
                        <span>{item.category}</span>
                      </span>
                    </div>
                  )}

                  <p className="timeline-card-desc">{item.description}</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div className="performer-pill">
                      {item.performerAvatarType === 'star' ? (
                        <span className="performer-avatar star">⭐</span>
                      ) : (
                        <span className={`performer-avatar ${item.performerAvatarType}`}>
                          {item.performerAvatarText}
                        </span>
                      )}
                      <span>{item.performerName}</span>
                    </div>

                    {item.flatNo && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '999px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          color: '#64748b',
                        }}
                      >
                        <MapPin size={11} color="#f97316" />
                        <span>{item.flatNo}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1.5px dashed #cbd5e1',
                textAlign: 'center',
                margin: '1rem 0',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#fff7ed',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem auto',
                }}
              >
                <Info size={22} />
              </div>
              <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                Slots Open for Registration
              </h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                Performances for this date are currently being slotted by the Cultural Committee. Submit your entry below to perform!
              </p>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('cultural-registration-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  background: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Register Your Act ↓
              </button>
            </div>
          )}
        </section>

        {/* 3. "Want to perform?" Registration Form */}
        <section id="cultural-registration-section" className="cultural-form-card">
          <div className="cultural-form-header">
            <div className="form-header-icon">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="form-header-title">Want to perform?</h3>
              <p className="form-header-sub">Register your solo or group entry for stage slots.</p>
            </div>
          </div>

          {isSubmitted ? (
            <div className="cultural-success-banner" style={{ flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', width: '100%' }}>
                <CheckCircle2 size={26} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <h4 className="cultural-success-title" style={{ fontSize: '1rem', color: '#166534' }}>
                    Entry Submitted to Cultural Committee!
                  </h4>
                  <p className="cultural-success-sub" style={{ fontSize: '0.82rem', color: '#15803d', marginTop: '0.2rem' }}>
                    {submitFeedbackMsg || 'Your performance entry has been successfully recorded. The Cultural SPOC team will coordinate your stage slot.'}
                  </p>
                </div>
              </div>

              {lastSubmittedEntry && (
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '0.75rem 0.9rem',
                    width: '100%',
                    boxSizing: 'border-box',
                    fontSize: '0.8rem',
                    color: '#1e293b',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>
                    🎭 {lastSubmittedEntry.fullName} ({lastSubmittedEntry.flatNo})
                  </div>
                  <div style={{ color: '#475569' }}>
                    <strong>Category:</strong> {lastSubmittedEntry.actType} • {lastSubmittedEntry.duration || '15 mins'}
                  </div>
                  <div style={{ color: '#475569' }}>
                    <strong>Preferred Date:</strong> {lastSubmittedEntry.preferredDate}
                  </div>
                  {lastSubmittedEntry.actDescription && (
                    <div style={{ color: '#64748b', fontSize: '0.76rem', fontStyle: 'italic' }}>
                      "{lastSubmittedEntry.actDescription}"
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
                {lastSubmittedEntry && (
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `*BPS Ganesh Utsav 2026 - Cultural Performance Registration*\n\n` +
                      `👤 *Performer:* ${lastSubmittedEntry.fullName}\n` +
                      `🏢 *Flat:* ${lastSubmittedEntry.flatNo}\n` +
                      `📞 *Mobile:* ${lastSubmittedEntry.mobile}\n` +
                      `🎭 *Act Category:* ${lastSubmittedEntry.actType}\n` +
                      `🗓️ *Preferred Date:* ${lastSubmittedEntry.preferredDate}\n` +
                      `⏱️ *Duration:* ${lastSubmittedEntry.duration || '15 mins'}\n` +
                      (lastSubmittedEntry.actDescription ? `📝 *Notes:* ${lastSubmittedEntry.actDescription}\n` : '') +
                      `\n_Please confirm my stage slot!_`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      minWidth: '180px',
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.55rem 0.85rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      textDecoration: 'none',
                      boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                    }}
                  >
                    <span>Share on WhatsApp</span>
                    <span>📲</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  style={{
                    background: '#f8fafc',
                    color: '#334155',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.55rem 0.85rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Register Another Entry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="cultural-form-body">
              {errorMessage && (
                <div style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 600 }}>
                  {errorMessage}
                </div>
              )}

              {/* Full Name */}
              <div className="form-field-group">
                <label className="form-label" htmlFor="cultural-full-name">
                  Performer / Lead Name *
                </label>
                <input
                  id="cultural-full-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {/* 2 Column Row: Flat No & Mobile */}
              <div className="form-grid-2col">
                <div className="form-field-group">
                  <label className="form-label" htmlFor="cultural-flat-no">
                    Flat No. *
                  </label>
                  <input
                    id="cultural-flat-no"
                    type="text"
                    className="form-input"
                    placeholder="e.g. A-102"
                    value={flatNo}
                    onChange={(e) => setFlatNo(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="cultural-mobile">
                    Mobile No. *
                  </label>
                  <input
                    id="cultural-mobile"
                    type="tel"
                    className="form-input"
                    placeholder="+91"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 2 Column Row: Performance Type & Preferred Date */}
              <div className="form-grid-2col">
                <div className="form-field-group">
                  <label className="form-label" htmlFor="cultural-act-type">
                    Performance Type *
                  </label>
                  <select
                    id="cultural-act-type"
                    className="form-select"
                    value={actType}
                    onChange={(e) => setActType(e.target.value)}
                    required
                  >
                    <option value="">Select Act Type</option>
                    <option value="Classical Dance">Classical Dance</option>
                    <option value="Solo Dance">Solo Dance</option>
                    <option value="Group Dance">Group Dance</option>
                    <option value="Singing / Vocal">Singing / Vocal</option>
                    <option value="Instrumental Music">Instrumental Music</option>
                    <option value="Skit / Drama">Skit / Drama</option>
                    <option value="Sloka Recitation / Devotional">Sloka Recitation / Devotional</option>
                    <option value="Standup / Mimicry / Other">Standup / Mimicry / Other</option>
                  </select>
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="cultural-preferred-date">
                    Preferred Date
                  </label>
                  <select
                    id="cultural-preferred-date"
                    className="form-select"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                  >
                    <option value="2026-09-14">Day 1 • Sep 14</option>
                    <option value="2026-09-15">Day 2 • Sep 15</option>
                    <option value="2026-09-16">Day 3 • Sep 16</option>
                    <option value="2026-09-17">Day 4 • Sep 17</option>
                    <option value="2026-09-18">Day 5 • Sep 18</option>
                    <option value="2026-09-19">Day 6 • Sep 19</option>
                  </select>
                </div>
              </div>

              {/* Duration (Mins) */}
              <div className="form-field-group">
                <label className="form-label" htmlFor="cultural-duration">
                  Duration (Mins)
                </label>
                <input
                  id="cultural-duration"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 10 - 15 mins"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              {/* Brief Description */}
              <div className="form-field-group">
                <label className="form-label" htmlFor="cultural-description">
                  Act Description / Track Info
                </label>
                <input
                  id="cultural-description"
                  type="text"
                  className="form-input"
                  placeholder="Song title, number of participants, etc."
                  value={actDescription}
                  onChange={(e) => setActDescription(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="cultural-submit-btn"
                style={{ opacity: isSubmitting ? 0.75 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
              >
                <span>{isSubmitting ? 'Submitting to Committee...' : 'Submit Entry to Committee'}</span>
                <Send size={15} />
              </button>
            </form>
          )}
        </section>
      </main>

      {/* Floating Bottom Nav (Standalone only) */}
      {!embedded && <GaneshBottomNav />}
    </div>
  );
};

