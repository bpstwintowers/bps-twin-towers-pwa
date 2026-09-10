import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  HeartHandshake,
  QrCode,
  Users,
  Receipt,
  Building2,
  Award,
  TrendingUp,
  DollarSign,
  Flame,
  Plus,
  X,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import type {
  GaneshContributionRecord,
  GaneshExpenseRecord,
  GaneshFinancialSummary,
  GaneshSankalpamRecord,
} from '../../types/ganesh';
import {
  fetchLiveContributions,
  fetchLiveGothramResponses,
  fetchLiveExpenses,
  getCachedContributions,
  getCachedGothram,
  getCachedExpenses,
  calculateGaneshSummary,
  exportGaneshCollectionsCSV,
  exportGaneshSankalpamCSV,
  isFlatMatching,
} from '../../services/liveSheetService';
import { supabase } from '../../services/supabase/client';
import { resolveUserAccess } from '../../services/supabase/registrationService';
import { HeaderNavbar } from './components/HeaderNavbar';
import { GaneshPaymentModal } from './components/GaneshPaymentModal';
import { GaneshExpenseModal } from './components/GaneshExpenseModal';
import { GaneshContributorsList } from './components/GaneshContributorsList';
import { GaneshSankalpamForm } from './components/GaneshSankalpamForm';
import { GaneshExpenseTracker } from './components/GaneshExpenseTracker';
import { GaneshPrintModal, type GaneshPrintType } from './components/GaneshPrintModal';
import { GaneshFlatPromptModal } from './components/GaneshFlatPromptModal';
import { GoogleFormEmbedModal } from './components/GoogleFormEmbedModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { GaneshBannerOverlay } from './components/GaneshBannerOverlay';
import './GaneshContribution.css';

type ActiveTab = 'contributions' | 'sankalpam' | 'expenses';

interface Props {
  isRegisteredUser?: boolean;
}

