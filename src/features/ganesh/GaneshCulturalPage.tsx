import React, { useState, useEffect, useMemo } from 'react';
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
  Pencil,
  Trash2,
  Plus,
  X,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { GaneshBottomNav } from './components/GaneshBottomNav';
import { HeaderNavbar } from './components/HeaderNavbar';
import {
  fetchLiveMasterCultural,
  type LiveMasterCulturalItem,
  submitCulturalEntryToGoogleSheet,
  type CulturalRegistrationEntry,
  addCustomCulturalAct,
  updateCustomCulturalAct,
  deleteCustomCulturalAct,
  stripPhoneNumbers,
  MASTER_PORTAL_URL,
} from '../../services/liveSheetService';
import { supabase } from '../../services/supabase/client';
import { fetchUserRoles } from '../../services/supabase/adminService';
import { hasAnyAdminRole } from '../../utils/rbac';
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

const ACT_CATEGORIES = [
  'Classical Dance',
  'Vocal Performance',
  'Group Dance',
  'Kids Sloka & Vedic Chanting',
  'Standup / Mimicry / Other',
  'Skit & Drama',
  'Devotional Chanting',
  'Musical Instrument',
  'Cultural Performance',
];

function mapLiveItemToSchedule(item: LiveMasterCulturalItem, index: number): PerformanceScheduleItem {
  const catLower = (item.actCategory || '').toLowerCase();
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
  } else if (catLower.includes('standup') || catLower.includes('mimicry') || catLower.includes('magic')) {
    iconType = 'mic';
    stripeType = 'orange';
    avatarType = 'orange';
  }

  const cleanedTitle = stripPhoneNumbers(item.performanceTitle || '');
  const cleanedPerformers = stripPhoneNumbers(item.performers || '') || 'Society Residents';
  const firstLetter = cleanedPerformers.trim().charAt(0).toUpperCase() || 'P';

  return {
    id: item.id || `live-act-${index}`,
    date: item.date,
    dayLabel: item.date ? `Date: ${item.date}` : undefined,
    time: item.timeSlot || 'Slot Pending Confirmation',
    title: cleanedTitle,
    duration: item.durationMins || '15 Mins',
    description: stripPhoneNumbers(item.description || ''),
    performerAvatarText: firstLetter,
    performerAvatarType: avatarType,
    performerName: cleanedPerformers,
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

  // Admin Detection
  const storedFlat = localStorage.getItem('bps_ganesh_user_flat') || '';
  const cleanFlat = storedFlat.trim().toUpperCase();
  const isAdminFlat =
    cleanFlat === 'ADMN' ||
    cleanFlat === 'ADMIN' ||
    cleanFlat.includes('ADMN') ||
    cleanFlat.includes('ADMIN');

  const [hasAuthAdminRole, setHasAuthAdminRole] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const checkRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const roles = await fetchUserRoles();
          if (isMounted) {
            setHasAuthAdminRole(hasAnyAdminRole(roles, session.user.email));
          }
        }
      } catch {
        // silent
      }
    };
    checkRole();
    return () => {
      isMounted = false;
    };
  }, []);

  const isAdmin = isAdminFlat || hasAuthAdminRole;

  // Schedule & Live Sync State
  const [scheduleItems, setScheduleItems] = useState<PerformanceScheduleItem[]>(DEFAULT_FALLBACK_ACTS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('all');

  // Admin Edit / Add State
  const [isActModalOpen, setIsActModalOpen] = useState(false);
  const [editingActId, setEditingActId] = useState<string | null>(null);
  const [actModalTitle, setActModalTitle] = useState('');
  const [actModalDate, setActModalDate] = useState('2026-09-14');
  const [actModalTime, setActModalTime] = useState('08:30 PM - 08:50 PM');
  const [actModalDuration, setActModalDuration] = useState('15 Mins');
  const [actModalCategory, setActModalCategory] = useState('Classical Dance');
  const [actModalPerformers, setActModalPerformers] = useState('');
  const [actModalFlatNo, setActModalFlatNo] = useState('');
  const [actModalDescription, setActModalDescription] = useState('');
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingAct, setDeletingAct] = useState<PerformanceScheduleItem | null>(null);

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
      if (Array.isArray(liveData)) {
        const mapped = liveData.map(mapLiveItemToSchedule);
        setScheduleItems(mapped);
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Could not sync live cultural acts:', err);
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

  const handleOpenAddModal = () => {
    setEditingActId(null);
    setActModalTitle('');
    setActModalDate(selectedDay !== 'all' ? selectedDay : '2026-09-14');
    setActModalTime('08:30 PM - 08:50 PM');
    setActModalDuration('15 Mins');
    setActModalCategory('Classical Dance');
    setActModalPerformers('');
    setActModalFlatNo('');
    setActModalDescription('');
    setModalFeedback(null);
    setIsActModalOpen(true);
  };

  const handleOpenEditModal = (item: PerformanceScheduleItem) => {
    setEditingActId(item.id);
    setActModalTitle(item.title);
    setActModalDate(item.date || '2026-09-14');
    setActModalTime(item.time);
    setActModalDuration(item.duration || '15 Mins');
    setActModalCategory(item.category || 'Cultural Performance');
    setActModalPerformers(item.performerName || '');
    setActModalFlatNo(item.flatNo || '');
    setActModalDescription(item.description || '');
    setModalFeedback(null);
    setIsActModalOpen(true);
  };

  const handleSaveActModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actModalTitle.trim() || !actModalPerformers.trim()) {
      setModalFeedback('Please provide both Performance Title and Performer / Group Name.');
      return;
    }

    if (editingActId) {
      updateCustomCulturalAct(editingActId, {
        performanceTitle: actModalTitle.trim(),
        date: actModalDate,
        timeSlot: actModalTime.trim(),
        durationMins: actModalDuration.trim(),
        actCategory: actModalCategory.trim(),
        performers: actModalPerformers.trim(),
        flatNo: actModalFlatNo.trim(),
        description: actModalDescription.trim(),
      });
    } else {
      addCustomCulturalAct({
        performanceTitle: actModalTitle.trim(),
        date: actModalDate,
        timeSlot: actModalTime.trim(),
        durationMins: actModalDuration.trim(),
        actCategory: actModalCategory.trim(),
        performers: actModalPerformers.trim(),
        flatNo: actModalFlatNo.trim(),
        description: actModalDescription.trim(),
      });
    }

    setIsActModalOpen(false);
    loadLiveCultural();
  };

  const handleConfirmDelete = () => {
    if (!deletingAct) return;
    deleteCustomCulturalAct({
      id: deletingAct.id,
      date: deletingAct.date,
      performanceTitle: deletingAct.title,
      performers: deletingAct.performerName,
      description: deletingAct.description,
      durationMins: deletingAct.duration,
      flatNo: deletingAct.flatNo,
    });
    setDeletingAct(null);
    loadLiveCultural();
  };

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
            filteredItems.map((item) => {
              const isPendingTime =
                !item.time ||
                item.time.toLowerCase().includes('pending') ||
                item.time.toLowerCase().includes('tbd') ||
                item.time.toLowerCase().includes('slot') ||
                item.time.toLowerCase().includes('confirmation');

              return (
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

                    <div className={`timeline-time-label ${isPendingTime ? 'is-pending' : ''}`}>
                      {isPendingTime ? (
                        <div className="time-badge-inner pending-slot-badge" title="Slot Pending Confirmation">
                          <span className="time-pending-top">SLOT</span>
                          <span className="time-pending-bot">TBD</span>
                        </div>
                      ) : (
                        (() => {
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
                        })()
                      )}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', flex: 1 }}>
                        <h3 className="timeline-card-title" style={{ margin: 0 }}>{item.title}</h3>
                        {isPendingTime && (
                          <span className="slot-pending-pill" title="Timing will be slotted by committee">
                            <Clock size={11} />
                            <span>Slot Pending</span>
                          </span>
                        )}
                        {item.duration && (
                          <span className="duration-pill">
                            <Clock size={12} />
                            <span>{item.duration}</span>
                          </span>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="timeline-card-actions">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="btn-card-action-edit"
                            title="Edit this performance"
                          >
                            <Pencil size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingAct(item)}
                            className="btn-card-action-delete"
                            title="Delete this performance"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
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
            );
          })
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

      {/* Admin Add / Edit Performance Modal */}
      {isActModalOpen && (
        <div className="cultural-modal-backdrop" onClick={() => setIsActModalOpen(false)}>
          <div className="cultural-modal-container" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#fff7ed',
                    color: '#ea580c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    {editingActId ? 'Edit Performance Act' : 'Add New Performance'}
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Admin Mode • Changes update the live schedule
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsActModalOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {modalFeedback && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                }}
              >
                {modalFeedback}
              </div>
            )}

            <form onSubmit={handleSaveActModal} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Performance Title */}
              <div className="form-field-group">
                <label className="form-label">Performance Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Classical Dance Performance - Ladies"
                  value={actModalTitle}
                  onChange={(e) => setActModalTitle(e.target.value)}
                  required
                />
              </div>

              {/* Date & Category */}
              <div className="form-grid-2col">
                <div className="form-field-group">
                  <label className="form-label">Festival Date</label>
                  <select
                    className="form-select"
                    value={actModalDate}
                    onChange={(e) => setActModalDate(e.target.value)}
                  >
                    <option value="2026-09-14">Day 1 • Sep 14</option>
                    <option value="2026-09-15">Day 2 • Sep 15</option>
                    <option value="2026-09-16">Day 3 • Sep 16</option>
                    <option value="2026-09-17">Day 4 • Sep 17</option>
                    <option value="2026-09-18">Day 5 • Sep 18</option>
                    <option value="2026-09-19">Day 6 • Sep 19</option>
                  </select>
                </div>

                <div className="form-field-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={actModalCategory}
                    onChange={(e) => setActModalCategory(e.target.value)}
                  >
                    {ACT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time Slot & Duration */}
              <div className="form-grid-2col">
                <div className="form-field-group">
                  <label className="form-label">Time Slot</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 08:30 PM - 08:50 PM"
                    value={actModalTime}
                    onChange={(e) => setActModalTime(e.target.value)}
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-label">Duration</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 15 Mins"
                    value={actModalDuration}
                    onChange={(e) => setActModalDuration(e.target.value)}
                  />
                </div>
              </div>

              {/* Performer Name & Flat No */}
              <div className="form-grid-2col">
                <div className="form-field-group">
                  <label className="form-label">Performer(s) / Group *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Chinni Vedya / Society Ladies"
                    value={actModalPerformers}
                    onChange={(e) => setActModalPerformers(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-label">Flat No / Resident</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. B404 / Multiple Flats"
                    value={actModalFlatNo}
                    onChange={(e) => setActModalFlatNo(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-field-group">
                <label className="form-label">Description / Synopsis</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  placeholder="Details about the performance..."
                  value={actModalDescription}
                  onChange={(e) => setActModalDescription(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsActModalOpen(false)}
                  style={{
                    flex: 1,
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '0.65rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1.5,
                    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.65rem',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)',
                  }}
                >
                  {editingActId ? 'Save Changes' : 'Add Performance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAct && (
        <div className="cultural-modal-backdrop" onClick={() => setDeletingAct(null)}>
          <div className="cultural-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}
              >
                <AlertTriangle size={24} />
              </div>

              <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Delete Performance?
              </h3>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.84rem', color: '#64748b', lineHeight: 1.4 }}>
                Are you sure you want to delete <strong style={{ color: '#0f172a' }}>"{deletingAct.title}"</strong> ({deletingAct.performerName}) from the cultural schedule?
              </p>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setDeletingAct(null)}
                  style={{
                    flex: 1,
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '0.65rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  style={{
                    flex: 1.2,
                    background: '#dc2626',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.65rem',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                  }}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Nav (Standalone only) */}
      {!embedded && <GaneshBottomNav />}
    </div>
  );
};

