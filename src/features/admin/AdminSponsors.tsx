import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  CheckCircle,
  XCircle,
  PlusCircle,
  Search,
  Filter,
  Receipt,
  Globe,
  Building,
  Coins,
  Gift,
  Clock,
  CheckCircle2,
  Edit,
  X,
  RefreshCw,
  TrendingUp,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Check,
  Crown,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  fetchSponsorSummary,
  fetchSponsorTiers,
  fetchAdminSponsors,
  fetchAdminSponsorships,
  fetchAdminContributions,
  approveAdminSponsorship,
  rejectAdminSponsorship,
  verifyAdminContribution,
  rejectAdminContribution,
  type SponsorSummary,
  type SponsorTierItem,
  type SponsorItem,
  type SponsorshipItem,
  type SponsorContributionItem,
} from '../../services/supabase/sponsorService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SponsorTierModal } from './SponsorTierModal';
import { SponsorApplicationModal } from '../sponsors/SponsorApplicationModal';
import './AdminPortal.css';
import './AdminSponsors.css';

type SponsorSubTab = 'approvals' | 'sponsorships' | 'tiers' | 'contributions';
type StatusFilterType = 'ALL' | 'Pending' | 'Approved' | 'Active' | 'Completed' | 'Rejected';

export const AdminSponsors: React.FC = () => {
  const [subTab, setSubTab] = useState<SponsorSubTab>('approvals');
  const [summary, setSummary] = useState<SponsorSummary | null>(null);
  const [tiers, setTiers] = useState<SponsorTierItem[]>([]);
  const [sponsorships, setSponsorships] = useState<SponsorshipItem[]>([]);
  const [contributions, setContributions] = useState<SponsorContributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');

  // Modals
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<SponsorTierItem | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  // Reject Modal
  const [rejectType, setRejectType] = useState<'sponsorship' | 'contribution' | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectTargetName, setRejectTargetName] = useState<string>('');
  const [rejectReason, setRejectReason] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [sumData, tiersData, shipsData, contribData] = await Promise.all([
        fetchSponsorSummary(),
        fetchSponsorTiers(),
        fetchAdminSponsorships(),
        fetchAdminContributions(),
      ]);

      setSummary(sumData);
      setTiers(tiersData);
      setSponsorships(shipsData);
      setContributions(contribData);
    } catch (err: any) {
      console.error('Error loading admin sponsor data:', err);
      setError('Failed to load sponsor records. Please try refreshing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-dismiss success alert after 4 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleApproveSponsorship = async (id: string) => {
    try {
      setActionLoading(true);
      setError(null);
      await approveAdminSponsorship(id);
      setSuccess('Sponsorship officially approved & activated!');
      await loadData(true);
    } catch (err: any) {
      setError(err.message || 'Failed to approve sponsorship.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyContribution = async (id: string) => {
    try {
      setActionLoading(true);
      setError(null);
      await verifyAdminContribution(id);
      setSuccess('Contribution verified and recorded in society accounts.');
      await loadData(true);
    } catch (err: any) {
      setError(err.message || 'Failed to verify contribution.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTargetId || !rejectReason.trim()) {
      setError('Rejection reason is required.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      if (rejectType === 'sponsorship') {
        await rejectAdminSponsorship(rejectTargetId, rejectReason);
        setSuccess('Sponsorship application has been rejected.');
      } else {
        await rejectAdminContribution(rejectTargetId, rejectReason);
        setSuccess('Contribution entry has been rejected.');
      }
      setRejectType(null);
      setRejectTargetId(null);
      setRejectReason('');
      await loadData(true);
    } catch (err: any) {
      setError(err.message || 'Failed to execute rejection.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter pending queues
  const pendingSponsorships = useMemo(() => {
    return sponsorships.filter((s) => s.status === 'Pending Approval');
  }, [sponsorships]);

  const pendingContributions = useMemo(() => {
    return contributions.filter((c) => c.status === 'Pending');
  }, [contributions]);

  // Filtered sponsorships list
  const filteredSponsorships = useMemo(() => {
    return sponsorships.filter((s) => {
      const matchesSearch =
        !search.trim() ||
        (s.sponsor?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.sponsor?.contact_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.event?.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.campaign?.title || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'Pending' && s.status.includes('Pending')) ||
        (statusFilter === 'Approved' && s.status === 'Approved') ||
        (statusFilter === 'Active' && s.status === 'Active') ||
        (statusFilter === 'Completed' && s.status === 'Completed') ||
        (statusFilter === 'Rejected' && s.status === 'Rejected');

      return matchesSearch && matchesStatus;
    });
  }, [sponsorships, search, statusFilter]);

  // Filtered contributions list
  const filteredContributions = useMemo(() => {
    return contributions.filter((c) => {
      const matchesSearch =
        !search.trim() ||
        (c.receipt_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.payment_reference || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.sponsorship?.sponsor?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.sponsorship?.event?.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.sponsorship?.campaign?.title || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'Pending' && c.status === 'Pending') ||
        (statusFilter === 'Approved' && c.status === 'Verified') ||
        (statusFilter === 'Active' && c.status === 'Verified') ||
        (statusFilter === 'Rejected' && c.status === 'Rejected');

      return matchesSearch && matchesStatus;
    });
  }, [contributions, search, statusFilter]);

  const getTierBadgeClass = (tierName?: string) => {
    if (!tierName) return 'default';
    const lower = tierName.toLowerCase();
    if (lower.includes('platinum') || lower.includes('title')) return 'platinum';
    if (lower.includes('gold')) return 'gold';
    if (lower.includes('silver')) return 'silver';
    if (lower.includes('bronze')) return 'bronze';
    return 'default';
  };

  return (
    <div className="admin-sponsors-container animate-fade-in">
      {/* 1. Header Bar with Real-time Synchronize & Quick Actions */}
      <div className="sponsors-header-bar">
        <div className="sponsors-title-wrap">
          <div className="sponsors-title-icon">
            <Award size={22} />
          </div>
          <div className="sponsors-title-text">
            <h2>Sponsors & Corporate Partners</h2>
            <p>Corporate sponsorships, event branding partners, tier packages & verification ledger.</p>
          </div>
        </div>

        <div className="sponsors-header-actions">
          <button
            className="btn-header-refresh"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            title="Refresh records"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            className="btn-primary"
            onClick={() => setIsApplicationModalOpen(true)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.84rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'linear-gradient(135deg, #00897b, #00695c)',
              borderRadius: '9999px',
            }}
          >
            <PlusCircle size={15} />
            <span>New Sponsorship</span>
          </button>

          <button
            className="btn-primary"
            onClick={() => {
              setEditingTier(null);
              setIsTierModalOpen(true);
            }}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.84rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderRadius: '9999px',
            }}
          >
            <Crown size={15} />
            <span>New Tier</span>
          </button>
        </div>
      </div>

      {/* 2. Top-level Alert Banners */}
      {success && (
        <div
          style={{
            padding: '0.85rem 1.15rem',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '12px',
            color: '#065f46',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px -2px rgba(16, 185, 129, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <CheckCircle2 size={18} color="#059669" />
            <span>{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#065f46' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '0.85rem 1.15rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            color: '#991b1b',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px -2px rgba(239, 68, 68, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <AlertCircle size={18} color="#dc2626" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#991b1b' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 3. Luxury KPI Stats Cards */}
      <div className="sponsors-kpi-grid">
        {/* Card 1: Verified Cash */}
        <div className="sponsor-kpi-card gold">
          <div className="sponsor-kpi-top">
            <div className="sponsor-kpi-icon gold">
              <Coins size={20} />
            </div>
            <span className="sponsor-kpi-pill gold">Cash Fund</span>
          </div>
          <div>
            <div className="sponsor-kpi-value" style={{ color: '#d97706' }}>
              ₹{(summary?.verified_cash_amount ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="sponsor-kpi-label">Verified Sponsor Cash</div>
          </div>
        </div>

        {/* Card 2: In-Kind Valuation */}
        <div className="sponsor-kpi-card blue">
          <div className="sponsor-kpi-top">
            <div className="sponsor-kpi-icon blue">
              <Gift size={20} />
            </div>
            <span className="sponsor-kpi-pill blue">Goods & Services</span>
          </div>
          <div>
            <div className="sponsor-kpi-value" style={{ color: '#2563eb' }}>
              ₹{(summary?.verified_in_kind_estimated_value ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="sponsor-kpi-label">In-Kind Estimated Value</div>
          </div>
        </div>

        {/* Card 3: Total Portfolio */}
        <div className="sponsor-kpi-card emerald">
          <div className="sponsor-kpi-top">
            <div className="sponsor-kpi-icon emerald">
              <TrendingUp size={20} />
            </div>
            <span className="sponsor-kpi-pill emerald">Combined</span>
          </div>
          <div>
            <div className="sponsor-kpi-value" style={{ color: '#059669' }}>
              ₹{(summary?.total_sponsorship_value ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="sponsor-kpi-label">Total Sponsorship Value</div>
          </div>
        </div>

        {/* Card 4: Active Brands */}
        <div className="sponsor-kpi-card purple">
          <div className="sponsor-kpi-top">
            <div className="sponsor-kpi-icon purple">
              <Building size={20} />
            </div>
            <span className="sponsor-kpi-pill purple">Partners</span>
          </div>
          <div>
            <div className="sponsor-kpi-value" style={{ color: '#7c3aed' }}>
              {summary?.active_sponsorships ?? 0}
            </div>
            <div className="sponsor-kpi-label">Active Sponsorships</div>
          </div>
        </div>
      </div>

      {/* 4. Sub-Navigation Tabs Switcher */}
      <div className="sponsors-nav-tabs">
        <button
          className={`sponsors-nav-tab ${subTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setSubTab('approvals')}
        >
          <Clock size={15} />
          <span>Approvals & Verification</span>
          {pendingSponsorships.length + pendingContributions.length > 0 && (
            <span className="sponsors-tab-badge">
              {pendingSponsorships.length + pendingContributions.length}
            </span>
          )}
        </button>

        <button
          className={`sponsors-nav-tab ${subTab === 'sponsorships' ? 'active' : ''}`}
          onClick={() => setSubTab('sponsorships')}
        >
          <Award size={15} />
          <span>Sponsor Directory</span>
          <span className="sponsors-tab-count">{sponsorships.length}</span>
        </button>

        <button
          className={`sponsors-nav-tab ${subTab === 'tiers' ? 'active' : ''}`}
          onClick={() => setSubTab('tiers')}
        >
          <Crown size={15} />
          <span>Tiers & Packages</span>
          <span className="sponsors-tab-count">{tiers.length}</span>
        </button>

        <button
          className={`sponsors-nav-tab ${subTab === 'contributions' ? 'active' : ''}`}
          onClick={() => setSubTab('contributions')}
        >
          <Receipt size={15} />
          <span>Contributions Ledger</span>
          <span className="sponsors-tab-count">{contributions.length}</span>
        </button>
      </div>

      {/* 5. Live Search & Filter Controls (For Directory & Ledger) */}
      {(subTab === 'sponsorships' || subTab === 'contributions') && (
        <div className="sponsors-controls-bar">
          <div className="sponsors-search-box">
            <Search size={15} className="sponsors-search-icon" />
            <input
              type="text"
              className="sponsors-search-input"
              placeholder={
                subTab === 'sponsorships'
                  ? 'Search by sponsor name, contact, event...'
                  : 'Search by receipt #, transaction ref, sponsor...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="sponsors-filter-pills">
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginRight: '0.25rem' }}>
              Filter:
            </span>
            {(['ALL', 'Pending', 'Active', 'Approved', 'Rejected'] as StatusFilterType[]).map((st) => (
              <button
                key={st}
                className={`sponsor-filter-pill ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'ALL' ? 'All Statuses' : st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1: APPROVALS & VERIFICATION QUEUE
         ========================================================================= */}
      {subTab === 'approvals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section A: Pending Sponsorship Proposals */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} color="#f59e0b" />
                <span>Pending Sponsorship Applications</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: pendingSponsorships.length > 0 ? '#fef3c7' : '#f1f5f9',
                    color: pendingSponsorships.length > 0 ? '#b45309' : '#64748b',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    fontWeight: 700,
                  }}
                >
                  {pendingSponsorships.length}
                </span>
              </h3>
            </div>

            {pendingSponsorships.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1rem',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 0.5rem', display: 'block' }} />
                <h4 style={{ fontSize: '1rem', color: '#0f172a', margin: '0 0 0.25rem', fontWeight: 600 }}>
                  Queue Clear
                </h4>
                <p style={{ fontSize: '0.84rem', margin: 0 }}>
                  No pending corporate or community sponsorship applications awaiting review.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {pendingSponsorships.map((s) => {
                  const contrib = s.contributions?.[0];
                  return (
                    <div key={s.id} className="sponsor-card-item">
                      <div className="sponsor-card-header">
                        <div className="sponsor-brand-info">
                          <div className="sponsor-logo-avatar">
                            {s.sponsor?.logo_url ? (
                              <img src={s.sponsor.logo_url} alt={s.sponsor.name} />
                            ) : (
                              s.sponsor?.name?.charAt(0) || 'S'
                            )}
                          </div>
                          <div>
                            <h4 className="sponsor-name-title">{s.sponsor?.name}</h4>
                            <span className="sponsor-type-chip">{s.sponsor?.sponsor_type}</span>
                            {s.tier && (
                              <span className={`tier-badge ${getTierBadgeClass(s.tier.name)}`} style={{ marginLeft: '0.4rem' }}>
                                <Crown size={11} />
                                {s.tier.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>

                      <div className="sponsor-card-details-grid">
                        <div className="sponsor-detail-row">
                          <span className="sponsor-detail-label">Initiative Target</span>
                          <span className="sponsor-detail-value" style={{ color: '#00897b' }}>
                            {s.event?.title || s.campaign?.title || 'Community Initiative'}
                          </span>
                        </div>
                        <div className="sponsor-detail-row">
                          <span className="sponsor-detail-label">Contact Person</span>
                          <span className="sponsor-detail-value">
                            {s.sponsor?.contact_name} ({s.sponsor?.phone || s.sponsor?.email || 'N/A'})
                          </span>
                        </div>
                        <div className="sponsor-detail-row">
                          <span className="sponsor-detail-label">Proposed Contribution</span>
                          <span className="sponsor-detail-value" style={{ color: '#059669', fontWeight: 700 }}>
                            {contrib
                              ? contrib.contribution_type === 'Monetary'
                                ? `₹${contrib.amount?.toLocaleString('en-IN')}`
                                : `${contrib.in_kind_description} (Est ₹${contrib.in_kind_estimated_value?.toLocaleString('en-IN')})`
                              : 'Standard Package'}
                          </span>
                        </div>
                        <div className="sponsor-detail-row">
                          <span className="sponsor-detail-label">Visibility Scope</span>
                          <span className="sponsor-detail-value">{s.visibility}</span>
                        </div>
                      </div>

                      <div className="sponsor-card-actions">
                        <button
                          className="btn-sponsor-reject"
                          onClick={() => {
                            setRejectType('sponsorship');
                            setRejectTargetId(s.id);
                            setRejectTargetName(s.sponsor?.name || 'Sponsorship Application');
                            setRejectReason('');
                          }}
                          disabled={actionLoading}
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                        <button
                          className="btn-sponsor-approve"
                          onClick={() => handleApproveSponsorship(s.id)}
                          disabled={actionLoading}
                        >
                          <CheckCircle size={14} />
                          <span>Approve & Activate</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section B: Pending Contribution Verifications */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={18} color="#10b981" />
                <span>Pending Contribution Verifications</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: pendingContributions.length > 0 ? '#d1fae5' : '#f1f5f9',
                    color: pendingContributions.length > 0 ? '#065f46' : '#64748b',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    fontWeight: 700,
                  }}
                >
                  {pendingContributions.length}
                </span>
              </h3>
            </div>

            {pendingContributions.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1rem',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 0.5rem', display: 'block' }} />
                <h4 style={{ fontSize: '1rem', color: '#0f172a', margin: '0 0 0.25rem', fontWeight: 600 }}>
                  All Contributions Verified
                </h4>
                <p style={{ fontSize: '0.84rem', margin: 0 }}>
                  All monetary payments and in-kind deliveries have been verified and reconciled.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {pendingContributions.map((c) => (
                  <div key={c.id} className="sponsor-card-item">
                    <div className="sponsor-card-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h4 className="sponsor-name-title" style={{ color: '#059669' }}>
                            {c.contribution_type === 'Monetary'
                              ? `₹${c.amount?.toLocaleString('en-IN')} (via ${c.payment_method || 'Direct'})`
                              : `In-Kind: ${c.in_kind_description}`}
                          </h4>
                          <span className="sponsor-type-chip">{c.contribution_type}</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                          Sponsor Partner: <strong>{c.sponsorship?.sponsor?.name}</strong>
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="sponsor-card-details-grid">
                      <div className="sponsor-detail-row">
                        <span className="sponsor-detail-label">Receipt Reference</span>
                        <span className="sponsor-detail-value" style={{ fontFamily: 'monospace' }}>
                          {c.receipt_number}
                        </span>
                      </div>
                      <div className="sponsor-detail-row">
                        <span className="sponsor-detail-label">Transaction / UTR Ref</span>
                        <span className="sponsor-detail-value" style={{ fontFamily: 'monospace' }}>
                          {c.payment_reference || 'N/A'}
                        </span>
                      </div>
                      <div className="sponsor-detail-row">
                        <span className="sponsor-detail-label">Target Event / Campaign</span>
                        <span className="sponsor-detail-value">
                          {c.sponsorship?.event?.title || c.sponsorship?.campaign?.title || 'General Fund'}
                        </span>
                      </div>
                      {c.in_kind_estimated_value && (
                        <div className="sponsor-detail-row">
                          <span className="sponsor-detail-label">Estimated Item Value</span>
                          <span className="sponsor-detail-value" style={{ color: '#059669', fontWeight: 700 }}>
                            ₹{c.in_kind_estimated_value.toLocaleString('en-IN')} ({c.in_kind_quantity} {c.in_kind_unit})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="sponsor-card-actions">
                      <button
                        className="btn-sponsor-reject"
                        onClick={() => {
                          setRejectType('contribution');
                          setRejectTargetId(c.id);
                          setRejectTargetName(c.receipt_number || 'Contribution Entry');
                          setRejectReason('');
                        }}
                        disabled={actionLoading}
                      >
                        <XCircle size={14} />
                        <span>Reject</span>
                      </button>
                      <button
                        className="btn-sponsor-approve"
                        onClick={() => handleVerifyContribution(c.id)}
                        disabled={actionLoading}
                      >
                        <CheckCircle size={14} />
                        <span>Verify & Reconcile</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: SPONSOR DIRECTORY & PARTNERSHIPS
         ========================================================================= */}
      {subTab === 'sponsorships' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
              Loading corporate sponsorships...
            </div>
          ) : filteredSponsorships.length === 0 ? (
            <div
              style={{
                padding: '3.5rem 1rem',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                textAlign: 'center',
                color: '#64748b',
              }}
            >
              <Award size={40} style={{ color: '#94a3b8', margin: '0 auto 0.75rem', display: 'block' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.35rem' }}>
                No Sponsorships Found
              </h3>
              <p style={{ fontSize: '0.85rem', margin: '0 auto 1rem', maxWidth: '400px' }}>
                No sponsor partnerships match your current search or status filters.
              </p>
              <button
                className="btn-primary"
                onClick={() => setIsApplicationModalOpen(true)}
                style={{ padding: '0.5rem 1rem', fontSize: '0.84rem' }}
              >
                + Create New Sponsorship
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
              {filteredSponsorships.map((s) => {
                const totalVerifiedVal = (s.contributions || [])
                  .filter((c) => c.status === 'Verified')
                  .reduce((sum, c) => sum + (c.amount || c.in_kind_estimated_value || 0), 0);

                return (
                  <div key={s.id} className="sponsor-card-item">
                    <div className="sponsor-card-header">
                      <div className="sponsor-brand-info">
                        <div className="sponsor-logo-avatar">
                          {s.sponsor?.logo_url ? (
                            <img src={s.sponsor.logo_url} alt={s.sponsor.name} />
                          ) : (
                            s.sponsor?.name?.charAt(0) || 'S'
                          )}
                        </div>
                        <div>
                          <h4 className="sponsor-name-title">{s.sponsor?.name}</h4>
                          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem', alignItems: 'center' }}>
                            <span className="sponsor-type-chip">{s.sponsor?.sponsor_type}</span>
                            {s.tier && (
                              <span className={`tier-badge ${getTierBadgeClass(s.tier.name)}`}>
                                <Crown size={11} />
                                {s.tier.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>

                    <div className="sponsor-card-details-grid">
                      <div className="sponsor-detail-row">
                        <span className="sponsor-detail-label">Linked Initiative</span>
                        <span className="sponsor-detail-value" style={{ color: '#00897b' }}>
                          {s.event?.title || s.campaign?.title || 'Society Wide Partner'}
                        </span>
                      </div>
                      <div className="sponsor-detail-row">
                        <span className="sponsor-detail-label">Verified Value</span>
                        <span className="sponsor-detail-value" style={{ color: '#059669', fontWeight: 700 }}>
                          ₹{totalVerifiedVal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="sponsor-detail-row">
                        <span className="sponsor-detail-label">Contact Person</span>
                        <span className="sponsor-detail-value">
                          {s.sponsor?.contact_name || 'Direct Brand'}
                        </span>
                      </div>
                      <div className="sponsor-detail-row">
                        <span className="sponsor-detail-label">Visibility</span>
                        <span className="sponsor-detail-value">{s.visibility}</span>
                      </div>
                    </div>

                    {/* Contact links */}
                    <div style={{ display: 'flex', gap: '0.65rem', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
                      {s.sponsor?.email && (
                        <a
                          href={`mailto:${s.sponsor.email}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#2563eb', textDecoration: 'none' }}
                        >
                          <Mail size={12} /> {s.sponsor.email}
                        </a>
                      )}
                      {s.sponsor?.phone && (
                        <a
                          href={`tel:${s.sponsor.phone}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#059669', textDecoration: 'none' }}
                        >
                          <Phone size={12} /> {s.sponsor.phone}
                        </a>
                      )}
                      {s.sponsor?.website && (
                        <a
                          href={s.sponsor.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b', textDecoration: 'none' }}
                        >
                          <ExternalLink size={12} /> Website
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: TIERS & PACKAGES
         ========================================================================= */}
      {subTab === 'tiers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Corporate Sponsorship Tiers
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                Defined sponsorship levels, minimum contribution commitments, and resident exhibition benefits.
              </p>
            </div>
            <button
              className="btn-primary"
              onClick={() => {
                setEditingTier(null);
                setIsTierModalOpen(true);
              }}
              style={{
                padding: '0.45rem 0.95rem',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: '9999px',
              }}
            >
              <PlusCircle size={14} />
              <span>Add New Tier</span>
            </button>
          </div>

          <div className="sponsor-tiers-grid">
            {tiers.map((t) => (
              <div key={t.id} className="sponsor-tier-card">
                <div>
                  <div className="sponsor-tier-header">
                    <span className={`tier-badge ${getTierBadgeClass(t.name)}`}>
                      <Crown size={12} />
                      {t.name}
                    </span>
                    <StatusBadge status={t.status} />
                  </div>

                  <div className="sponsor-tier-price">
                    ₹{t.minimum_amount.toLocaleString('en-IN')}{' '}
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>min pledge</span>
                  </div>

                  {t.description && <p className="sponsor-tier-desc">{t.description}</p>}

                  <div className="sponsor-tier-benefits">
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Included Privileges ({t.benefits?.length || 0}):
                    </span>
                    {(t.benefits || []).map((b, i) => (
                      <div key={i} className="sponsor-tier-benefit-item">
                        <Check size={14} />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn-outline"
                    onClick={() => {
                      setEditingTier(t);
                      setIsTierModalOpen(true);
                    }}
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Edit size={13} />
                    <span>Edit Tier</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: CONTRIBUTIONS LEDGER
         ========================================================================= */}
      {subTab === 'contributions' && (
        <div className="admin-table-container animate-fade-in">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Sponsor & Type</th>
                <th>Target Initiative</th>
                <th>Category</th>
                <th>Verified Amount / Value</th>
                <th>Payment Mode / UTR</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredContributions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                    No contribution ledger records match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredContributions.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{c.receipt_number}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
                        {new Date(c.contributed_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {c.sponsorship?.sponsor?.name || '—'}
                      </div>
                      <span className="sponsor-type-chip" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                        {c.sponsorship?.sponsor?.sponsor_type || 'Brand'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#00897b', fontWeight: 600 }}>
                      {c.sponsorship?.event?.title || c.sponsorship?.campaign?.title || 'General Community Fund'}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: c.contribution_type === 'Monetary' ? '#fef3c7' : '#dbeafe',
                          color: c.contribution_type === 'Monetary' ? '#92400e' : '#1e40af',
                        }}
                      >
                        {c.contribution_type}
                      </span>
                    </td>
                    <td>
                      {c.contribution_type === 'Monetary' ? (
                        <strong style={{ color: '#059669', fontSize: '0.92rem' }}>
                          ₹{c.amount?.toLocaleString('en-IN')}
                        </strong>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{c.in_kind_description}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {c.in_kind_quantity} {c.in_kind_unit} (Est ₹{c.in_kind_estimated_value?.toLocaleString('en-IN')})
                          </div>
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.78rem' }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>
                        {c.payment_method || 'In-Kind Delivery'}
                      </div>
                      {c.payment_reference && (
                        <div style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.72rem' }}>
                          Ref: {c.payment_reference}
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================================
          MODALS
         ========================================================================= */}
      {/* 1. TIER MODAL */}
      <SponsorTierModal
        isOpen={isTierModalOpen}
        onClose={() => setIsTierModalOpen(false)}
        onSuccess={() => loadData(true)}
        tierToEdit={editingTier}
      />

      {/* 2. SPONSORSHIP APPLICATION MODAL */}
      <SponsorApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
        onSuccess={() => {
          setSuccess('Sponsorship created and logged successfully!');
          loadData(true);
        }}
        tiers={tiers}
      />

      {/* 3. REJECTION MODAL */}
      {rejectTargetId && (
        <div className="modal-overlay" onClick={() => setRejectTargetId(null)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                Reject {rejectType === 'sponsorship' ? 'Sponsorship Application' : 'Contribution Entry'}
              </h3>
              <button onClick={() => setRejectTargetId(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.85rem' }}>
                You are rejecting the proposal for <strong style={{ color: '#0f172a' }}>{rejectTargetName}</strong>. Please provide a clear explanation for compliance records.
              </p>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#0f172a' }}>
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                className="admin-search-input"
                style={{ width: '100%', borderRadius: '10px', resize: 'vertical' }}
                placeholder="e.g. Terms do not align with community safety or branding standards..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setRejectTargetId(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button
                className="btn-sponsor-reject"
                onClick={handleConfirmReject}
                disabled={actionLoading || !rejectReason.trim()}
                style={{ padding: '0.55rem 1.25rem' }}
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
