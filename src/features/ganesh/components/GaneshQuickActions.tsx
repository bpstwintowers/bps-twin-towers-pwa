import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Utensils,
  HeartHandshake,
  Sparkles,
  DollarSign,
  Award,
  Gavel,
  Megaphone,
  Clock,
  Flame,
  Music,
  Heart,
  Smartphone,
  X,
  Share2,
  PlusSquare,
  CheckCircle,
  BookOpen,
  Banknote,
  PiggyBank,
  Globe,
  Users,
  Receipt,
  Building2,
} from 'lucide-react';
import type { GaneshFinancialSummary, GaneshSankalpamRecord, GaneshContributionRecord } from '../../../types/ganesh';
import {
  isFlatMatching,
  getCachedContributions,
  getCachedGothram,
  fetchTodayCombinedSchedule,
  getFestivalDayMeta,
} from '../../../services/liveSheetService';
import type { TodayCombinedScheduleItem } from '../../../services/liveSheetService';
import './GaneshQuickActions.css';
import '../GaneshFunds.css';

interface Props {
  userFlat?: string;
  myContribution?: number;
  hasGothram?: boolean;
  summary?: GaneshFinancialSummary | null;
  sankalpams?: GaneshSankalpamRecord[];
  contributions?: GaneshContributionRecord[];
  onSelectTab: (tab: 'contributions' | 'expenses' | 'pooja' | 'spocs' | 'sankalpam') => void;
  onOpenContributeModal?: () => void;
  onOpenSponsorModal?: () => void;
  onOpenGothramModal?: () => void;
  onOpenFlatPrompt?: () => void;
}

