import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartHandshake,
  ArrowLeft,
  Calendar,
  Sparkles,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Clock,
  Search,
  Filter,
} from 'lucide-react';
import {
  fetchActiveCampaigns,
  fetchUserDonations,
  type CampaignItem,
  type DonationItem,
} from '../../services/supabase/financeService';
import { resolveUserAccess, type AccessInfo } from '../../services/supabase/registrationService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DonationModal } from './DonationModal';
import './DonationList.css';

export const DonationList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'my-donations'>('campaigns');
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [myDonations, setMyDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAccess, setActiveAccess] = useState<AccessInfo[]>([]);

  // Donation Modal
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(null);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignsData, userDonationsData, accessData] = await Promise.all([
        fetchActiveCampaigns(),
        fetchUserDonations().catch(() => []),
        resolveUserAccess().catch(() => []),
      ]);
      setCampaigns(campaignsData);
      setMyDonations(userDonationsData);
      setActiveAccess(accessData);
    } catch (err) {
      console.error('Error loading donations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDonate = (campaign: CampaignItem) => {
    setSelectedCampaign(campaign);
    setIsDonationModalOpen(true);
  };

  const primaryFlat = activeAccess[0];
  const totalContributed = myDonations
    .filter((d) => d.status === 'Verified')
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="donations-container">
      {/* Header */}
      <header className="donations-header">
        <div className="donations-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn-outline"
              onClick={() => navigate('/')}
              style={{ padding: '0.45rem', borderRadius: 'var(--radius-md)' }}
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Community Donations & Finance
              </h1>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                BPS Twin Towers Society Contributions
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '0.8rem',
              color: '#34d399',
              fontWeight: 600,
            }}
          >
            My Total: ₹{totalContributed.toLocaleString('en-IN')}
          </div>
        </div>
      </header>

      <div className="donations-content">
        {/* Tab Switcher */}
        <div className="donations-tabs">
          <button
            className={`donations-tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            <TrendingUp size={16} />
            Active Campaigns ({campaigns.length})
          </button>
          <button
            className={`donations-tab-btn ${activeTab === 'my-donations' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-donations')}
          >
            <Receipt size={16} />
            My Contributions ({myDonations.length})
          </button>
        </div>

        {/* TAB 1: CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
                Loading campaigns...
              </div>
            ) : campaigns.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <HeartHandshake size={42} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.4rem' }}>No Active Campaigns</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  There are currently no active fundraising campaigns.
                </p>
              </div>
            ) : (
              <div className="campaigns-grid animate-fade-in">
                {campaigns.map((c) => {
                  const verified = c.verified_total || 0;
                  const target = c.target_amount || 0;
                  const progress = target > 0 ? Math.min(100, Math.round((verified / target) * 100)) : 0;
                  const isClosed = c.status === 'Closed';

                  return (
                    <div key={c.id} className="campaign-card">
                      <div className="campaign-banner">
                        {c.banner_url ? (
                          <img src={c.banner_url} alt={c.title} />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              background:
                                c.category === 'Festival'
                                  ? 'linear-gradient(135deg, #b45309, #78350f)'
                                  : 'linear-gradient(135deg, #065f46, #064e3b)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'rgba(255, 255, 255, 0.4)',
                            }}
                          >
                            <HeartHandshake size={36} />
                          </div>
                        )}
                        <span
                          style={{
                            position: 'absolute',
                            top: '0.75rem',
                            left: '0.75rem',
                            background: 'rgba(15, 23, 42, 0.75)',
                            backdropFilter: 'blur(8px)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: '#fff',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                          }}
                        >
                          {c.category}
                        </span>
                      </div>

                      <div className="campaign-body">
                        <h3 className="campaign-title">{c.title}</h3>
                        {c.description && (
                          <p
                            style={{
                              fontSize: '0.82rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.4,
                              marginBottom: '0.85rem',
                            }}
                          >
                            {c.description}
                          </p>
                        )}

                        {/* Financial Progress */}
                        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>
                              Collected: <strong style={{ color: '#34d399' }}>₹{verified.toLocaleString('en-IN')}</strong>
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              Target: <strong>₹{target.toLocaleString('en-IN')}</strong>
                            </span>
                          </div>

                          <div className="campaign-progress-bar">
                            <div className="campaign-progress-fill" style={{ width: `${progress}%` }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            <span>{progress}% funded</span>
                            <span>{c.donations_count || 0} contributions</span>
                          </div>

                          <button
                            className="btn-primary"
                            onClick={() => handleOpenDonate(c)}
                            disabled={isClosed}
                            style={{
                              width: '100%',
                              padding: '0.65rem',
                              fontSize: '0.88rem',
                              background: isClosed ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #10b981, #059669)',
                            }}
                          >
                            {isClosed ? 'Campaign Closed' : 'Contribute Now →'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY DONATIONS */}
        {activeTab === 'my-donations' && (
          <div className="animate-fade-in">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
                Loading your donations...
              </div>
            ) : myDonations.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <Receipt size={42} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.4rem' }}>No Contributions Yet</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  You haven't contributed to any campaigns yet. Select an active campaign above to make a donation.
                </p>
              </div>
            ) : (
              <div className="my-donations-list">
                {myDonations.map((d) => (
                  <div key={d.id} className="donation-receipt-card">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>
                          ₹{d.amount.toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          via {d.payment_method}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                        {d.campaign?.title || 'Community Campaign'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Receipt: <strong>{d.receipt_number}</strong> ·{' '}
                        {new Date(d.donated_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                      <StatusBadge status={d.status} />
                      {d.rejection_reason && (
                        <div style={{ fontSize: '0.75rem', color: '#f87171' }}>
                          {d.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DONATION MODAL */}
      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        campaign={selectedCampaign}
        flatId={primaryFlat?.flat_id}
        onSuccess={loadData}
      />
    </div>
  );
};
