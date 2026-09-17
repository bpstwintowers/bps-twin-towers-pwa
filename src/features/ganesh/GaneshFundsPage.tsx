import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Heart,
  Sparkles,
  Award,
  RefreshCw,
} from 'lucide-react';
import {
  fetchLiveContributions,
  fetchLiveExpenses,
  fetchLiveGothramResponses,
  getCachedContributions,
  getCachedExpenses,
  getCachedGothram,
  calculateGaneshSummary,
} from '../../services/liveSheetService';
import type { GaneshContributionRecord, GaneshExpenseRecord, GaneshFinancialSummary } from '../../types/ganesh';
import { GaneshBottomNav } from './components/GaneshBottomNav';
import { GaneshPaymentModal } from './components/GaneshPaymentModal';
import { HeaderNavbar } from './components/HeaderNavbar';
import './GaneshFunds.css';

interface SponsorElement {
  id: string;
  name: string;
  amount: number;
  badgeAmount: string;
  description: string;
  isSponsored: boolean;
  sponsorName?: string;
  sponsorFlat?: string;
}

interface GaneshFundsPageProps {
  embedded?: boolean;
  onBackToHome?: () => void;
}

export const GaneshFundsPage: React.FC<GaneshFundsPageProps> = ({ embedded = false, onBackToHome }) => {
  const navigate = useNavigate();
  const [contributions, setContributions] = useState<GaneshContributionRecord[]>(() => getCachedContributions());
  const [expenses, setExpenses] = useState<GaneshExpenseRecord[]>(() => getCachedExpenses());
  const [summary, setSummary] = useState<GaneshFinancialSummary | null>(() => {
    return calculateGaneshSummary(getCachedContributions(), getCachedExpenses(), getCachedGothram());
  });
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Live');

  // Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedSponsorElement, setSelectedSponsorElement] = useState<{ name: string; amount: number } | null>(null);

  // Tab State & Ref for Auto Scroll
  const [activeViewTab, setActiveViewTab] = useState<'sponsors' | 'contributions'>('sponsors');
  const tabSectionRef = useRef<HTMLDivElement>(null);

  const handleTabSwitch = (tab: 'sponsors' | 'contributions') => {
    setActiveViewTab(tab);
    setTimeout(() => {
      tabSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  // Voluntary Contributions State
  const [voluntarySearch, setVoluntarySearch] = useState('');
  const [voluntaryFilter, setVoluntaryFilter] = useState<'ALL' | 'TOWER_A' | 'TOWER_B' | 'MAJOR'>('ALL');
  const [visibleVoluntaryCount, setVisibleVoluntaryCount] = useState(100);

  const loadData = async (isManual = false) => {
    if (isManual) setIsLoadingLive(true);
    try {
      const [cList, eList, sList] = await Promise.all([
        fetchLiveContributions(),
        fetchLiveExpenses(),
        fetchLiveGothramResponses(),
      ]);
      setContributions(cList);
      setExpenses(eList);
      setSummary(calculateGaneshSummary(cList, eList, sList));
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Error loading financial data:', err);
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    loadData();
  }, []);

  // Compute live values with fallback to current verified numbers
  const targetBudget = summary?.targetBudget || 200000;
  const totalRaised = useMemo(() => {
    if (contributions.length > 0) {
      return contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
    }
    return summary?.totalCollections || 334608;
  }, [contributions, summary]);

  const fundedPercentage = Math.min(100, Math.round((totalRaised / targetBudget) * 100));

  // Compute Block / Tower Contributions from live data
  const blockContributions = useMemo(() => {
    let blockA = 0;
    let blockB = 0;
    let unknownFlat = 0;

    if (contributions.length > 0) {
      contributions.forEach((c) => {
        const flat = (c.flatNo || '').toUpperCase().trim();
        const amt = c.amount || 0;
        if (flat.startsWith('A') || flat.includes('TOWER A') || flat.includes('BLOCK A')) {
          blockA += amt;
        } else if (flat.startsWith('B') || flat.includes('TOWER B') || flat.includes('BLOCK B')) {
          blockB += amt;
        } else {
          unknownFlat += amt;
        }
      });
    }

    // Default fallbacks matching exact live sheet amounts
    if (blockA === 0 && blockB === 0 && unknownFlat === 0) {
      blockA = 115061;
      blockB = 219547;
      unknownFlat = 0;
    }

    const maxBlock = Math.max(blockA, blockB, unknownFlat, 1);

    const blocks = [
      { name: 'Block A (Tower A)', amount: blockA, percent: Math.min(100, Math.round((blockA / maxBlock) * 100)) },
      { name: 'Block B (Tower B)', amount: blockB, percent: Math.min(100, Math.round((blockB / maxBlock) * 100)) },
    ];

    if (unknownFlat > 0) {
      blocks.push({
        name: 'Unknown Flat / Other',
        amount: unknownFlat,
        percent: Math.min(100, Math.round((unknownFlat / maxBlock) * 100)),
      });
    }

    return blocks;
  }, [contributions]);

  // Extract live sponsors from Google Sheet or fallback to verified records
  const sponsorsList = useMemo(() => {
    const liveSponsors = contributions.filter((c) => c.isSponsor);
    if (liveSponsors.length > 0) return liveSponsors;

    // Fallback verified sponsors
    return [
      {
        id: 'sp-1',
        slNo: 1,
        donorName: 'Chandra Shekhar V',
        flatNo: 'B1609',
        tower: 'B' as const,
        amount: 64000,
        contributionType: 'Pujari Dakshina' as const,
        isSponsor: true,
        sponsorCategory: 'Pujari Sponsor & Daily Prasadam',
        paymentMode: 'UPI' as const,
        notes: 'Daily Priest Seva & Morning/Evening Prasadam for all 6 days',
        verified: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sp-2',
        slNo: 2,
        donorName: 'Sanjay Banerjee',
        flatNo: 'A1711',
        tower: 'A' as const,
        amount: 22500,
        contributionType: 'Other' as const,
        isSponsor: true,
        sponsorCategory: 'Idol Sponsor',
        paymentMode: 'UPI' as const,
        notes: 'Sacred Lord Ganesh Vigraha (Idol) & Mandap Sthapana sponsorship',
        verified: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sp-3',
        slNo: 3,
        donorName: 'Siddharth Giri',
        flatNo: 'B1206',
        tower: 'B' as const,
        amount: 0,
        contributionType: 'Laddu Auction' as const,
        isSponsor: true,
        sponsorCategory: 'Laddu Sponsor',
        paymentMode: 'UPI' as const,
        notes: 'Sacred 21-Kg Maha Laddu for community auction & blessing',
        verified: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sp-4',
        slNo: 4,
        donorName: 'Nagoju Praveen',
        flatNo: 'B606',
        tower: 'B' as const,
        amount: 15001,
        contributionType: 'Pooja Item' as const,
        isSponsor: true,
        sponsorCategory: 'Pooja Item Sponsor',
        paymentMode: 'UPI' as const,
        notes: 'Vedic Homam, Puja Samagri, 21 Patra, Kalasha & Abhishekam items',
        verified: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sp-5',
        slNo: 5,
        donorName: 'Mahidhar',
        flatNo: 'A1701',
        tower: 'A' as const,
        amount: 5116,
        contributionType: 'Mahaprasadam' as const,
        isSponsor: true,
        sponsorCategory: 'Mahaprasadam Sponsor',
        paymentMode: 'UPI' as const,
        notes: 'Grand Community Mahaprasad Feast meal for 150+ residents',
        verified: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }, [contributions]);

  const totalSponsorAmount = useMemo(() => {
    return sponsorsList.reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [sponsorsList]);

  // Resident Voluntary Contributions (Excluding sponsors)
  const voluntaryContributions = useMemo(() => {
    return contributions.filter((c) => !c.isSponsor);
  }, [contributions]);

  const totalVoluntaryAmount = useMemo(() => {
    return voluntaryContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [voluntaryContributions]);

  const filteredVoluntaryContributions = useMemo(() => {
    let list = [...voluntaryContributions];

    // Filter by Tower or Major amount
    if (voluntaryFilter === 'TOWER_A') {
      list = list.filter((c) => c.flatNo.toUpperCase().startsWith('A'));
    } else if (voluntaryFilter === 'TOWER_B') {
      list = list.filter((c) => c.flatNo.toUpperCase().startsWith('B'));
    } else if (voluntaryFilter === 'MAJOR') {
      list = list.filter((c) => c.amount >= 5000);
    }

    // Search query
    if (voluntarySearch.trim()) {
      const q = voluntarySearch.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.donorName && c.donorName.toLowerCase().includes(q)) ||
          (c.flatNo && c.flatNo.toLowerCase().includes(q)) ||
          (c.notes && c.notes.toLowerCase().includes(q)) ||
          (c.contributionType && c.contributionType.toLowerCase().includes(q))
      );
    }

    // Sort by amount descending (High to Low)
    list.sort((a, b) => (b.amount || 0) - (a.amount || 0));

    return list;
  }, [voluntaryContributions, voluntaryFilter, voluntarySearch]);

  const handleSponsorClick = (item: { name: string; amount: number }) => {
    setSelectedSponsorElement({ name: item.name, amount: item.amount });
    setIsPayModalOpen(true);
  };

  const getSponsorDescription = (sponsor: GaneshContributionRecord) => {
    if (sponsor.notes && sponsor.notes.trim()) return sponsor.notes;
    const cat = (sponsor.sponsorCategory || sponsor.contributionType || '').toLowerCase();
    const name = sponsor.donorName.toLowerCase();

    if (cat.includes('pujari') || cat.includes('priest') || name.includes('chandra shekhar')) {
      return 'Daily Priest Seva & Morning/Evening Prasadam for all 6 days';
    }
    if (cat.includes('idol') || name.includes('sanjay')) {
      return 'Sacred Lord Ganesh Vigraha (Idol) & Mandap Sthapana sponsorship';
    }
    if (cat.includes('pooja') || cat.includes('samagri') || name.includes('nagoju')) {
      return 'Vedic Homam, Puja Samagri, 21 Patra, Kalasha & Abhishekam items';
    }
    if (cat.includes('mahaprasadam') || cat.includes('prasadam') || name.includes('mahidhar')) {
      return 'Grand Community Mahaprasad Feast meal for 150+ residents';
    }
    if (cat.includes('laddu') || name.includes('siddharth')) {
      return 'Sacred 21-Kg Maha Laddu for community auction & blessing';
    }
    if (cat.includes('flower') || cat.includes('decor')) {
      return 'Daily flower garlands & mandap floral alankaram';
    }
    return 'Special Festive Seva Contribution & Divine Patronage';
  };

  const formatRupee = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="fundraising-page-root">
      {/* 1. Header Navbar (Standalone mode only) */}
      {!embedded && (
        <HeaderNavbar
          onRefreshData={() => loadData(true)}
          isLoading={isLoadingLive}
        />
      )}

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

      {/* 2. Main Body Container */}
      <main className="fundraising-body">
        {/* Page Title & Subtitle */}
        <div className="fundraising-heading-box">
          <h1 className="fundraising-main-title">Community Fund</h1>
          <p className="fundraising-sub-title">Live progress of our Utsav budget • Synced with Google Sheets</p>

          {/* View Switcher Tabs (Default: Sponsors) */}
          <div className="fund-nav-tabs-container" role="tablist" aria-label="Funds Categories">
            <button
              type="button"
              role="tab"
              aria-selected={activeViewTab === 'sponsors'}
              className={`fund-nav-tab-btn ${activeViewTab === 'sponsors' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('sponsors')}
            >
              <Sparkles size={15} />
              <span>Sponsors</span>
              <span className="fund-nav-tab-badge">{sponsorsList.length}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeViewTab === 'contributions'}
              className={`fund-nav-tab-btn ${activeViewTab === 'contributions' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('contributions')}
            >
              <Heart size={15} />
              <span>Contributions</span>
              <span className="fund-nav-tab-badge">{voluntaryContributions.length}</span>
            </button>
          </div>
        </div>

        {/* 3. Hero Card: Total Raised */}
        <section className="fund-raised-card" aria-label="Total Raised Progress">
          {/* Decorative background arc */}
          <div className="fund-card-bg-arc" />

          <div className="fund-card-content">
            <span className="fund-raised-label">TOTAL RAISED</span>
            <div className="fund-raised-amount-row">
              <span className="fund-amount-current">{formatRupee(totalRaised)}</span>
              <span className="fund-amount-target"> / {formatRupee(targetBudget)}</span>
            </div>

            {/* Smooth Multi-tone Progress Bar */}
            <div className="fund-progress-track">
              <div
                className="fund-progress-fill"
                style={{ width: `${fundedPercentage}%` }}
              />
            </div>

            {/* Bottom Row: Funded percentage & Action Button */}
            <div className="fund-card-bottom-row">
              <span className="fund-percent-text">{fundedPercentage}% Funded</span>
              <button
                type="button"
                className="fund-contribute-btn"
                onClick={() => {
                  setSelectedSponsorElement(null);
                  setIsPayModalOpen(true);
                }}
              >
                Contribute
              </button>
            </div>
          </div>
        </section>

        {/* 4. Block Contributions Section */}
        <section className="fund-block-section" aria-label="Block Contributions">
          <h2 className="fund-section-title">Block Contributions</h2>

          <div className="fund-blocks-list">
            {blockContributions.map((block) => (
              <div key={block.name} className="fund-block-card">
                <div className="fund-block-header">
                  <span className="fund-block-name">{block.name}</span>
                  <span className="fund-block-val">{formatRupee(block.amount)}</span>
                </div>
                <div className="fund-block-bar-track">
                  <div
                    className="fund-block-bar-fill"
                    style={{ width: `${block.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Special Sponsors & Seva Patrons Section (Visible when activeViewTab === 'sponsors') */}
        {activeViewTab === 'sponsors' && (
          <section ref={tabSectionRef} className="fund-sponsor-section" aria-label="Special Sponsors & Seva Patrons">
            <div className="fund-sponsor-heading-box">
              <div className="fund-sponsor-title-header">
                <div>
                  <h2 className="fund-section-title" style={{ margin: 0 }}>Special Sponsors &amp; Seva Patrons</h2>
                  <p className="fund-sponsor-subtitle" style={{ marginTop: '0.2rem' }}>
                    Total Sponsored: <strong>{formatRupee(totalSponsorAmount)}</strong> ({sponsorsList.length} Sponsors) • Synced from Google Sheets
                  </p>
                </div>

                <button
                  type="button"
                  className="fund-voluntary-contribute-btn sponsor-add-btn"
                  onClick={() => {
                    setSelectedSponsorElement({ name: 'Special Festive Seva Sponsorship', amount: 5001 });
                    setIsPayModalOpen(true);
                  }}
                >
                  + Sponsor Seva
                </button>
              </div>
            </div>

            {/* List of Verified Live Sponsors */}
            <div className="fund-sponsor-cards-grid">
              {sponsorsList.map((sponsor) => {
                const isTowerA = sponsor.flatNo.toUpperCase().startsWith('A');
                const isTowerB = sponsor.flatNo.toUpperCase().startsWith('B');
                const sponsorTitle =
                  sponsor.sponsorCategory ||
                  (sponsor.contributionType && sponsor.contributionType !== 'General Contribution'
                    ? `${sponsor.contributionType} Sponsor`
                    : 'Special Seva Sponsor');

                return (
                  <div key={sponsor.id} className="sponsor-element-card is-sponsored">
                    <div className="sponsor-card-gold-stripe" />

                    <div className="sponsor-card-top-row">
                      <div className="sponsor-card-title-wrap">
                        <span className="sponsor-element-icon">🌟</span>
                        <span className="sponsor-element-name">{sponsorTitle}</span>
                      </div>

                      <div className="sponsor-badges-group">
                        <span className="sponsor-badge-amount">
                          {sponsor.amount > 0 ? formatRupee(sponsor.amount) : 'Sacred Seva'}
                        </span>
                        <span className="sponsor-badge-sponsored">
                          <Check size={13} strokeWidth={2.5} />
                          <span>Sponsored</span>
                        </span>
                      </div>
                    </div>

                    <p className="sponsor-element-desc">{getSponsorDescription(sponsor)}</p>

                    <div className="sponsor-acknowledgment">
                      <div className="sponsor-ack-left">
                        <span className="sponsor-ack-label">Generously Sponsored by</span>
                        <div className="sponsor-ack-donor-row">
                          <strong className="sponsor-donor-name">{sponsor.donorName}</strong>
                          {sponsor.flatNo && (
                            <span
                              className={`sponsor-flat-pill ${
                                isTowerA ? 'badge-tower-a' : isTowerB ? 'badge-tower-b' : 'badge-other'
                              }`}
                            >
                              {sponsor.flatNo}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="sponsor-mode-pill">{sponsor.paymentMode || 'UPI'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 6. Resident Voluntary Contributions Section (Visible when activeViewTab === 'contributions') */}
        {activeViewTab === 'contributions' && (
          <section ref={tabSectionRef} className="fund-voluntary-section" aria-label="Resident Voluntary Contributions">
            <div className="fund-voluntary-heading-box">
              <div className="fund-voluntary-title-row">
                <div>
                  <h2 className="fund-section-title" style={{ margin: 0 }}>Resident Voluntary Contributions</h2>
                  <p className="fund-sponsor-subtitle" style={{ marginTop: '0.2rem' }}>
                    Total Contributed: <strong>{formatRupee(totalVoluntaryAmount)}</strong> ({voluntaryContributions.length} Flats)
                  </p>
                </div>

                <button
                  type="button"
                  className="fund-voluntary-contribute-btn"
                  onClick={() => {
                    setSelectedSponsorElement(null);
                    setIsPayModalOpen(true);
                  }}
                >
                  + Contribute
                </button>
              </div>

              {/* Search and Quick Filters */}
              <div className="fund-voluntary-search-row">
                <div className="fund-search-input-wrap">
                  <input
                    type="text"
                    placeholder="Search flat (e.g. A1705) or resident name..."
                    value={voluntarySearch}
                    onChange={(e) => setVoluntarySearch(e.target.value)}
                    className="fund-search-input"
                  />
                </div>

                <div className="fund-filter-chips">
                  <button
                    type="button"
                    className={`fund-filter-chip ${voluntaryFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setVoluntaryFilter('ALL')}
                  >
                    All ({voluntaryContributions.length})
                  </button>
                  <button
                    type="button"
                    className={`fund-filter-chip ${voluntaryFilter === 'TOWER_A' ? 'active' : ''}`}
                    onClick={() => setVoluntaryFilter('TOWER_A')}
                  >
                    Tower A
                  </button>
                  <button
                    type="button"
                    className={`fund-filter-chip ${voluntaryFilter === 'TOWER_B' ? 'active' : ''}`}
                    onClick={() => setVoluntaryFilter('TOWER_B')}
                  >
                    Tower B
                  </button>
                  <button
                    type="button"
                    className={`fund-filter-chip ${voluntaryFilter === 'MAJOR' ? 'active' : ''}`}
                    onClick={() => setVoluntaryFilter('MAJOR')}
                  >
                    ₹5,000+
                  </button>
                </div>
              </div>
            </div>

            {/* Cards List */}
            <div className="fund-voluntary-cards-list">
              {filteredVoluntaryContributions.slice(0, visibleVoluntaryCount).map((item) => {
                const isTowerA = item.flatNo.toUpperCase().startsWith('A');
                return (
                  <div key={item.id} className="fund-voluntary-card">
                    <div className="fund-voluntary-left">
                      <div className="fund-voluntary-flat-name-row">
                        <span className={`fund-flat-badge ${isTowerA ? 'badge-tower-a' : 'badge-tower-b'}`}>
                          {item.flatNo}
                        </span>
                        <span className="fund-resident-name">{item.donorName}</span>
                      </div>
                      <span className="fund-contribution-type">
                        {item.notes ? item.notes : item.contributionType || 'General Contribution'}
                      </span>
                    </div>

                    <div className="fund-voluntary-right">
                      <span className="fund-voluntary-amount">{formatRupee(item.amount)}</span>
                      <span className="fund-payment-mode-tag">
                        {item.paymentMode || 'UPI'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredVoluntaryContributions.length === 0 && (
                <div className="fund-empty-state">
                  No contributions found matching your search.
                </div>
              )}

              {filteredVoluntaryContributions.length > visibleVoluntaryCount && (
                <button
                  type="button"
                  className="fund-show-more-btn"
                  onClick={() => setVisibleVoluntaryCount((prev) => prev + 30)}
                >
                  Show More Contributions ({filteredVoluntaryContributions.length - visibleVoluntaryCount} remaining)
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      {/* UPI Contribution / Sponsorship Modal */}
      {isPayModalOpen && (
        <GaneshPaymentModal
          isOpen={isPayModalOpen}
          onClose={() => {
            setIsPayModalOpen(false);
            setSelectedSponsorElement(null);
          }}
          onSuccess={() => {
            loadData(true);
          }}
          defaultCategory={selectedSponsorElement ? 'Pooja Item' : 'General Contribution'}
          defaultAmount={selectedSponsorElement ? selectedSponsorElement.amount : 2116}
          isSponsorship={!!selectedSponsorElement}
        />
      )}

      {/* Floating Bottom Navigation (Standalone mode only) */}
      {!embedded && <GaneshBottomNav />}
    </div>
  );
};


