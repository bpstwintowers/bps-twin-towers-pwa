import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Calendar,
  Clock,
  Phone,
  MessageCircle,
  Search,
  CheckCircle2,
  ChevronRight,
  Shirt,
  Utensils,
  PartyPopper,
  ArrowLeft,
} from 'lucide-react';
import type {
  GaneshContributionRecord,
  GaneshExpenseRecord,
  GaneshFinancialSummary,
  GaneshSankalpamRecord,
} from '../../types/ganesh';
import {
  POOJA_SCHEDULE_DAYS,
  COMMITTEE_TEAMS,
  type PoojaDaySchedule,
} from './poojaScheduleData';
import './PoojaSchedule.css';
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
import { fetchUserRoles } from '../../services/supabase/adminService';
import { hasAnyAdminRole } from '../../utils/rbac';
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
import { GaneshQuickActions } from './components/GaneshQuickActions';
import { GaneshBottomNav } from './components/GaneshBottomNav';
import { EventList } from '../events/EventList';
import { GaneshFundsPage } from './GaneshFundsPage';
import { GaneshVolunteerPage } from './GaneshVolunteerPage';
import { GaneshPrasadamPage } from './GaneshPrasadamPage';
import { GaneshCulturalPage } from './GaneshCulturalPage';
import { GaneshAuctionPage } from './GaneshAuctionPage';
import { GaneshSponsorsPage } from './GaneshSponsorsPage';
import { AnnouncementList } from '../announcements/AnnouncementList';
import './GaneshContribution.css';

type ActiveTab =
  | 'home'
  | 'contributions'
  | 'funds'
  | 'expenses'
  | 'pooja'
  | 'volunteers'
  | 'prasadam'
  | 'cultural'
  | 'auction'
  | 'sponsors'
  | 'updates'
  | 'spocs'
  | 'sankalpam';

interface Props {
  isRegisteredUser?: boolean;
}

