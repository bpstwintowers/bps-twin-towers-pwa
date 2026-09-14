import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { GaneshBottomNav } from './components/GaneshBottomNav';
import { HeaderNavbar } from './components/HeaderNavbar';
import { fetchLiveMasterPrasadam, type LiveMasterPrasadamItem } from '../../services/liveSheetService';
import './GaneshPrasadam.css';

interface PrasadamDay {
  day: number;
  date: string;
  weekday: string;
  categoryTag: string;
  categoryType: 'cultural' | 'daily' | 'bhog' | 'tiffin' | 'laddu';
  title: string;
  mealHeader: string;
  mainDish: string;
  accompaniments: string;
  timing: string;
  timingContext: string;
  location: string;
  sponsorText: string;
  sponsorStatus: string;
  isGrandFeast?: boolean;
}

interface GaneshPrasadamPageProps {
  embedded?: boolean;
  onBackToHome?: () => void;
}

function parseDishItems(mainDish: string): string[] {
  if (!mainDish) return [];
  return mainDish
    .split(/[,;\n•\+]|\s{2,}/)
    .map((s) => {
      let cleaned = s.trim();
      // Remove any header-like prefix like "Traditional 14-Item", "Traditional 14-Item Satvik Feast:", etc.
      cleaned = cleaned.replace(/^Traditional\s*\d*[- ]*(?:item|items)?(?:\s+satvik)?(?:\s+royal)?(?:\s+feast)?[:\s-]*/i, '').trim();
      return cleaned;
    })
    .filter((s) => s.length > 0 && !/^traditional\s*\d*[- ]*(?:item|items)?$/i.test(s));
}

function getDishIcon(dish: string, index: number): string {
  const d = dish.toLowerCase();
  if (d.includes('pulihora') || d.includes('tamarind')) return '🍚';
  if (d.includes('ghee rice') || d.includes('biryani') || d.includes('pulao') || d.includes('bath') || d.includes('rice')) return '🍲';
  if (d.includes('salan') || d.includes('mirchi') || d.includes('curry') || d.includes('gravy') || d.includes('sambar')) return '🍛';
  if (d.includes('paneer') || d.includes('makhani') || d.includes('palya') || d.includes('subji') || d.includes('poriyal')) return '🧀';
  if (d.includes('rasam') || d.includes('soup') || d.includes('shorba')) return '🥣';
  if (d.includes('daddojanam') || d.includes('dadojanam') || d.includes('curd') || d.includes('raita') || d.includes('buttermilk')) return '🥛';
  if (d.includes('sweet') || d.includes('jamun') || d.includes('payasam') || d.includes('laddu') || d.includes('halwa') || d.includes('kheer') || d.includes('jalebi')) return '🍧';
  if (d.includes('vada') || d.includes('wada') || d.includes('appalam') || d.includes('papad') || d.includes('bajji') || d.includes('pakora')) return '🍘';
  if (d.includes('roti') || d.includes('puri') || d.includes('poori') || d.includes('naan') || d.includes('chapati') || d.includes('bonda') || d.includes('idly') || d.includes('idli')) return '🫓';

  const fallbackIcons = ['🍚', '🍲', '🍛', '🧀', '🥣', '🥛', '🥗', '🥘', '🫓', '🍧'];
  return fallbackIcons[index % fallbackIcons.length];
}