export const GaneshContributionPage: React.FC<Props> = ({ isRegisteredUser: isRegisteredProp }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('contributions');
  const [sankalpamViewMode, setSankalpamViewMode] = useState<'families' | 'pujari' | 'expenses' | 'contributions'>('families');
  const [isGothramModalOpen, setIsGothramModalOpen] = useState(false);
  const [isGoogleFormModalOpen, setIsGoogleFormModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [printModalType, setPrintModalType] = useState<GaneshPrintType | null>(null);

  // Registered vs Unregistered User State
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    return isRegisteredProp !== undefined ? isRegisteredProp : false;
  });

  // User Flat Identification State
  const [userFlat, setUserFlat] = useState<string>(() => {
    return localStorage.getItem('bps_ganesh_user_flat') || '';
  });
  const [isFlatPromptOpen, setIsFlatPromptOpen] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollToTabs = (tab: 'contributions' | 'expenses' | 'sankalpam') => {
    setActiveTab(tab);
    setTimeout(() => {
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // State - Initialized synchronously from cache for instant loading
  const initialCachedContribs = useMemo(() => getCachedContributions(), []);
  const initialCachedGothram = useMemo(() => getCachedGothram(), []);
  const initialCachedExpenses = useMemo(() => getCachedExpenses(), []);

  const [contributions, setContributions] = useState<GaneshContributionRecord[]>(initialCachedContribs);
  const [expenses, setExpenses] = useState<GaneshExpenseRecord[]>(initialCachedExpenses);
  const [sankalpams, setSankalpams] = useState<GaneshSankalpamRecord[]>(initialCachedGothram);
  const [summary, setSummary] = useState<GaneshFinancialSummary | null>(() => {
    return calculateGaneshSummary(initialCachedContribs, initialCachedExpenses, initialCachedGothram);
  });
  const [isLoadingLive, setIsLoadingLive] = useState(initialCachedContribs.length === 0);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Live');

  const userContributions = useMemo(() => {
    if (!userFlat || userFlat === 'GUEST') return [];
    return contributions.filter((c) => isFlatMatching(c.flatNo, userFlat));
  }, [contributions, userFlat]);

  const myTotalContribution = useMemo(() => {
    return userContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [userContributions]);

  const mySankalpam = useMemo(() => {
    if (!userFlat || userFlat === 'GUEST') return null;
    return sankalpams.find((s) => isFlatMatching(s.flatNo, userFlat)) || null;
  }, [sankalpams, userFlat]);

  // Modals
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const loadData = async (isManual = false) => {
    if (isManual) setIsLoadingLive(true);
    try {
      const [cList, sList, eList] = await Promise.all([
        fetchLiveContributions(),
        fetchLiveGothramResponses(),
        fetchLiveExpenses(),
      ]);
      const sum = calculateGaneshSummary(cList, eList, sList);

      setContributions(cList);
      setExpenses(eList);
      setSankalpams(sList);
      setSummary(sum);

      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Error loading live sheets data:', err);
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    loadData();

    // Determine registration & auto-populate resident flat
    const checkResidentStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsRegistered(true);

          // Attempt to retrieve registered flat details
          const { data: profile } = await supabase
            .from('profiles')
            .select('flat_number, tower')
            .eq('id', session.user.id)
            .maybeSingle();

          let resolvedFlat = '';
          if (profile?.flat_number) {
            const towerPrefix = profile.tower && !profile.flat_number.toUpperCase().startsWith(profile.tower.toUpperCase())
              ? profile.tower.toUpperCase()
              : '';
            resolvedFlat = `${towerPrefix}${profile.flat_number}`.toUpperCase();
          }

          if (!resolvedFlat) {
            const accessList = await resolveUserAccess();
            if (accessList && accessList.length > 0 && accessList[0].flat_number) {
              const first = accessList[0];
              const blockPrefix = first.block_name && !first.flat_number?.toUpperCase().startsWith(first.block_name.toUpperCase())
                ? first.block_name.toUpperCase()
                : '';
              resolvedFlat = `${blockPrefix}${first.flat_number}`.toUpperCase();
            }
          }

          if (resolvedFlat) {
            setUserFlat(resolvedFlat);
            localStorage.setItem('bps_ganesh_user_flat', resolvedFlat);
          }
          // Do not prompt registered residents
          setIsFlatPromptOpen(false);
        } else {
          setIsRegistered(false);
          const storedFlat = localStorage.getItem('bps_ganesh_user_flat');
          if (!storedFlat) {
            setIsFlatPromptOpen(true);
          }
        }
      } catch (err) {
        console.error('Error checking resident auth status:', err);
        setIsRegistered(false);
        const storedFlat = localStorage.getItem('bps_ganesh_user_flat');
        if (!storedFlat) {
          setIsFlatPromptOpen(true);
        }
      }
    };

    if (isRegisteredProp !== undefined) {
      setIsRegistered(isRegisteredProp);
      if (!isRegisteredProp) {
        const storedFlat = localStorage.getItem('bps_ganesh_user_flat');
        if (!storedFlat) setIsFlatPromptOpen(true);
      }
    } else {
      checkResidentStatus();
    }
  }, [isRegisteredProp]);

  const handleContributeSuccess = () => {
    loadData();
  };

  const isAdminUser = useMemo(() => {
    if (isRegistered) {
      return true;
    }
    const clean = (userFlat || '').trim().toUpperCase();
    return clean === 'ADMN' || clean === 'ADMIN' || clean.includes('ADMN') || clean.includes('ADMIN');
  }, [isRegistered, userFlat]);

  const progressPercentage = summary
    ? Math.min(100, Math.round((summary.totalCollections / summary.targetBudget) * 100))
    : 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header is ONLY visible for Unregistered / Guest residents; hidden for registered residents inside Portal */}
      {!isRegistered && (
        <HeaderNavbar
          isAdmin={isAdminUser}
          userFlat={userFlat}
          onOpenFlatPrompt={() => setIsFlatPromptOpen(true)}
          onSelectAdminSync={() => setIsSyncModalOpen(true)}
          onOpenContributionModal={() => setIsPayModalOpen(true)}
          onOpenSponsorModal={() => setIsSponsorModalOpen(true)}
          onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
          onRefreshData={() => loadData(true)}
          isLoading={isLoadingLive}
          onSelectPrintView={(view) => {
            setPrintModalType(view);
          }}
          onExportCSV={() => {
            const csvContent = exportGaneshSankalpamCSV(sankalpams);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Ganesh_Gothram_Family_List_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        />
      )}

      <div className="ganesh-page-container" style={{ flex: 1 }}>
        {/* Live Google Sheets Connection Status Bar (Admins Only) */}
        {isAdminUser && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#ffffff',
              border: '1px solid #fed7aa',
              padding: '0.45rem 1rem',
              borderRadius: '20px',
              marginBottom: '1rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#78350f' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <span>
                <strong>Live Google Sheets Connected:</strong> {contributions.length} Contributions &amp; {sankalpams.length} Gothram Families
              </span>
              {lastSyncTime && (
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>• Synced at {lastSyncTime}</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '12px',
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#065f46',
                  cursor: 'pointer',
                }}
                title="Configure Live Google Sheets Sync & Webhooks (Popup)"
              >
                <span>⚙️</span>
                <span>Live Sync Setup</span>
              </button>

              <button
                type="button"
                onClick={() => loadData(true)}
                disabled={isLoadingLive}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#fff7ed',
                  border: '1px solid #fdba74',
                  borderRadius: '12px',
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#c2410c',
                  cursor: isLoadingLive ? 'not-allowed' : 'pointer',
                }}
              >
                <RefreshCw size={12} style={{ animation: isLoadingLive ? 'spin 1s linear infinite' : 'none' }} />
                <span>{isLoadingLive ? 'Syncing...' : 'Sync Live Sheets'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Festive Top Widescreen Banner Image Card */}
        <div
          style={{
            width: '100%',
            borderRadius: '20px',
            overflow: 'hidden',
            marginBottom: '1.25rem',
            boxShadow: '0 10px 28px -4px rgba(0, 0, 0, 0.12)',
            background: '#ffffff',
            border: '2px solid #fed7aa',
          }}
        >
          <div
            style={{
              width: '100%',
              height: 'clamp(200px, 32vw, 360px)',
              background: '#fff7ed',
              overflow: 'hidden',
            }}
          >
            <img
              src="/ganesh-banner.png"
              alt="BPS Ganesh Utsav 2026 Celebration"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 20%',
                display: 'block',
              }}
            />
          </div>

          {/* Attached Festive Invitation Ribbon & Live Countdown */}
          <GaneshBannerOverlay />
        </div>

        {/* Event Title, Details & Google Form Action Header */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #fed7aa',
            borderRadius: '18px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 16px -2px rgba(234, 88, 12, 0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 'clamp(1.3rem, 2.8vw, 1.8rem)',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Ganesh Utsav 2026
                </h1>
                <span
                  style={{
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.12rem 0.55rem',
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Active
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  flexWrap: 'nowrap',
                  whiteSpace: 'nowrap',
                  color: '#64748b',
                  fontSize: 'clamp(0.76rem, 2.2vw, 0.84rem)',
                  fontWeight: 600,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                  📅 Sep 14 – 19, 2026
                </span>
                <span style={{ color: '#cbd5e1', flexShrink: 0 }}>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                  📍 Community Hall, Ground Floor
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '0.65rem',
                width: '100%',
                maxWidth: '460px',
                marginTop: '0.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => setIsPayModalOpen(true)}
                className="btn-festive-primary"
                style={{
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 0.75rem',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  borderRadius: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.25)',
                  whiteSpace: 'nowrap',
                  width: '100%',
                }}
              >
                <QrCode size={16} />
                <span>Contribute Now</span>
              </button>

              <button
                type="button"
                onClick={() => setIsGoogleFormModalOpen(true)}
                className="btn-festive-secondary"
                style={{
                  background: '#fff7ed',
                  color: '#c2410c',
                  border: '1.5px solid #fdba74',
                  padding: '0.65rem 0.75rem',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  borderRadius: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.08)',
                  whiteSpace: 'nowrap',
                  width: '100%',
                }}
              >
                <Sparkles size={16} />
                <span>Gothram Entry</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Metrics & Community Progress Summary (Side by Side) */}
        {summary && (
          <div className="ganesh-summary-row">
            {/* Total Collections */}
            <div
              className="ganesh-metric-card is-clickable"
              onClick={() => {
                setActiveTab('contributions');
                tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              title="Click to view all Contributions & Sponsors"
            >
              <div className="ganesh-metric-icon-wrap icon-gold">
                <Award size={24} />
              </div>
              <div className="ganesh-metric-info">
                <span className="ganesh-metric-label">Total Collections</span>
                <span className="ganesh-metric-value" style={{ color: '#b45309' }}>
                  ₹{summary.totalCollections.toLocaleString('en-IN')}
                </span>
                <span className="ganesh-metric-subtext">
                  {summary.totalContributorsCount} Residents + {summary.totalSponsorsCount} Sponsors • View below
                </span>
              </div>
            </div>

            {/* Expenses Incurred */}
            <div
              className="ganesh-metric-card is-clickable"
              onClick={() => scrollToTabs('expenses')}
              title="Click to view full Expenses breakdown below"
            >
              <div className="ganesh-metric-icon-wrap icon-rose">
                <Receipt size={24} />
              </div>
              <div className="ganesh-metric-info">
                <span className="ganesh-metric-label">Expenses Incurred</span>
                <span className="ganesh-metric-value" style={{ color: '#be123c' }}>
                  ₹{summary.totalExpenses.toLocaleString('en-IN')}
                </span>
                <span className="ganesh-metric-subtext">{expenses.length} Verified Invoices • View below</span>
              </div>
            </div>

            {/* Community Funding Goal Progress */}
            <div className="ganesh-progress-card ganesh-summary-progress-item">
              <div className="ganesh-progress-header">
                <div className="ganesh-progress-title">
                  <TrendingUp size={17} color="#ea580c" />
                  <span>Community Funding Goal Progress</span>
                </div>
                <div className="ganesh-progress-stats">
                  <strong>₹{summary.totalCollections.toLocaleString('en-IN')}</strong> of ₹
                  {summary.targetBudget.toLocaleString('en-IN')} ({progressPercentage}%)
                </div>
              </div>

              <div className="ganesh-progress-bar-track">
                <div
                  className="ganesh-progress-bar-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="ganesh-tower-split">
                <div className="tower-pill tower-pill-a">
                  <Building2 size={14} /> Tower A: ₹{summary.towerAAmount.toLocaleString('en-IN')} (
                  {summary.towerACount} Flats)
                </div>
                <div className="tower-pill tower-pill-b">
                  <Building2 size={14} /> Tower B: ₹{summary.towerBAmount.toLocaleString('en-IN')} (
                  {summary.towerBCount} Flats)
                </div>
                <div
                  style={{
                    color: '#047857',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (!userFlat || userFlat === 'GUEST') setIsFlatPromptOpen(true);
                  }}
                  title={userFlat && userFlat !== 'GUEST' ? `Flat ${userFlat.toUpperCase()} Total Contribution` : 'Click to select your flat'}
                >
                  <span>🪙</span>
                  <span>
                    My: <strong>₹{myTotalContribution.toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/*
            Target Festival Budget Card (Commented out):
            <div
              className="ganesh-metric-card is-clickable"
              onClick={() => setIsCollectionsPopupOpen(true)}
              title="Click to view Community Progress &amp; Contributions"
            >
              <div className="ganesh-metric-icon-wrap icon-orange">
                <TrendingUp size={24} />
              </div>
              <div className="ganesh-metric-info">
                <span className="ganesh-metric-label">Target Festival Budget</span>
                <span className="ganesh-metric-value">
                  ₹{summary.targetBudget.toLocaleString('en-IN')}
                </span>
                <span className="ganesh-metric-subtext">{progressPercentage}% Target Achieved • Click to view</span>
              </div>
            </div>

            Net Surplus Balance Card (Commented out):
            <div
              className="ganesh-metric-card is-clickable"
              onClick={() => setIsExpensesPopupOpen(true)}
              title="Click to view Financial Reserve &amp; Expenses"
            >
              <div className="ganesh-metric-icon-wrap icon-emerald">
                <DollarSign size={24} />
              </div>
              <div className="ganesh-metric-info">
                <span className="ganesh-metric-label">Net Surplus Balance</span>
                <span
                  className="ganesh-metric-value"
                  style={{ color: summary.netBalance >= 0 ? '#047857' : '#e11d48' }}
                >
                  ₹{summary.netBalance.toLocaleString('en-IN')}
                </span>
                <span className="ganesh-metric-subtext">Available Festival Reserve • Click to view</span>
              </div>
            </div>
            */}
          </div>
        )}

        {/* Unified Resident Flat Dashboard Card (Contributions & Sankalpam Gothram) */}
        {userFlat && userFlat !== 'GUEST' && !['ADMN', 'ADMIN'].some((k) => userFlat.toUpperCase().includes(k)) && (
          <div
            style={{
              background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
              border: '1.5px solid #f97316',
              borderRadius: '14px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              boxShadow: '0 4px 16px -2px rgba(234, 88, 12, 0.12)',
            }}
          >
            {/* Top Section: Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: userContributions.length > 0 ? '0.5rem' : '0.35rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '1.15rem' }}>🌟</span>
                <div>
                  <h3 style={{ margin: 0, color: '#9a3412', fontSize: '0.98rem', fontWeight: 800 }}>
                    Flat {userFlat.toUpperCase()} • Contributions & Sponsorships
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#b45309' }}>
                    {userContributions.length > 0
                      ? `${userContributions.length} contribution entry recorded for your flat`
                      : 'No contributions recorded yet for your flat'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contribution Records Grid (if any) or Call-to-Action buttons (if no contributions yet) */}
            {userContributions.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                {userContributions.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '10px',
                      padding: '0.55rem 0.85rem',
                      border: '1px solid #fed7aa',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.88rem' }}>{item.donorName}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {item.isSponsor ? `🎖️ Sponsor: ${item.sponsorCategory || 'Pooja Sponsor'}` : item.contributionType || 'General Contribution'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#ea580c' }}>
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
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  border: '1px solid #fed7aa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.65rem',
                  marginBottom: '0.5rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#9a3412', fontSize: '0.88rem' }}>
                    Join the Grand Utsav Celebration
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                    Support festival arrangements with voluntary contribution or seva sponsorship
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(true)}
                    className="btn-festive-primary"
                    style={{
                      background: '#ea580c',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(234, 88, 12, 0.2)',
                    }}
                  >
                    <QrCode size={14} /> Contribute via QR Code
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSponsorModalOpen(true)}
                    className="btn-festive-secondary"
                    style={{
                      background: '#fff7ed',
                      color: '#c2410c',
                      border: '1.5px solid #fdba74',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Sparkles size={14} /> Become a Sponsor
                  </button>
                </div>
              </div>
            )}

            {/* Divider */}
            <div style={{ borderTop: '1px dashed #fdba74', margin: '0.5rem 0' }} />

            {/* Embedded Gothram & Sankalpam Section inside the same card */}
            {mySankalpam ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '1rem' }}>🙏</span>
                  <h4 style={{ margin: 0, color: '#92400e', fontSize: '0.92rem', fontWeight: 800 }}>
                    Gothram: {mySankalpam.gothram}
                  </h4>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#b45309', marginBottom: '0.3rem' }}>
                  {mySankalpam.familyMembers?.length || 0} family members registered for daily Sankalpam
                </div>

                {mySankalpam.familyMembers && mySankalpam.familyMembers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {mySankalpam.familyMembers.map((m) => (
                      <span
                        key={m.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #fde68a',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#78350f',
                        }}
                      >
                        {m.name} {m.relationship ? `(${m.relationship})` : ''} {m.nakshatram ? `• ${m.nakshatram}` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  paddingTop: '0.2rem',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, color: '#9a3412', fontSize: '0.98rem', fontWeight: 800 }}>
                    🙏 Flat {userFlat.toUpperCase()} is not yet registered for Sankalpam
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#78350f', fontSize: '0.82rem' }}>
                    Register your Gothram and family members for daily puja chanting & blessings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGothramModalOpen(true)}
                  className="btn-festive-primary"
                  style={{
                    background: '#ea580c',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.5rem 1rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={15} /> Register Gothram for Flat {userFlat.toUpperCase()}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feature Tabs Navigation */}
        <div className="ganesh-tabs-container no-print" ref={tabsRef}>
          <button
            type="button"
            className={`ganesh-tab-btn ${activeTab === 'contributions' ? 'active' : ''}`}
            onClick={() => setActiveTab('contributions')}
          >
            <HeartHandshake size={18} />
            <span>Contributions &amp; Sponsors</span>
            <span className="tab-counter-badge">{contributions.length}</span>
          </button>

          <button
            type="button"
            className={`ganesh-tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            <Receipt size={18} />
            <span>Expenses &amp; Ledger</span>
            <span className="tab-counter-badge">{expenses.length}</span>
          </button>
        </div>

        {/* Tab Panels */}
        {activeTab === 'contributions' && (
          <GaneshContributorsList
            contributions={contributions}
            userFlat={userFlat}
            onOpenContributeModal={() => setIsPayModalOpen(true)}
            onOpenSponsorModal={() => setIsSponsorModalOpen(true)}
          />
        )}

        {activeTab === 'expenses' && (
          <div className="ganesh-contributors-card">
            <GaneshExpenseTracker
              expenses={expenses}
              totalCollections={summary?.totalCollections || 0}
              onRefresh={loadData}
            />
          </div>
        )}

        {/* Sankalpam Gothram Registration / Edit Modal */}
        <GaneshSankalpamForm
          sankalpams={sankalpams}
          contributions={contributions}
          expenses={expenses}
          onRefresh={loadData}
          userFlat={userFlat}
          activeViewMode={sankalpamViewMode}
          onViewModeChange={setSankalpamViewMode}
          isAddModalOpen={isGothramModalOpen}
          onOpenAddModal={() => setIsGothramModalOpen(true)}
          onCloseAddModal={() => setIsGothramModalOpen(false)}
        />

        {/* Contribution / QR Modal */}
        {isPayModalOpen && (
          <GaneshPaymentModal
            isOpen={isPayModalOpen}
            onClose={() => setIsPayModalOpen(false)}
            onSuccess={handleContributeSuccess}
            defaultCategory="General Contribution"
            defaultAmount={2116}
            isSponsorship={false}
          />
        )}

        {/* Sponsor Modal */}
        {isSponsorModalOpen && (
          <GaneshPaymentModal
            isOpen={isSponsorModalOpen}
            onClose={() => setIsSponsorModalOpen(false)}
            onSuccess={handleContributeSuccess}
            defaultCategory="Pooja Item"
            defaultAmount={5116}
            isSponsorship={true}
          />
        )}

        {/* Expense Modal (Add Form) */}
        {isExpenseModalOpen && (
          <GaneshExpenseModal
            isOpen={isExpenseModalOpen}
            onClose={() => setIsExpenseModalOpen(false)}
            onSuccess={() => loadData()}
          />
        )}




      </div>

      {/* Welcome / Resident Flat Prompt Modal */}
      <GaneshFlatPromptModal
        isOpen={isFlatPromptOpen}
        onClose={() => setIsFlatPromptOpen(false)}
        currentFlat={userFlat}
        onSelectFlat={(selectedFlat) => {
          setUserFlat(selectedFlat);
          localStorage.setItem('bps_ganesh_user_flat', selectedFlat);
        }}
      />

      {/* Print Reports Modal (isolated from main page flow) */}
      <GaneshPrintModal
        isOpen={!!printModalType}
        onClose={() => setPrintModalType(null)}
        printType={printModalType}
        sankalpams={sankalpams}
        contributions={contributions}
        expenses={expenses}
      />

      {/* Official Google Form Embed Modal */}
      <GoogleFormEmbedModal
        isOpen={isGoogleFormModalOpen}
        onClose={() => {
          setIsGoogleFormModalOpen(false);
          loadData(true);
        }}
        userFlat={userFlat}
        isAdmin={isAdminUser}
      />

      {/* Google Sheets Live Sync Setup Modal (Popup) */}
      <GoogleSheetsSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onRefreshData={() => loadData(true)}
      />
    </div>
  );
};
