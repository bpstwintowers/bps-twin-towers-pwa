import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Search,
  ChevronDown,
  Sparkles,
  Users,
  CheckCircle,
  Filter,
  Award,
  TrendingUp,
  Receipt,
  DollarSign,
  Building2,
  QrCode,
  HeartHandshake,
  Plus,
  Edit2,
} from 'lucide-react';
import {
  fetchPublishedEvents,
  type EventItem,
} from '../../services/supabase/eventService';
import { resolveUserAccess, type AccessInfo } from '../../services/supabase/registrationService';
import { PoojaBookingModal } from './PoojaBookingModal';
import { useSearch } from '../../context/SearchContext';
import {
  getGaneshContributions,
  getGaneshExpenses,
  getGaneshSankalpams,
  calculateGaneshSummary,
} from '../../services/ganeshService';
import type {
  GaneshContributionRecord,
  GaneshExpenseRecord,
  GaneshFinancialSummary,
  GaneshSankalpamRecord,
} from '../../types/ganesh';
import { GaneshPaymentModal } from '../ganesh/components/GaneshPaymentModal';
import { GaneshSankalpamForm } from '../ganesh/components/GaneshSankalpamForm';
import { GaneshFlatPromptModal } from '../ganesh/components/GaneshFlatPromptModal';
import './EventList.css';

const CATEGORIES = [
  { label: 'Category: All', value: 'ALL' },
  { label: 'Festival & Celebrations', value: 'Festival' },
  { label: 'Cultural & Music', value: 'Cultural' },
  { label: 'Sports & Games', value: 'Sports' },
  { label: 'Religious & Spiritual', value: 'Religious' },
  { label: 'Kids & Teens', value: 'Kids' },
  { label: 'Society Meetings', value: 'Meeting' },
];

const SORT_OPTIONS = [
  { label: 'Sort: Date (Nearest First)', value: 'date_asc' },
  { label: 'Sort: Date (Latest First)', value: 'date_desc' },
  { label: 'Sort: Name (A - Z)', value: 'name_asc' },
  { label: 'Sort: Most Popular', value: 'popular' },
];

// Fallback high-res festive imagery if banner_url is not set
const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  Festival: 'https://images.unsplash.com/photo-1567591370504-20a89d1ec86e?w=800&auto=format&fit=crop&q=80',
  Cultural: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&auto=format&fit=crop&q=80',
  Sports: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=800&auto=format&fit=crop&q=80',
  Religious: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800&auto=format&fit=crop&q=80',
  Kids: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=800&auto=format&fit=crop&q=80',
  Meeting: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop&q=80',
  Default: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
};

// Preset contribution / participation metadata simulation
const EVENT_STATS_MAP: Record<string, { raised: number; target: number; contributors: number }> = {
  'Ganesh Chaturthi Festivities': { raised: 221546, target: 350000, contributors: 103 },
  'Diwali Grand Celebration': { raised: 45000, target: 200000, contributors: 85 },
  'Milad-un-Nabi Gathering': { raised: 30000, target: 40000, contributors: 62 },
  'Independence Day Carnival': { raised: 35000, target: 35000, contributors: 180 },
  'Community Sports Day': { raised: 25000, target: 50000, contributors: 50 },
  'Navratri Festival Dandiya': { raised: 110000, target: 150000, contributors: 135 },
};

const ITEMS_PER_PAGE = 6;