function mapLivePrasadamToPrasadamDay(item: LiveMasterPrasadamItem): PrasadamDay {
  const day = item.dayNumber;
  const isGrandFeast = day === 5;

  let weekday = 'Monday';
  let dateFormatted = 'Sep 14, 2026';
  let categoryTag = 'Cultural Dinner';
  let categoryType: 'cultural' | 'daily' | 'bhog' | 'tiffin' | 'laddu' = 'cultural';

  switch (day) {
    case 1:
      dateFormatted = 'Sep 14, 2026';
      weekday = 'Monday';
      categoryTag = 'Cultural Dinner';
      categoryType = 'cultural';
      break;
    case 2:
      dateFormatted = 'Sep 15, 2026';
      weekday = 'Tuesday';
      categoryTag = 'Daily Maha-prasad';
      categoryType = 'daily';
      break;
    case 3:
      dateFormatted = 'Sep 16, 2026';
      weekday = 'Wednesday';
      categoryTag = 'Special Bhog';
      categoryType = 'bhog';
      break;
    case 4:
      dateFormatted = 'Sep 17, 2026';
      weekday = 'Thursday';
      categoryTag = 'Festive Tiffin';
      categoryType = 'tiffin';
      break;
    case 5:
      dateFormatted = 'Sep 18, 2026';
      weekday = 'Friday';
      categoryTag = 'Grand Feast';
      categoryType = 'cultural';
      break;
    case 6:
      dateFormatted = 'Sep 19, 2026';
      weekday = 'Saturday';
      categoryTag = 'Maha Laddu';
      categoryType = 'laddu';
      break;
  }

  const rawDishes = item.menuItems || '';
  const parsedDishes = parseDishItems(rawDishes);
  const courseCount = parsedDishes.length > 0 ? `${parsedDishes.length}-COURSE` : '9-COURSE';

  return {
    day,
    date: item.date || dateFormatted,
    weekday,
    categoryTag,
    categoryType,
    title: item.occasionTitle || (isGrandFeast ? 'Grand Community Maha Prasadam Feast' : `Day ${day} Maha Prasadam`),
    mealHeader: isGrandFeast ? `TRADITIONAL ${courseCount} SATVIK ROYAL MEAL` : 'SATVIK PRASADAM MENU',
    mainDish: item.menuItems || (isGrandFeast ? 'Pulihora (Tamarind Rice), Royal Fragrant Ghee Rice, Hyderabadi Mirchi Salan, Paneer Makhani (No Onion), Traditional Tomato Rasam, Satvik Daddojanam' : 'Hot Maha Prasadam'),
    accompaniments: item.specialHighlight?.replace(/^Special Sweet:\s*/i, '') || (isGrandFeast ? 'Authentic Warm Gulaab Jamun (2 Pcs)' : ''),
    timing: item.mealType || (isGrandFeast ? 'Grand Feast Lunch (12:30 PM – 4:00 PM)' : 'Night Dinner (From 9:00 PM)'),
    timingContext: isGrandFeast ? 'Lunch Banquet Pandal' : (item.specialHighlight || 'Post Evening Aarti'),
    location: isGrandFeast ? 'Central Festival Ground Lunch Banquet Pandal' : 'Central Pandal Dining Hall',
    sponsorText: item.sponsorName
      ? (item.sponsorName.toLowerCase().startsWith('sponsor') || item.sponsorName.toLowerCase().startsWith('grand community')
          ? item.sponsorName
          : `Grand Community: ${item.sponsorName}`)
      : (isGrandFeast ? 'Grand Community: BPS Management & All Resident Donors' : 'Community Seva'),
    sponsorStatus: item.sponsorName
      ? (item.sponsorName.toLowerCase().includes('seva') ? 'COMMUNITY SEVA' : 'Sponsored')
      : (isGrandFeast ? 'COMMUNITY SEVA' : 'Community Seva'),
    isGrandFeast,
  };
}