export const GaneshContributionPage: React.FC<Props> = ({ isRegisteredUser: isRegisteredProp }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (window.location.pathname === '/ganesh-contributions') return 'contributions';
    return 'home';
  });
  const [sankalpamViewMode, setSankalpamViewMode] = useState<'families' | 'pujari' | 'expenses' | 'contributions'>('families');
  const [isGothramModalOpen, setIsGothramModalOpen] = useState(false);
  const [isGoogleFormModalOpen, setIsGoogleFormModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [printModalType, setPrintModalType] = useState<GaneshPrintType | null>(null);

  // Registered vs Unregistered User State
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    return isRegisteredProp !== undefined ? isRegisteredProp : false;
  });
  const [hasAuthAdminRole, setHasAuthAdminRole] = useState<boolean>(false);

  // User Flat Identification State
  const [userFlat, setUserFlat] = useState<string>(() => {
    return localStorage.getItem('bps_ganesh_user_flat') || '';
  });
  const [isFlatPromptOpen, setIsFlatPromptOpen] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Embedded Pooja Schedule & SPOC Filters State
  const [selectedPoojaDay, setSelectedPoojaDay] = useState<number>(1);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
  const [spocSearchQuery, setSpocSearchQuery] = useState<string>('');

  const scrollToTabs = (tab: ActiveTab) => {
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

  const activePoojaDay: PoojaDaySchedule = useMemo(() => {
    return POOJA_SCHEDULE_DAYS.find((d) => d.dayNumber === selectedPoojaDay) || POOJA_SCHEDULE_DAYS[0];
  }, [selectedPoojaDay]);

  const filteredTeams = useMemo(() => {
    return COMMITTEE_TEAMS.map((team) => {
      if (selectedTeamFilter !== 'ALL' && team.id !== selectedTeamFilter) return null;
      const query = spocSearchQuery.toLowerCase().trim();
      const filteredSpocs = team.spocs.filter((spoc) => {
        if (!query) return true;
        return (
          spoc.name.toLowerCase().includes(query) ||
          spoc.flatNo.toLowerCase().includes(query) ||
          spoc.role.toLowerCase().includes(query) ||
          spoc.tower.toLowerCase().includes(query) ||
          spoc.responsibilities.some((r) => r.toLowerCase().includes(query))
        );
      });
      if (filteredSpocs.length === 0) return null;
      return { ...team, spocs: filteredSpocs };
    }).filter(Boolean) as typeof COMMITTEE_TEAMS;
  }, [selectedTeamFilter, spocSearchQuery]);

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

          try {
            const roles = await fetchUserRoles();
            const isAdm = hasAnyAdminRole(roles, session.user.email);
            setHasAuthAdminRole(isAdm);
          } catch {
            setHasAuthAdminRole(false);
          }

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
          setHasAuthAdminRole(false);
          const storedFlat = localStorage.getItem('bps_ganesh_user_flat');
          if (!storedFlat) {
            setIsFlatPromptOpen(true);
          }
        }
      } catch (err) {
        console.error('Error checking resident auth status:', err);
        setIsRegistered(false);
        setHasAuthAdminRole(false);
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
    if (hasAuthAdminRole) {
      return true;
    }
    const clean = (userFlat || '').trim().toUpperCase();
    return clean === 'ADMN' || clean === 'ADMIN' || clean.includes('ADMN') || clean.includes('ADMIN');
  }, [hasAuthAdminRole, userFlat]);

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

        {/* If on Home: Show Mobile-Style Photo Hero Card, Resident Status Cards (Contribution/Gothram), 8 Quick Actions & Add to Home Screen */}
        {activeTab === 'home' && (
          <GaneshQuickActions
            userFlat={userFlat}
            summary={summary}
            sankalpams={sankalpams}
            contributions={contributions}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenContributeModal={() => setIsPayModalOpen(true)}
            onOpenSponsorModal={() => setIsSponsorModalOpen(true)}
            onOpenGothramModal={() => {
              setIsGoogleFormModalOpen(true);
            }}
            onOpenFlatPrompt={() => setIsFlatPromptOpen(true)}
          />
        )}

        {/* Tab 1: Events / Pooja Schedule */}
        {activeTab === 'pooja' && (
          <EventList embedded={true} onBackToHome={() => setActiveTab('home')} />
        )}

        {/* Tab 2: Community Funds */}
        {activeTab === 'funds' && (
          <GaneshFundsPage embedded={true} onBackToHome={() => setActiveTab('home')} />
        )}

        {/* Tab 4: Volunteers & Committee Seva */}
        {activeTab === 'volunteers' && (
          <GaneshVolunteerPage embedded={true} onBackToHome={() => setActiveTab('home')} />
        )}

        {/* Tab 5: Sacred Maha Prasadam Schedule */}
        {activeTab === 'prasadam' && (
          <GaneshPrasadamPage embedded={true} onBackToHome={() => setActiveTab('home')} />
        )}

        {/* Tab 6: Cultural Programmes & Registrations */}
        {activeTab === 'cultural' && (
          <GaneshCulturalPage embedded={true} onBackToHome={() => setActiveTab('home')} />
        )}

        {/* Tab 7: Maha Laddu Live Auction */}
        {activeTab === 'auction' && (
          <GaneshAuctionPage embedded={true} onBackToHome={() => setActiveTab('home')} />
        )}

        {/* Tab 8: Sponsors & Festival Patrons */}
        {activeTab === 'sponsors' && (
          <GaneshSponsorsPage embedded={true} onBackToHome={() => setActiveTab('home')} />
        )}

        {/* Tab 9: Official Announcements & Updates */}
        {activeTab === 'updates' && (
          <AnnouncementList embedded={true} onBackToHome={() => setActiveTab('home')} />
        )}

        {/* If on Classic Financial Ledger / Expenses / SPOCs / Gothram Tabs */}
        {(activeTab === 'contributions' || activeTab === 'expenses' || activeTab === 'spocs' || activeTab === 'sankalpam') && (
          <>
            {/* Top Back Header for Tab Views */}
            <div
              className="no-print"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.35rem 0 0.75rem 0',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('home')}
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
                  gap: '0.45rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to Festival Home</span>
              </button>
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
          </div>
        )}

        {/* =========================================================================
            INTERACTIVE FESTIVAL MENU CARDS (CONTRIBUTIONS, EXPENSES, POOJA, SPOCS, SANKALPAM)
           ========================================================================= */}
        <div className="ganesh-menu-cards-grid no-print">
          {/* Card 1: Contributions & Sponsors */}
          <div
            className={`ganesh-menu-nav-card card-contributions ${activeTab === 'contributions' ? 'active' : ''}`}
            onClick={() => scrollToTabs('contributions')}
          >
            <div className="menu-nav-top">
              <div className="menu-nav-icon-wrap icon-gold">
                <HeartHandshake size={20} />
              </div>
              <span className="menu-nav-badge count-gold">{contributions.length} Records</span>
            </div>
            <h3 className="menu-nav-title">Contributions &amp; Sponsors</h3>
            <p className="menu-nav-desc">
              ₹{summary ? summary.totalCollections.toLocaleString('en-IN') : '0'} collected from{' '}
              {summary ? summary.totalContributorsCount : 0} Flats
            </p>
            <div className="menu-nav-footer">
              <span>View Donor List &amp; Sponsors</span>
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Card 2: Expenses & Ledger */}
          <div
            className={`ganesh-menu-nav-card card-expenses ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => scrollToTabs('expenses')}
          >
            <div className="menu-nav-top">
              <div className="menu-nav-icon-wrap icon-rose">
                <Receipt size={20} />
              </div>
              <span className="menu-nav-badge count-rose">{expenses.length} Invoices</span>
            </div>
            <h3 className="menu-nav-title">Expenses &amp; Ledger</h3>
            <p className="menu-nav-desc">
              ₹{summary ? summary.totalExpenses.toLocaleString('en-IN') : '0'} verified vendor invoices
            </p>
            <div className="menu-nav-footer">
              <span>View Invoices &amp; Bills</span>
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Card 3: Pooja Schedule (14th - 19th Sep) */}
          <div
            className="ganesh-menu-nav-card card-pooja"
            onClick={() => navigate('/events')}
          >
            <div className="menu-nav-top">
              <div className="menu-nav-icon-wrap icon-amber">
                <Flame size={20} />
              </div>
              <span className="menu-nav-badge count-amber">Sep 14–19</span>
            </div>
            <h3 className="menu-nav-title">Pooja Schedule</h3>
            <p className="menu-nav-desc">6 Days • Morning Abhishekam &amp; 7:00 PM Aarti</p>
            <div className="menu-nav-footer">
              <span>View Daily Schedule</span>
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Card 4: Volunteer & Committee Teams */}
          <div
            className="ganesh-menu-nav-card card-spocs"
            onClick={() => navigate('/ganesh-volunteers')}
          >
            <div className="menu-nav-top">
              <div className="menu-nav-icon-wrap icon-blue">
                <Users size={20} />
              </div>
              <span className="menu-nav-badge count-blue">Volunteer</span>
            </div>
            <h3 className="menu-nav-title">Volunteer Portal</h3>
            <p className="menu-nav-desc">Join Food, Decor, Cultural, Pooja &amp; Crowd Teams</p>
            <div className="menu-nav-footer">
              <span>Sign Up &amp; Be Part of Celebration</span>
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Card 5: Gothram & Sankalpam */}
          <div
            className={`ganesh-menu-nav-card card-sankalpam ${activeTab === 'sankalpam' ? 'active' : ''}`}
            onClick={() => scrollToTabs('sankalpam')}
          >
            <div className="menu-nav-top">
              <div className="menu-nav-icon-wrap icon-teal">
                <Sparkles size={20} />
              </div>
              <span className="menu-nav-badge count-teal">{sankalpams.length} Families</span>
            </div>
            <h3 className="menu-nav-title">Gothram &amp; Sankalpam</h3>
            <p className="menu-nav-desc">Daily Archana Family Names &amp; Pujari Roster</p>
            <div className="menu-nav-footer">
              <span>View Registered Families</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </div>

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

          <button
            type="button"
            className="ganesh-tab-btn"
            onClick={() => navigate('/events')}
          >
            <Flame size={18} />
            <span>Pooja Schedule (14th–19th)</span>
            <span className="tab-counter-badge">6 Days</span>
          </button>

          <button
            type="button"
            className={`ganesh-tab-btn ${activeTab === 'spocs' ? 'active' : ''}`}
            onClick={() => setActiveTab('spocs')}
          >
            <Users size={18} />
            <span>Teams &amp; SPOCs</span>
            <span className="tab-counter-badge">12 SPOCs</span>
          </button>

          <button
            type="button"
            className={`ganesh-tab-btn ${activeTab === 'sankalpam' ? 'active' : ''}`}
            onClick={() => setActiveTab('sankalpam')}
          >
            <Sparkles size={18} />
            <span>Gothram &amp; Sankalpam</span>
            <span className="tab-counter-badge">{sankalpams.length}</span>
          </button>
        </div>

        {/* Tab Panel 1: Contributions & Sponsors */}
        {activeTab === 'contributions' && (
          <GaneshContributorsList
            contributions={contributions}
            userFlat={userFlat}
            onOpenContributeModal={() => setIsPayModalOpen(true)}
            onOpenSponsorModal={() => setIsSponsorModalOpen(true)}
          />
        )}

        {/* Tab Panel 2: Expenses & Ledger */}
        {activeTab === 'expenses' && (
          <div className="ganesh-contributors-card">
            <GaneshExpenseTracker
              expenses={expenses}
              totalCollections={summary?.totalCollections || 0}
              onRefresh={loadData}
              isAdmin={isAdminUser}
            />
          </div>
        )}

        {/* Tab Panel 4: Embedded Committee Teams & SPOC Directory */}
        {activeTab === 'spocs' && (
          <div className="spoc-directory-section">
            {/* Toolbar & Filters */}
            <div className="spoc-filter-toolbar">
              <div className="spoc-search-box">
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  className="spoc-search-input"
                  placeholder="Search SPOC by name, flat (e.g. A-704), or role..."
                  value={spocSearchQuery}
                  onChange={(e) => setSpocSearchQuery(e.target.value)}
                />
              </div>

              <div className="team-pill-filter-bar">
                <button
                  type="button"
                  className={`team-pill-btn ${selectedTeamFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setSelectedTeamFilter('ALL')}
                >
                  All Teams (6)
                </button>
                {COMMITTEE_TEAMS.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    className={`team-pill-btn ${selectedTeamFilter === team.id ? 'active' : ''}`}
                    onClick={() => setSelectedTeamFilter(team.id)}
                  >
                    {team.name.split('&')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Teams Grid */}
            <div className="teams-list-wrapper">
              {filteredTeams.map((team) => (
                <div key={team.id} className="team-block-card">
                  <div className="team-block-header">
                    <div>
                      <h3 className="team-block-title">
                        <Flame size={20} color="#ea580c" />
                        <span>{team.name}</span>
                      </h3>
                      <p className="team-block-desc">{team.description}</p>
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: '#f1f5f9',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        color: '#475569',
                      }}
                    >
                      {team.spocs.length} Designated SPOCs
                    </span>
                  </div>

                  {/* SPOCs inside team */}
                  <div className="spocs-grid">
                    {team.spocs.map((spoc) => (
                      <div key={spoc.id} className="spoc-card">
                        <div>
                          <div className="spoc-top-row">
                            <div>
                              <h4 className="spoc-name">{spoc.name}</h4>
                              <div className="spoc-role">{spoc.role}</div>
                            </div>
                            <span className="spoc-flat-badge">
                              {spoc.flatNo} ({spoc.tower})
                            </span>
                          </div>

                          <div style={{ marginTop: '0.75rem' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                color: '#94a3b8',
                                letterSpacing: '0.04em',
                                display: 'block',
                                marginBottom: '0.35rem',
                              }}
                            >
                              Key Responsibilities:
                            </span>
                            <ul className="spoc-responsibilities-list">
                              {spoc.responsibilities.map((resp, rIdx) => (
                                <li key={rIdx} className="spoc-resp-item">
                                  <span style={{ color: '#ea580c', fontWeight: 800 }}>•</span>
                                  <span>{resp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Panel 5: Gothram & Sankalpam Registration Form & Families */}
        {activeTab === 'sankalpam' && (
          <div className="ganesh-contributors-card">
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
          </div>
        )}

        {/* Hidden Gothram Modal trigger if on another tab */}
        {activeTab !== 'sankalpam' && isGothramModalOpen && (
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
        )}
          </>
        )}

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

      {/* Floating Bottom Navigation */}
      <GaneshBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenContributeModal={() => setIsPayModalOpen(true)}
      />
    </div>
  );
};