export const EventList: React.FC = () => {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, setSearchPlaceholder } = useSearch();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('date_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeAccess, setActiveAccess] = useState<AccessInfo[]>([]);
  const [isPoojaModalOpen, setIsPoojaModalOpen] = useState(false);

  // Ganesh Festival Real-Time State
  const [contributions, setContributions] = useState<GaneshContributionRecord[]>([]);
  const [expenses, setExpenses] = useState<GaneshExpenseRecord[]>([]);
  const [sankalpams, setSankalpams] = useState<GaneshSankalpamRecord[]>([]);
  const [summary, setSummary] = useState<GaneshFinancialSummary | null>(null);

  // User Flat State
  const [userFlat, setUserFlat] = useState<string>(() => {
    return localStorage.getItem('bps_ganesh_user_flat') || '';
  });
  const [isFlatPromptOpen, setIsFlatPromptOpen] = useState(false);

  // Ganesh Modals
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [isGothramModalOpen, setIsGothramModalOpen] = useState(false);

  const loadGaneshData = () => {
    const cList = getGaneshContributions();
    const eList = getGaneshExpenses();
    const sList = getGaneshSankalpams();
    const sum = calculateGaneshSummary();

    setContributions(cList);
    setExpenses(eList);
    setSankalpams(sList);
    setSummary(sum);
  };

  useEffect(() => {
    loadGaneshData();
    const storedFlat = localStorage.getItem('bps_ganesh_user_flat');
    if (!storedFlat) {
      // If user hasn't set one yet, default to A8110 or prompt
      localStorage.setItem('bps_ganesh_user_flat', 'A8110');
      setUserFlat('A8110');
    }
  }, []);

  const activeFlatNumber = userFlat || (activeAccess[0]?.flat_number || 'A8110');

  const userContributions = useMemo(() => {
    if (!activeFlatNumber) return [];
    return contributions.filter(
      (c) => c.flatNo && c.flatNo.trim().toUpperCase() === activeFlatNumber.trim().toUpperCase()
    );
  }, [contributions, activeFlatNumber]);

  const mySankalpam = useMemo(() => {
    if (!activeFlatNumber) return null;
    const target = activeFlatNumber.trim().toUpperCase().replace('-', '');
    return (
      sankalpams.find((s) => {
        if (!s.flatNo) return false;
        const f = s.flatNo.trim().toUpperCase().replace('-', '');
        return f === target;
      }) || null
    );
  }, [sankalpams, activeFlatNumber]);

  const progressPercentage = summary
    ? Math.min(100, Math.round((summary.totalCollections / summary.targetBudget) * 100))
    : 63;

  useEffect(() => {
    setSearchPlaceholder('Search community events...');
  }, [setSearchPlaceholder]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const [eventsData, accessData] = await Promise.all([
        fetchPublishedEvents(selectedCategory === 'ALL' ? undefined : selectedCategory, searchQuery),
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

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEvents();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter by upcoming / past & sort
  const filteredAndSortedEvents = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return events
      .filter((ev) => {
        const isPast = ev.start_date < todayStr || ev.status === 'Completed';
        if (activeTab === 'upcoming') {
          return !isPast || ev.status === 'Published' || ev.status === 'Registration Open';
        } else {
          return isPast || ev.status === 'Completed';
        }
      })
      .sort((a, b) => {
        if (selectedSort === 'date_asc') {
          return a.start_date.localeCompare(b.start_date);
        }
        if (selectedSort === 'date_desc') {
          return b.start_date.localeCompare(a.start_date);
        }
        if (selectedSort === 'name_asc') {
          return a.title.localeCompare(b.title);
        }
        if (selectedSort === 'popular') {
          return (b.confirmed_count || 0) - (a.confirmed_count || 0);
        }
        return 0;
      });
  }, [events, activeTab, selectedSort]);

  // Pagination calculation
  const totalItems = filteredAndSortedEvents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = filteredAndSortedEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const formatEventDate = (dateStr: string, timeStr?: string) => {
    try {
      const d = new Date(dateStr);
      const formattedDate = d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
      let formattedTime = '6:00 PM onwards';
      if (timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedH = h % 12 || 12;
        formattedTime = `${formattedH}:${minutes || '00'} ${ampm} onwards`;
      }
      return `${formattedDate} • ${formattedTime}`;
    } catch {
      return dateStr;
    }
  };

  const getEventBannerUrl = (event: EventItem) => {
    if (event.banner_url) return event.banner_url;
    return DEFAULT_CATEGORY_IMAGES[event.category] || DEFAULT_CATEGORY_IMAGES.Default;
  };

  const getEventStatusBadge = (event: EventItem) => {
    if (event.status === 'Completed') {
      return <span className="event-status-pill-badge completed">Completed</span>;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (event.start_date === todayStr || event.status === 'Registration Open') {
      return <span className="event-status-pill-badge active">Active</span>;
    }
    return <span className="event-status-pill-badge upcoming">Upcoming</span>;
  };

  const getEventBudgetProgress = (event: EventItem) => {
    const stats = EVENT_STATS_MAP[event.title] || {
      raised: (event.confirmed_count || 5) * 500,
      target: (event.capacity || 100) * 500,
      contributors: event.confirmed_count || 42,
    };

    const pct = Math.min(100, Math.round((stats.raised / (stats.target || 1)) * 100));

    return {
      raisedFormatted: `₹${stats.raised.toLocaleString('en-IN')}`,
      targetFormatted: `₹${stats.target.toLocaleString('en-IN')}`,
      percentage: pct,
      contributors: stats.contributors,
    };
  };

  const primaryFlat = activeAccess[0];

  return (
    <div className="events-container animate-fade-in">
      {/* =========================================================================
          1. TOP CONTROLS & FILTER BAR
         ========================================================================= */}
      <div className="events-top-bar">
        <div className="events-bar-left">
          {/* Segmented Upcoming / Past Tabs */}
          <div className="segmented-time-tabs">
            <button
              type="button"
              className={`segmented-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('upcoming');
                setCurrentPage(1);
              }}
            >
              Upcoming
            </button>
            <button
              type="button"
              className={`segmented-tab-btn ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('past');
                setCurrentPage(1);
              }}
            >
              Past
            </button>
          </div>
        </div>

        <div className="events-bar-right">

          {/* Category Dropdown */}
          <div className="event-filter-dropdown-wrap">
            <select
              className="event-filter-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="filter-select-arrow" />
          </div>

          {/* Sort Dropdown */}
          <div className="event-filter-dropdown-wrap">
            <select
              className="event-filter-select"
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="filter-select-arrow" />
          </div>

          {/* Puja Slot Action */}
          <button
            type="button"
            className="btn-book-puja-slot"
            onClick={() => setIsPoojaModalOpen(true)}
          >
            <Sparkles size={15} />
            <span>Book Puja Slot</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. LIVE GANESH UTSAV FINANCIAL SUMMARY & KPI METRICS (4 CARDS)
         ========================================================================= */}
      {summary && (
        <div className="event-metrics-grid">
          {/* Card 1: Total Collections */}
          <div className="metric-stat-card">
            <div className="metric-icon-circle gold">
              <Award size={22} />
            </div>
            <div className="metric-stat-content">
              <span className="metric-stat-label">TOTAL COLLECTIONS</span>
              <div className="metric-stat-value" style={{ color: '#b45309' }}>
                ₹{summary.totalCollections.toLocaleString('en-IN')}
              </div>
              <span className="metric-stat-subtext">
                {summary.totalContributorsCount} Residents + {summary.totalSponsorsCount} Sponsors
              </span>
            </div>
          </div>

          {/* Card 2: Target Festival Budget */}
          <div className="metric-stat-card">
            <div className="metric-icon-circle orange">
              <TrendingUp size={22} />
            </div>
            <div className="metric-stat-content">
              <span className="metric-stat-label">TARGET FESTIVAL BUDGET</span>
              <div className="metric-stat-value">
                ₹{summary.targetBudget.toLocaleString('en-IN')}
              </div>
              <span className="metric-stat-subtext">{progressPercentage}% Target Achieved</span>
            </div>
          </div>

          {/* Card 3: Expenses Incurred */}
          <div className="metric-stat-card">
            <div className="metric-icon-circle rose">
              <Receipt size={22} />
            </div>
            <div className="metric-stat-content">
              <span className="metric-stat-label">EXPENSES INCURRED</span>
              <div className="metric-stat-value" style={{ color: '#be123c' }}>
                ₹{summary.totalExpenses.toLocaleString('en-IN')}
              </div>
              <span className="metric-stat-subtext">{expenses.length} Verified Invoices</span>
            </div>
          </div>

          {/* Card 4: Net Surplus Balance */}
          <div className="metric-stat-card">
            <div className="metric-icon-circle emerald">
              <DollarSign size={22} />
            </div>
            <div className="metric-stat-content">
              <span className="metric-stat-label">NET SURPLUS BALANCE</span>
              <div
                className="metric-stat-value"
                style={{ color: summary.netBalance >= 0 ? '#047857' : '#e11d48' }}
              >
                ₹{summary.netBalance.toLocaleString('en-IN')}
              </div>
              <span className="metric-stat-subtext">Available Festival Reserve</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. COMMUNITY FUNDING GOAL PROGRESS & TOWER SPLIT
         ========================================================================= */}
      {summary && (
        <div className="event-funding-card">
          <div className="event-funding-header">
            <div className="event-funding-title">
              <TrendingUp size={18} color="#ea580c" />
              <span>Community Funding Goal Progress</span>
            </div>
            <div className="event-funding-pct">
              ₹{summary.totalCollections.toLocaleString('en-IN')} of ₹
              {summary.targetBudget.toLocaleString('en-IN')} ({progressPercentage}%)
            </div>
          </div>

          <div className="event-funding-track">
            <div className="event-funding-fill" style={{ width: `${progressPercentage}%` }} />
          </div>

          <div className="event-tower-split-row">
            <div className="event-tower-pill tower-a">
              <Building2 size={15} /> Tower A: ₹{summary.towerAAmount.toLocaleString('en-IN')} (
              {summary.towerACount} Flats)
            </div>
            <div className="event-tower-pill tower-b">
              <Building2 size={15} /> Tower B: ₹{summary.towerBAmount.toLocaleString('en-IN')} (
              {summary.towerBCount} Flats)
            </div>
            <div className="event-gothram-count-text">
              🙏 {summary.sankalpamCount} Families Registered with Gothram
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. UNIFIED RESIDENT FLAT DASHBOARD CARD
         ========================================================================= */}
      {activeFlatNumber && (
        <div className="flat-dashboard-card animate-fade-in">
          {/* Header */}
          <div className="flat-dashboard-header">
            <div className="flat-dashboard-title-wrap">
              <span style={{ fontSize: '1.4rem' }}>🌟</span>
              <div>
                <h3 className="flat-dashboard-title">
                  Flat {activeFlatNumber.toUpperCase()} • Contributions & Sponsorships
                </h3>
                <span className="flat-dashboard-subtitle">
                  {userContributions.length > 0
                    ? `${userContributions.length} contribution entry recorded for your flat`
                    : 'No contributions recorded yet for your flat'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={() => setIsFlatPromptOpen(true)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #fdba74',
                  color: '#c2410c',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Edit2 size={12} /> Switch Flat
              </button>

              {userContributions.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#ffffff',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '20px',
                    border: '1.5px solid #fdba74',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: '#9a3412', fontWeight: 600 }}>Total:</span>
                  <strong style={{ fontSize: '1.1rem', color: '#ea580c' }}>
                    ₹{userContributions.reduce((s, c) => s + (c.amount || 0), 0).toLocaleString('en-IN')}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* User Contributions List (if any) or Call-to-Action buttons (if no contributions yet) */}
          {userContributions.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '0.65rem',
                marginTop: '0.85rem',
              }}
            >
              {userContributions.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '0.75rem 0.95rem',
                    border: '1px solid #fed7aa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>{item.donorName}</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      {item.isSponsor ? `🎖️ Sponsor: ${item.sponsorCategory || 'Pooja Sponsor'}` : item.contributionType || 'General Contribution'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ea580c' }}>
                      ₹{item.amount.toLocaleString('en-IN')}
                    </div>
                    {item.verified && (
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>● Verified</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flat-action-box">
              <div>
                <div className="flat-action-text-title">Join the Grand Utsav Celebration</div>
                <div className="flat-action-text-sub">
                  Support festival arrangements with voluntary contribution or seva sponsorship
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(true)}
                  className="btn-flat-qr"
                >
                  <QrCode size={15} /> Contribute via QR Code
                </button>

                <button
                  type="button"
                  onClick={() => setIsSponsorModalOpen(true)}
                  className="btn-flat-sponsor"
                >
                  <Sparkles size={15} /> Become a Sponsor
                </button>
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: '1.5px dashed #fdba74', margin: '0.85rem 0' }} />

          {/* Sankalpam Section */}
          {mySankalpam ? (
            <div className="flat-sankalpam-section">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🙏</span>
                  <h4 style={{ margin: 0, color: '#92400e', fontSize: '0.98rem', fontWeight: 800 }}>
                    Gothram: {mySankalpam.gothram}
                  </h4>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#b45309', marginBottom: '0.35rem' }}>
                  {mySankalpam.familyMembers?.length || 0} family members registered for daily Sankalpam
                </div>
                {mySankalpam.familyMembers && mySankalpam.familyMembers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {mySankalpam.familyMembers.map((m) => (
                      <span
                        key={m.id}
                        style={{
                          background: '#ffffff',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          color: '#78350f',
                          border: '1px solid #fed7aa',
                        }}
                      >
                        {m.name} ({m.relationship})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsGothramModalOpen(true)}
                className="btn-flat-gothram"
              >
                <Edit2 size={13} /> Edit Gothram & Family
              </button>
            </div>
          ) : (
            <div className="flat-sankalpam-section">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🙏</span>
                  <strong style={{ color: '#92400e', fontSize: '0.92rem' }}>
                    Flat {activeFlatNumber.toUpperCase()} is not yet registered for Sankalpam
                  </strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#78350f', marginTop: '0.2rem' }}>
                  Register your Gothram and family members for daily puja chanting & blessings.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGothramModalOpen(true)}
                className="btn-flat-gothram"
              >
                + Register Gothram for Flat {activeFlatNumber.toUpperCase()}
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          5. EVENTS 3-COLUMN CARDS GRID
         ========================================================================= */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>Loading community events...</div>
        </div>
      ) : paginatedEvents.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3.5rem 1rem',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
          }}
        >
          <Calendar size={44} style={{ color: '#94a3b8', margin: '0 auto 0.75rem', display: 'block' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.35rem' }}>
            No Events Found
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '420px', margin: '0 auto' }}>
            No community events match your search or filter criteria. Try switching between Upcoming and Past or clearing your search.
          </p>
        </div>
      ) : (
        <div className="events-card-grid">
          {paginatedEvents.map((event) => {
            const progress = getEventBudgetProgress(event);

            return (
              <div
                key={event.id}
                className="event-item-card"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                {/* Image Banner with Status Overlay */}
                <div className="event-card-media">
                  <img
                    src={getEventBannerUrl(event)}
                    alt={event.title}
                    className="event-banner-image"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        DEFAULT_CATEGORY_IMAGES[event.category] || DEFAULT_CATEGORY_IMAGES.Default;
                    }}
                  />
                  {getEventStatusBadge(event)}
                </div>

                {/* Card Content */}
                <div className="event-card-main-body">
                  <h3 className="event-item-title" title={event.title}>
                    {event.title}
                  </h3>

                  <div className="event-item-datetime">
                    <Calendar size={13} style={{ color: '#00897b', flexShrink: 0 }} />
                    <span>{formatEventDate(event.start_date, event.start_time)}</span>
                  </div>

                  <p className="event-item-description">
                    {event.description ||
                      'Join fellow residents and family members for this festive community gathering with special arrangements.'}
                  </p>

                  {/* Funding & Registration Progress Bar */}
                  <div className="event-progress-section">
                    <div className="event-progress-numbers">
                      <span className="event-progress-left">
                        {progress.raisedFormatted} / {progress.targetFormatted}
                      </span>
                      <span className="event-progress-pct">{progress.percentage}%</span>
                    </div>

                    <div className="event-progress-track">
                      <div
                        className="event-progress-fill"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>

                    <div className="event-progress-contributors">
                      • {progress.contributors} active contributors
                    </div>
                  </div>

                  {/* View Details Action Button */}
                  <button
                    type="button"
                    className="btn-event-view-details"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/events/${event.id}`);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          3. PAGINATION FOOTER
         ========================================================================= */}
      {totalItems > 0 && (
        <div className="events-pagination-footer">
          <div className="events-pagination-count">
            Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems} community events
          </div>

          <div className="events-pagination-nav">
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={`pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* POOJA MODAL */}
      <PoojaBookingModal
        isOpen={isPoojaModalOpen}
        onClose={() => setIsPoojaModalOpen(false)}
        flatId={primaryFlat?.flat_id}
        flatNumber={primaryFlat?.flat_number}
      />

      {/* GANESH PAYMENT MODAL */}
      <GaneshPaymentModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onSuccess={() => {
          setIsPayModalOpen(false);
          loadGaneshData();
        }}
        isSponsorship={false}
      />

      {/* GANESH SPONSOR MODAL */}
      <GaneshPaymentModal
        isOpen={isSponsorModalOpen}
        onClose={() => setIsSponsorModalOpen(false)}
        onSuccess={() => {
          setIsSponsorModalOpen(false);
          loadGaneshData();
        }}
        isSponsorship={true}
      />

      {/* GANESH GOTHRAM SANKALPAM MODAL */}
      {isGothramModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setIsGothramModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <GaneshSankalpamForm
              sankalpams={sankalpams}
              contributions={contributions}
              expenses={expenses}
              userFlat={activeFlatNumber}
              userName=""
              isAddModalOpen={true}
              onCloseAddModal={() => setIsGothramModalOpen(false)}
              onRefresh={() => {
                loadGaneshData();
                setIsGothramModalOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* GANESH FLAT PROMPT MODAL */}
      <GaneshFlatPromptModal
        isOpen={isFlatPromptOpen}
        onClose={() => setIsFlatPromptOpen(false)}
        currentFlat={activeFlatNumber}
        onSelectFlat={(flat: string) => {
          setUserFlat(flat);
          localStorage.setItem('bps_ganesh_user_flat', flat);
          setIsFlatPromptOpen(false);
        }}
      />
    </div>
  );
};