const PRASADAM_SCHEDULE_DATA: PrasadamDay[] = [
  {
    day: 1,
    date: 'Sep 14, 2026',
    weekday: 'Monday',
    categoryTag: 'Cultural Dinner',
    categoryType: 'cultural',
    title: 'Ganesh Sthapana Day',
    mealHeader: 'SATVIK PRASADAM MENU',
    mainDish: 'Hot Pongal & Dadojanam (Curd Rice)',
    accompaniments: 'Day 1 Dinner served post cultural dance',
    timing: 'Night Dinner (From 9:15 PM)',
    timingContext: 'Post Cultural Dancers',
    location: 'Central Pandal Dining Hall',
    sponsorText: 'Sponsor: Tower A Residents',
    sponsorStatus: 'Fully Sponsored',
  },
  {
    day: 2,
    date: 'Sep 15, 2026',
    weekday: 'Tuesday',
    categoryTag: 'Daily Maha-prasad',
    categoryType: 'daily',
    title: 'Veda Parayanam Day',
    mealHeader: 'SATVIK PRASADAM MENU',
    mainDish: 'Kichidi & Curd Rice',
    accompaniments: 'Day 2 Dinner: Kichidi & Curd Rice',
    timing: 'Night Dinner (From 9:00 PM)',
    timingContext: 'Post Parayanam Recital',
    location: 'Central Pandal Dining Hall',
    sponsorText: 'Sponsor: K. Srinivasan (A-402)',
    sponsorStatus: 'Sponsored',
  },
  {
    day: 3,
    date: 'Sep 16, 2026',
    weekday: 'Wednesday',
    categoryTag: 'Special Bhog',
    categoryType: 'bhog',
    title: 'Lakshmi Ganapathi Homam Day',
    mealHeader: 'SATVIK PRASADAM MENU',
    mainDish: 'Hot Sambar Rice & Curd Rice',
    accompaniments: 'Day 3 Dinner: Sambar Rice & Curd Rice',
    timing: 'Night Dinner (From 9:00 PM)',
    timingContext: 'Post Evening Purnahuthi',
    location: 'Central Pandal Dining Hall',
    sponsorText: 'Sponsor: Rajesh Verma (B-605)',
    sponsorStatus: 'Sponsored',
  },
  {
    day: 4,
    date: 'Sep 17, 2026',
    weekday: 'Thursday',
    categoryTag: 'Festive Tiffin',
    categoryType: 'tiffin',
    title: 'Special Tiffin Night',
    mealHeader: 'SATVIK PRASADAM MENU',
    mainDish: 'Hot Idly, Medu Wada, Mysore Bonda with Sambar & Chutneys',
    accompaniments: 'Day 4 Tiffin Feast',
    timing: 'Night Dinner (From 9:00 PM)',
    timingContext: 'Community Dining Area',
    location: 'Central Pandal Dining Hall',
    sponsorText: 'Sponsor: BPS Youth Wing',
    sponsorStatus: 'Sponsored',
  },
  {
    day: 5,
    date: 'Sep 18, 2026',
    weekday: 'Friday',
    categoryTag: 'Grand Feast',
    categoryType: 'cultural',
    title: 'Grand Community Maha Prasadam Feast',
    mealHeader: 'TRADITIONAL 9-COURSE SATVIK ROYAL MEAL',
    mainDish: 'Pulihora (Tamarind Rice), Royal Fragrant Ghee Rice, Hyderabadi Mirchi Salan, Paneer Makhani (No Onion), Traditional Tomato Rasam, Satvik Daddojanam',
    accompaniments: 'Authentic Warm Gulaab Jamun (2 Pcs)',
    timing: 'Grand Feast Lunch (12:30 PM – 4:00 PM)',
    timingContext: 'Lunch Banquet Pandal',
    location: 'Central Festival Ground Lunch Banquet Pandal',
    sponsorText: 'Grand Community: BPS Management & All Resident Donors',
    sponsorStatus: 'COMMUNITY SEVA',
    isGrandFeast: true,
  },
  {
    day: 6,
    date: 'Sep 19, 2026',
    weekday: 'Saturday',
    categoryTag: 'Maha Laddu',
    categoryType: 'laddu',
    title: 'Visarjan Farewell & Maha Laddu',
    mealHeader: 'SACRED PRASADAM DISTRIBUTION',
    mainDish: 'Maha Visarjan Packed Prasadam Boxes + Sacred 21-Kg Maha Laddu',
    accompaniments: 'Maha Laddu Distribution post-auction',
    timing: 'Visarjan Packed Prasadam',
    timingContext: 'Before Visarjan Procession',
    location: 'Central Pandal & Door-to-Door Delivery',
    sponsorText: 'Sponsor: Visarjan Donors',
    sponsorStatus: 'Blessed Prasad',
  },
];