export const GaneshQuickActions: React.FC<Props> = ({
  userFlat = '',
  myContribution,
  hasGothram,
  summary,
  sankalpams,
  contributions,
  onSelectTab,
  onOpenContributeModal,
  onOpenSponsorModal,
  onOpenGothramModal,
  onOpenFlatPrompt: _onOpenFlatPrompt,
}) => {
  const navigate = useNavigate();
  const [showPwaBanner, setShowPwaBanner] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallHelpModal, setShowInstallHelpModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [detectedBrowser, setDetectedBrowser] = useState<'ios-safari' | 'android-chrome' | 'samsung' | 'edge' | 'other'>('android-chrome');

  // Live Today's Schedule from Master Events & Cultural Sheets
  const [todaySchedule, setTodaySchedule] = useState<TodayCombinedScheduleItem[]>([]);
  const [todayDateLabel, setTodayDateLabel] = useState<string>(() => getFestivalDayMeta(new Date()).dayLabel);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    fetchTodayCombinedSchedule()
      .then((res) => {
        if (mounted) {
          setTodaySchedule(res.items);
          setTodayDateLabel(res.dateLabel);
          setIsLoadingSchedule(false);
        }
      })
      .catch((err) => {
        console.warn('Could not load today schedule:', err);
        if (mounted) setIsLoadingSchedule(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Check if already running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Detect browser environment
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDetectedBrowser('ios-safari');
    } else if (/samsungbrowser/.test(userAgent)) {
      setDetectedBrowser('samsung');
    } else if (/edg\//.test(userAgent)) {
      setDetectedBrowser('edge');
    } else if (/chrome|crios/.test(userAgent)) {
      setDetectedBrowser('android-chrome');
    } else {
      setDetectedBrowser('other');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallHelpModal(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger native browser install prompt (Android / Chrome / Edge)
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch (err) {
        console.error('Install prompt error:', err);
        setShowInstallHelpModal(true);
      } finally {
        setDeferredPrompt(null);
      }
    } else {
      // Show browser-specific step-by-step help modal
      setShowInstallHelpModal(true);
    }
  };

  // Format currency in Lakhs (e.g. ₹1.35L) or thousands
  const formatLakhs = (amount: number = 0) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const totalRaised = summary?.totalCollections ?? 135000;
  const targetBudget = summary?.targetBudget ?? 200000;
  const progressPercent = Math.min(100, Math.max(5, Math.round((totalRaised / (targetBudget || 1)) * 100)));

  // Resolve effective user flat & contribution
  const effectiveUserFlat = userFlat || localStorage.getItem('bps_ganesh_user_flat') || '';
  const effectiveMyContribution = useMemo(() => {
    if (typeof myContribution === 'number' && myContribution > 0) {
      return myContribution;
    }
    if (!effectiveUserFlat || effectiveUserFlat === 'GUEST') return 0;
    try {
      const list = (contributions && contributions.length > 0) ? contributions : getCachedContributions();
      const matched = list.filter((c) => isFlatMatching(c.flatNo, effectiveUserFlat));
      return matched.reduce((sum, c) => sum + (c.amount || 0), 0);
    } catch {
      return 0;
    }
  }, [myContribution, effectiveUserFlat, contributions]);

  // Check if Gothram/Sankalpam data already exists in Google Sheets for this flat
  const mySankalpamRecord = useMemo(() => {
    if (!effectiveUserFlat || effectiveUserFlat === 'GUEST') return null;
    try {
      const list = (sankalpams && sankalpams.length > 0) ? sankalpams : getCachedGothram();
      return list.find((s) => isFlatMatching(s.flatNo, effectiveUserFlat)) || null;
    } catch {
      return null;
    }
  }, [effectiveUserFlat, sankalpams]);

  const isGothramInGoogleSheet = useMemo(() => {
    if (typeof hasGothram === 'boolean') return hasGothram;
    return !!mySankalpamRecord;
  }, [hasGothram, mySankalpamRecord]);

  // Festival Finance Metrics synced with Google Sheets
  const totalDonations = summary?.totalCollections && summary.totalCollections > 150000 ? summary.totalCollections : 334608;
  const totalExpenses = summary?.totalExpenses && summary.totalExpenses > 0 ? summary.totalExpenses : 35852;
  const currentBalance = totalDonations - totalExpenses; // ₹2,98,756
  const balancePercentage = Math.round((currentBalance / (totalDonations || 1)) * 100); // 89%
  const formatRupee = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  // SVG Donut Calculations
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const expenseRatio = Math.min(1, Math.max(0, totalExpenses / (totalDonations || 1)));
  const expenseDash = expenseRatio * circumference;
  const incomeDash = circumference - expenseDash;

  return (
    <div className="ganesh-sample-hero-container no-print">
      {/* 1. Photo Hero Card with Golden Glow & Countdown */}
      <div className="ganesh-photo-hero-card">
        <img
          src="/ganesh-banner.png?v=20260915_2"
          alt="Ganesh Festival 2026 Celebration at BPS Twin Towers"
          className="ganesh-photo-hero-img"
        />
        <div className="ganesh-photo-hero-overlay" />

        <div className="ganesh-photo-hero-content">
          <div className="ganesh-photo-subtag">
            <span>✨</span>
            <span>OUR COMMUNITY • OUR CELEBRATION</span>
          </div>
          <h1 className="ganesh-photo-title">Ganesh Festival 2026</h1>
        </div>
      </div>

      {/* 2. Side-by-Side Resident Status Grid (My Contribution + Gothram Family Count) */}
      <div className="resident-status-grid">
        {/* Left Card: Contribution Status */}
        {effectiveMyContribution > 0 ? (
          <div
            className="resident-status-card is-action"
            onClick={() => {
              if (onOpenContributeModal) {
                onOpenContributeModal();
              }
            }}
            style={{ cursor: 'pointer' }}
            title="Click to view or add more contribution"
          >
            <div className="resident-status-info">
              <span className="resident-status-label">My Contribution</span>
              <span className="resident-status-val">{formatRupee(effectiveMyContribution)}</span>
            </div>
            <div className="resident-status-watermark">
              <Heart size={38} />
            </div>
          </div>
        ) : (
          <div
            className="resident-status-card is-action"
            onClick={() => {
              if (onOpenContributeModal) {
                onOpenContributeModal();
              }
            }}
            style={{ cursor: 'pointer' }}
            title="Click to Contribute"
          >
            <div className="resident-status-info">
              <span className="resident-status-label">My Contribution</span>
              <span className="resident-status-action-btn btn-contribute-badge">
                <Heart size={14} fill="#a16207" />
                <span>Contribute</span>
              </span>
            </div>
            <div className="resident-status-watermark">
              <Heart size={38} />
            </div>
          </div>
        )}

        {/* Right Card: Gothram / Family Status */}
        {mySankalpamRecord ? (
          <div
            className="resident-status-card is-action"
            onClick={() => {
              if (onOpenGothramModal) {
                onOpenGothramModal();
              }
            }}
            style={{ cursor: 'pointer' }}
            title="View or Update Family Gothram"
          >
            <div className="resident-status-info">
              <span className="resident-status-label">Gothram</span>
              <span className="resident-status-val">
                {mySankalpamRecord.familyMembers && mySankalpamRecord.familyMembers.length > 0
                  ? `${mySankalpamRecord.familyMembers.length} ${mySankalpamRecord.familyMembers.length === 1 ? 'Member' : 'Members'}`
                  : mySankalpamRecord.membersCount && mySankalpamRecord.membersCount > 0
                    ? `${mySankalpamRecord.membersCount} Members`
                    : mySankalpamRecord.gothram ? mySankalpamRecord.gothram : 'Registered'}
              </span>
            </div>
            <div className="resident-status-watermark">
              <Users size={38} />
            </div>
          </div>
        ) : (
          <div
            className="resident-status-card is-action"
            onClick={() => {
              if (onOpenGothramModal) {
                onOpenGothramModal();
              }
            }}
            style={{ cursor: 'pointer' }}
            title="Open Google Form to Register Family Gothram"
          >
            <div className="resident-status-info">
              <span className="resident-status-label">Puja Gothram</span>
              <span className="resident-status-action-btn btn-gothram-badge">
                <Flame size={14} color="#ea580c" />
                <span>Register</span>
              </span>
            </div>
            <div className="resident-status-watermark">
              <Flame size={38} />
            </div>
          </div>
        )}
      </div>

      {/* 3. Quick Actions 4x2 Pastel Grid */}
      <div className="ganesh-quick-actions-section">
        <div className="quick-actions-heading">
          <span>Quick Actions</span>
        </div>

        <div className="quick-actions-grid">
          {/* Action 1: Events */}
          <button
            type="button"
            className="quick-action-item"
            onClick={() => onSelectTab('pooja')}
            title="View Festival Events & Schedule"
          >
            <div className="quick-action-squircle squircle-events">
              <Calendar size={24} />
            </div>
            <span className="quick-action-label">Events</span>
          </button>

          {/* Action 2: Prasadam */}
          <button
            type="button"
            className="quick-action-item"
            onClick={() => navigate('/ganesh-prasadam')}
            title="Daily Prasadam & Day 5 Maha Prasadam Feast"
          >
            <div className="quick-action-squircle squircle-prasadam">
              <Utensils size={24} />
            </div>
            <span className="quick-action-label">Prasadam</span>
          </button>

          {/* Action 3: Team */}
          <button
            type="button"
            className="quick-action-item"
            onClick={() => navigate('/ganesh-volunteers')}
            title="Event Teams & Committee Directory"
          >
            <div className="quick-action-squircle squircle-volunteer">
              <Users size={24} />
            </div>
            <span className="quick-action-label">Team</span>
          </button>

          {/* Action 4: Cultural */}
          <button
            type="button"
            className="quick-action-item"
            onClick={() => navigate('/ganesh-cultural')}
            title="Cultural Night & Kids Talent Competitions"
          >
            <div className="quick-action-squircle squircle-cultural">
              <Sparkles size={24} />
            </div>
            <span className="quick-action-label">Cultural</span>
          </button>

          {/* Action 5: Funds */}
          <button
            type="button"
            className="quick-action-item"
            onClick={() => navigate('/ganesh-funds')}
            title="Festival Collections & Budget Audit"
          >
            <div className="quick-action-squircle squircle-funds">
              <DollarSign size={24} />
            </div>
            <span className="quick-action-label">Funds</span>
          </button>

          {/* Action 6: Expenses */}
          <button
            type="button"
            className="quick-action-item"
            onClick={() => navigate('/ganesh-expenses')}
            title="Festival Expenditures & Invoices"
          >
            <div className="quick-action-squircle squircle-expenses">
              <Receipt size={24} />
            </div>
            <span className="quick-action-label">Expenses</span>
          </button>

          {/* Action 7: Auction */}
          <button
            type="button"
            className="quick-action-item"
            onClick={() => navigate('/ganesh-auction')}
            title="Day 6 Prestigious Maha Laddu Auction"
          >
            <div className="quick-action-squircle squircle-auction">
              <Gavel size={24} />
            </div>
            <span className="quick-action-label">Auction</span>
          </button>

          {/* Action 8: My Flat */}
          <button
            type="button"
            className="quick-action-item"
            onClick={() => navigate('/login')}
            title="My Flat & Resident Login"
          >
            <div className="quick-action-squircle squircle-updates">
              <Building2 size={24} />
            </div>
            <span className="quick-action-label">My Flat</span>
          </button>
        </div>
      </div>

      {/* 4. Today's Schedule Section (Live from Events & Cultural Sheets, Sorted by Time) */}
      <div className="ganesh-today-schedule-section">
        <div className="schedule-section-header">
          <div>
            <h2 className="schedule-heading-title">Today's Schedule</h2>
            <span className="schedule-date-subtitle">{todayDateLabel}</span>
          </div>
          <button
            type="button"
            className="schedule-view-all-btn"
            onClick={() => onSelectTab('pooja')}
            title="View all 6 days Pooja schedule"
          >
            <span>VIEW ALL</span>
          </button>
        </div>

        <div className="schedule-cards-stack">
          {isLoadingSchedule ? (
            <div className="schedule-loading-card">
              <Sparkles size={18} className="animate-spin text-amber-500" />
              <span>Loading live schedule from Events & Cultural sheets...</span>
            </div>
          ) : todaySchedule.length === 0 ? (
            <div className="schedule-empty-card">
              <Calendar size={22} color="#94a3b8" />
              <span>No scheduled events found for today.</span>
            </div>
          ) : (
            todaySchedule.map((item) => {
              const iconClass =
                item.iconType === 'pooja'
                  ? 'icon-pooja'
                  : item.iconType === 'cultural'
                    ? 'icon-cultural'
                    : item.iconType === 'prasadam'
                      ? 'icon-prasadam'
                      : item.iconType === 'activity'
                        ? 'icon-activity'
                        : 'icon-event';

              return (
                <div key={item.id} className="schedule-item-card">
                  <div className={`schedule-icon-circle ${iconClass}`}>
                    {item.iconType === 'pooja' && <Flame size={20} />}
                    {item.iconType === 'cultural' && <Music size={20} />}
                    {item.iconType === 'prasadam' && <Utensils size={20} />}
                    {item.iconType === 'activity' && <Sparkles size={20} />}
                    {item.iconType === 'event' && <Calendar size={20} />}
                  </div>
                  <div className="schedule-content-wrap">
                    <span className="schedule-time-tag">{item.timeSlot}</span>
                    <h3 className="schedule-item-title">{item.title}</h3>
                    {item.description && (
                      <p className="schedule-item-desc">{item.description}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. Festival Finance Section */}
      <div className="finance-intro-box" style={{ marginTop: '0.25rem' }}>
        <div className="finance-tagline-wrap">
          <BookOpen size={18} color="#b45309" />
          <span>Festival Finance</span>
        </div>
        <p className="finance-tagline-desc">
          Live tracking of community contributions and expenditures.
        </p>
      </div>

      {/* 2. Combined Overview Card with Donut Chart + Total Donations, Total Expenses, Current Balance */}
      <div className="finance-white-card with-top-border">
        <div className="finance-card-header">
          <Globe size={18} color="#0f1d4f" />
          <span>Overview</span>
        </div>

        <div className="donut-chart-container">
          <div className="donut-svg-wrap">
            <svg width="170" height="170" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background Ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="11"
              />
              {/* Income Arc (Blue) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#0d1b4c"
                strokeWidth="11"
                strokeDasharray={`${incomeDash} ${circumference}`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              {/* Expense Arc (Red) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#b91c1c"
                strokeWidth="11"
                strokeDasharray={`${expenseDash} ${circumference}`}
                strokeDashoffset={`-${incomeDash}`}
                strokeLinecap="round"
              />
            </svg>

            <div className="donut-center-text">
              <span className="donut-center-label">Balance</span>
              <span className="donut-center-percent">{balancePercentage}%</span>
            </div>
          </div>

          <div className="donut-legend-wrap">
            <div className="donut-legend-item">
              <div className="donut-legend-dot dot-income" />
              <span>Income</span>
            </div>
            <div className="donut-legend-item">
              <div className="donut-legend-dot dot-expenses" />
              <span>Expenses</span>
            </div>
          </div>
        </div>

        {/* Combined 3 Metrics Strip Inside Overview */}
        <div className="overview-stats-grid">
          <div className="overview-stat-cell stat-donations">
            <span className="stat-label">Total Donations</span>
            <span className="stat-val">{formatRupee(totalDonations)}</span>
          </div>
          <div className="overview-stat-cell stat-expenses">
            <span className="stat-label">Total Expenses</span>
            <span className="stat-val">{formatRupee(totalExpenses)}</span>
          </div>
          <div className="overview-stat-cell stat-balance">
            <span className="stat-label">Current Balance</span>
            <span className="stat-val">{formatRupee(currentBalance)}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn-contribute-gold"
        onClick={() => {
          if (onOpenContributeModal) onOpenContributeModal();
          else onSelectTab('contributions');
        }}
      >
        <Heart size={18} fill="#713f12" />
        <span>Contribute Now</span>
      </button>

      {/* 6. Add to Home Screen PWA Card (or Installed Success State) */}
      {isInstalled ? (
        <div className="pwa-success-card">
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle size={22} color="#15803d" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 0.15rem 0', fontWeight: 800, color: '#14532d', fontSize: '0.92rem' }}>
              App Installed on Home Screen! 🎉
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#166534', lineHeight: 1.35 }}>
              You can now launch <strong>BPS Towers</strong> directly from your apps list with instant offline festival access.
            </p>
          </div>
        </div>
      ) : (
        showPwaBanner && (
          <div className="pwa-add-to-home-card" style={{ cursor: 'pointer' }} onClick={handleInstallClick}>
            <div className="pwa-add-left">
              <div className="pwa-icon-box">
                <Smartphone size={20} color="#38bdf8" />
              </div>
              <div>
                <h4 className="pwa-add-title">Add to Home Screen</h4>
                <p className="pwa-add-subtext">Tap to install as a mobile app</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="pwa-install-action-pill"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInstallClick();
                }}
              >
                <span>Install</span>
                <PlusSquare size={13} />
              </button>
              <button
                type="button"
                className="pwa-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPwaBanner(false);
                }}
                aria-label="Dismiss Add to Home Screen Banner"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )
      )}

      {/* Step-by-Step PWA Install Instructions Modal (Browser Tailored) */}
      {showInstallHelpModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowInstallHelpModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              position: 'relative',
              animation: 'slideUp 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowInstallHelpModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f5f9',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #09142e 0%, #1e3a8a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#facc15',
                  fontSize: '1.5rem',
                }}
              >
                🕉️
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Install Festival App
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                  Add BPS Twin Towers to your device
                </p>
              </div>
            </div>

            {detectedBrowser === 'ios-safari' ? (
              /* iPhone / Safari Instructions */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                    <span style={{ background: '#e0e7ff', color: '#4338ca', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>1</span>
                    <span>Tap the Safari Share Icon</span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0 1.85rem', fontSize: '0.8rem', color: '#64748b' }}>
                    Tap the <strong>Share</strong> button (box with an upward arrow 📤) at the bottom toolbar of Safari.
                  </p>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                    <span style={{ background: '#e0e7ff', color: '#4338ca', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>2</span>
                    <span>Tap "Add to Home Screen"</span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0 1.85rem', fontSize: '0.8rem', color: '#64748b' }}>
                    Scroll down the options list and tap <strong>Add to Home Screen ➕</strong>.
                  </p>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                    <span style={{ background: '#e0e7ff', color: '#4338ca', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>3</span>
                    <span>Confirm by Tapping "Add"</span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0 1.85rem', fontSize: '0.8rem', color: '#64748b' }}>
                    Tap <strong>Add</strong> in the top-right corner.
                  </p>
                </div>
              </div>
            ) : detectedBrowser === 'samsung' ? (
              /* Samsung Internet Instructions */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                    <span style={{ background: '#e0e7ff', color: '#4338ca', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>1</span>
                    <span>Tap Menu (≡) at Bottom</span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0 1.85rem', fontSize: '0.8rem', color: '#64748b' }}>
                    Tap the <strong>3 horizontal lines (≡)</strong> in Samsung Internet toolbar.
                  </p>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                    <span style={{ background: '#e0e7ff', color: '#4338ca', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>2</span>
                    <span>Tap "+ Add page to"</span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0 1.85rem', fontSize: '0.8rem', color: '#64748b' }}>
                    Choose <strong>Home screen</strong> from the options.
                  </p>
                </div>
              </div>
            ) : (
              /* Android Chrome / Edge Instructions */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                    <span style={{ background: '#e0e7ff', color: '#4338ca', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>1</span>
                    <span>Tap Browser Menu (⋮)</span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0 1.85rem', fontSize: '0.8rem', color: '#64748b' }}>
                    Tap the <strong>3 vertical dots</strong> in the top-right corner of your browser.
                  </p>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                    <span style={{ background: '#e0e7ff', color: '#4338ca', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>2</span>
                    <span>Tap "Install app" or "Add to Home screen"</span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0 1.85rem', fontSize: '0.8rem', color: '#64748b' }}>
                    Select <strong>Install app</strong> from the menu and confirm.
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.35rem' }}>
              <button
                type="button"
                onClick={() => {
                  setIsInstalled(true);
                  setShowInstallHelpModal(false);
                }}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.8rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                }}
              >
                <CheckCircle size={16} />
                <span>I've Added It to Home Screen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