export const GaneshPrasadamPage: React.FC<GaneshPrasadamPageProps> = ({ embedded = false, onBackToHome }) => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState<number | 'all'>('all');
  const [prasadamData, setPrasadamData] = useState<PrasadamDay[]>(PRASADAM_SCHEDULE_DATA);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const loadLivePrasadam = async () => {
    setIsSyncing(true);
    try {
      const liveItems = await fetchLiveMasterPrasadam();
      if (liveItems && liveItems.length > 0) {
        const mapped = liveItems.map(mapLivePrasadamToPrasadamDay);
        setPrasadamData(mapped);
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Could not load live Prasadam from Master Portal:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadLivePrasadam();
  }, []);

  const filterTabs = [
    { id: 'all', label: 'All 6 Days' },
    { id: 1, label: 'Day 1 (Sep 14)' },
    { id: 2, label: 'Day 2 (Sep 15)' },
    { id: 3, label: 'Day 3 (Sep 16)' },
    { id: 4, label: 'Day 4 (Sep 17)' },
    { id: 5, label: 'Day 5 (Sep 18)' },
    { id: 6, label: 'Day 6 (Sep 19)' },
  ];

  const displayedDays = prasadamData.filter(
    (item) => selectedFilter === 'all' || item.day === selectedFilter
  );

  return (
    <div className={`prasadam-page-root ${!embedded ? 'has-bottom-nav' : ''}`}>
      {/* Top Navigation Bar for standalone */}
      {!embedded && <HeaderNavbar />}

      <div className="prasadam-container">
        {/* Embedded Back Button */}
        {embedded && onBackToHome && (
          <div style={{ paddingBottom: '0.65rem' }}>
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

        {/* Section Title Row with Live Sync Button */}
        <div className="schedule-section-header" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 className="schedule-title" style={{ margin: 0 }}>
              <span>🍲</span>
              <span>Maha Prasadam Schedule</span>
            </h2>
            {lastSyncTime && (
              <span style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                Master Portal Live Synced {lastSyncTime}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={loadLivePrasadam}
              disabled={isSyncing}
              title="Sync Live with Google Sheets"
              style={{
                background: '#fff7ed',
                border: '1.5px solid #fed7aa',
                borderRadius: '10px',
                padding: '0.35rem 0.65rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#ea580c',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
            <span className="schedule-sessions-badge">6 SESSIONS</span>
          </div>
        </div>

        {/* Horizontal Day Filters */}
        <div className="prasadam-filter-tabs-bar">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`day-filter-chip ${selectedFilter === tab.id ? 'active' : ''}`}
              onClick={() => setSelectedFilter(tab.id as number | 'all')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Daily Schedule Cards */}
        <div className="prasadam-cards-list">
          {displayedDays.map((item) => {
            // Day 5 Grand Maha Prasadam Feast Golden Card (Exact mockup format)
            if (item.day === 5 || item.isGrandFeast) {
              const parsedDishes = parseDishItems(item.mainDish);
              const courseCount = parsedDishes.length > 0 ? parsedDishes.length : 9;

              return (
                <div key={item.day} className="grand-annadanam-golden-card">
                  {/* Header Row */}
                  <div className="card-top-header-row" style={{ marginBottom: '0.75rem' }}>
                    <div className="card-day-meta-left">
                      <div className="card-day-badge-circle">
                        <span>DAY</span>
                        <span>{item.day}</span>
                      </div>
                      <div className="card-date-subtext">
                        {item.date} • {item.weekday}
                      </div>
                    </div>
                    <span className="grand-feast-tag">GRAND FEAST</span>
                  </div>

                  {/* Main Title */}
                  <h3 className="grand-feast-main-title">{item.title}</h3>

                  {/* Dark Navy Lunch / Dinner Banner */}
                  <div className="grand-lunch-navy-banner">
                    <div className="lunch-navy-left">
                      <span>🍲</span>
                      <span>{item.timing}</span>
                    </div>
                  </div>

                  {/* 2-Column Thali Menu Section */}
                  <div className="thali-menu-grid-section">
                    <div className="thali-section-header">
                      <span>{item.mealHeader || `TRADITIONAL ${courseCount}-COURSE SATVIK ROYAL MEAL`}</span>
                    </div>

                    {parsedDishes.length > 1 ? (
                      <div className="thali-items-2col">
                        {parsedDishes.map((dish, idx) => (
                          <div key={idx} className="thali-item-row">
                            <span>{getDishIcon(dish, idx)}</span>
                            <span>{dish}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="thali-items-2col">
                        <div className="thali-item-row" style={{ gridColumn: '1 / -1' }}>
                          <span>🍲</span>
                          <span>{item.mainDish}</span>
                        </div>
                      </div>
                    )}

                    {/* Sweet Box */}
                    {item.accompaniments && (
                      <div className="thali-special-sweet-box">
                        <span>🍧</span>
                        <span>
                          {item.accompaniments.replace(/^Special Sweet:\s*/i, '')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sponsor / Seva Bottom Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', fontWeight: 600 }}>
                      <span>🤝</span>
                      <span>{item.sponsorText}</span>
                    </div>
                    <span style={{ background: '#f0fdf4', color: '#15803d', fontWeight: 800, fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                      {item.sponsorStatus}
                    </span>
                  </div>
                </div>
              );
            }

            // Standard Day Cards (Days 1, 2, 3, 4, 6)
            return (
              <div key={item.day} className="prasadam-schedule-card">
                {/* Header Row */}
                <div className="card-top-header-row">
                  <div className="card-day-meta-left">
                    <div className="card-day-badge-circle">
                      <span>DAY</span>
                      <span>{item.day}</span>
                    </div>
                    <div className="card-date-subtext">
                      {item.date} • {item.weekday}
                    </div>
                  </div>
                  <span className={`card-category-pill ${item.categoryType}`}>
                    {item.categoryTag}
                  </span>
                </div>

                {/* Event Title */}
                <h3 className="card-event-title">{item.title}</h3>

                {/* Satvik Menu Box */}
                <div className="card-prasadam-menu-box">
                  <div className="menu-dish-icon-box">
                    {item.day === 1 && <span>🍲</span>}
                    {item.day === 2 && <span>🌾</span>}
                    {item.day === 3 && <span>🔥</span>}
                    {item.day === 4 && <span>🍱</span>}
                    {item.day === 6 && <span>🪔</span>}
                  </div>
                  <div className="menu-dish-content-wrap">
                    <div className="menu-label-tag">{item.mealHeader}</div>
                    <div className="menu-main-title">{item.mainDish}</div>
                    {item.accompaniments && (
                      <div className="menu-sub-accompaniment">{item.accompaniments}</div>
                    )}
                  </div>
                </div>

                {/* Timing & Context */}
                <div className="card-timing-context-row">
                  <div className="timing-left-item">
                    <Clock size={14} color="#ea580c" />
                    <span>{item.timing}</span>
                  </div>
                  <span className="context-right-item">{item.timingContext}</span>
                </div>

                {/* Sponsor Footer */}
                <div className="card-sponsor-bottom-row">
                  <div className="sponsor-bottom-left">
                    <span>🤝</span>
                    <span>{item.sponsorText}</span>
                  </div>
                  <span className="sponsor-status-tag">{item.sponsorStatus}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Nav for Standalone */}
      {!embedded && <GaneshBottomNav />}
    </div>
  );
};

export default GaneshPrasadamPage;
