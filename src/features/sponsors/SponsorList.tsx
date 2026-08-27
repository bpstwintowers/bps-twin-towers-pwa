import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  ArrowLeft,
  Building,
  Globe,
  PlusCircle,
  CheckCircle2,
  Receipt,
  Gift,
  Coins,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  fetchSponsorTiers,
  fetchPublicSponsorships,
  fetchUserSponsorships,
  type SponsorTierItem,
  type SponsorshipItem,
} from '../../services/supabase/sponsorService';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SponsorApplicationModal } from './SponsorApplicationModal';
import './SponsorList.css';

export const SponsorList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'showcase' | 'tiers' | 'my-sponsorships'>('showcase');
  const [tiers, setTiers] = useState<SponsorTierItem[]>([]);
  const [publicSponsorships, setPublicSponsorships] = useState<SponsorshipItem[]>([]);
  const [mySponsorships, setMySponsorships] = useState<SponsorshipItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Application Modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string | undefined>(undefined);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tiersData, publicData, userData] = await Promise.all([
        fetchSponsorTiers(),
        fetchPublicSponsorships(),
        fetchUserSponsorships().catch(() => []),
      ]);
      setTiers(tiersData);
      setPublicSponsorships(publicData);
      setMySponsorships(userData);
    } catch (err) {
      console.error('Error loading sponsors data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyTier = (tierId?: string) => {
    setSelectedTierId(tierId);
    setIsApplyModalOpen(true);
  };

  const approvedSponsorships = mySponsorships.filter((s) => s.status === 'Approved');

  // Group public sponsorships by tier name
  const groupedSponsors = tiers.map((t) => ({
    tier: t,
    sponsorships: publicSponsorships.filter((s) => s.tier_id === t.id),
  }));

  const unassignedSponsors = publicSponsorships.filter((s) => !s.tier_id);

  return (
    <div className="sponsors-container">
      {/* Header */}
      <header className="sponsors-header">
        <div className="sponsors-header-inner">
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
                Sponsors & Partners
              </h1>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                BPS Twin Towers Community Backers
              </p>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={() => handleApplyTier()}
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.82rem',
              gap: '0.35rem',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            }}
          >
            <PlusCircle size={15} />
            Partner With Us
          </button>
        </div>
      </header>

      <div className="sponsors-content">
        {/* Tab Switcher */}
        <div className="donations-tabs">
          <button
            className={`donations-tab-btn ${activeTab === 'showcase' ? 'active' : ''}`}
            onClick={() => setActiveTab('showcase')}
          >
            <Award size={16} />
            Our Sponsors ({publicSponsorships.length})
          </button>
          <button
            className={`donations-tab-btn ${activeTab === 'tiers' ? 'active' : ''}`}
            onClick={() => setActiveTab('tiers')}
          >
            <Sparkles size={16} />
            Sponsorship Tiers ({tiers.length})
          </button>
          <button
            className={`donations-tab-btn ${activeTab === 'my-sponsorships' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-sponsorships')}
          >
            <Receipt size={16} />
            My Applications ({mySponsorships.length})
          </button>
        </div>

        {/* TAB 1: SHOWCASE */}
        {activeTab === 'showcase' && (
          <div className="animate-fade-in">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
                Loading community partners...
              </div>
            ) : publicSponsorships.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <Award size={42} style={{ color: '#fbbf24', opacity: 0.6, marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.4rem' }}>Be the First Community Sponsor!</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Support our festivals and society initiatives. Showcase your brand to 500+ resident families.
                </p>
                <button
                  className="btn-primary"
                  onClick={() => handleApplyTier()}
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                  Apply for Sponsorship →
                </button>
              </div>
            ) : (
              <div>
                {groupedSponsors.map(({ tier, sponsorships }) => {
                  if (sponsorships.length === 0) return null;
                  return (
                    <div key={tier.id} className="sponsor-tier-section">
                      <div className="sponsor-tier-heading">
                        <Award size={18} style={{ color: '#fbbf24' }} />
                        <span>{tier.name}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                          ({sponsorships.length})
                        </span>
                      </div>

                      <div className="sponsors-showcase-grid">
                        {sponsorships.map((s) => (
                          <div key={s.id} className="sponsor-card">
                            <div className="sponsor-logo-box">
                              {s.sponsor?.logo_url ? (
                                <img src={s.sponsor.logo_url} alt={s.sponsor.name} />
                              ) : (
                                <Building size={32} style={{ color: '#fbbf24', opacity: 0.8 }} />
                              )}
                            </div>

                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
                              {s.sponsor?.name}
                            </h3>

                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                              {s.event ? `Event: ${s.event.title}` : s.campaign ? `Fund: ${s.campaign.title}` : 'Community Partner'}
                            </div>

                            {s.sponsor?.description && (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                                {s.sponsor.description}
                              </p>
                            )}

                            {s.sponsor?.website && (
                              <a
                                href={s.sponsor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  fontSize: '0.75rem',
                                  color: 'var(--accent-primary)',
                                  textDecoration: 'none',
                                  marginTop: 'auto',
                                }}
                              >
                                <Globe size={13} />
                                Visit Website
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {unassignedSponsors.length > 0 && (
                  <div className="sponsor-tier-section">
                    <div className="sponsor-tier-heading">
                      <Award size={18} style={{ color: '#60a5fa' }} />
                      <span>Community Partners</span>
                    </div>
                    <div className="sponsors-showcase-grid">
                      {unassignedSponsors.map((s) => (
                        <div key={s.id} className="sponsor-card">
                          <div className="sponsor-logo-box">
                            <Building size={32} style={{ color: '#60a5fa' }} />
                          </div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
                            {s.sponsor?.name}
                          </h3>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TIERS & PACKAGES */}
        {activeTab === 'tiers' && (
          <div className="animate-fade-in">
            <div className="tier-packages-grid">
              {tiers.map((t) => (
                <div key={t.id} className="tier-package-card">
                  <div className="tier-badge tier-badge-gold">{t.name}</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fbbf24', margin: '0.35rem 0 0.5rem' }}>
                    ₹{t.minimum_amount.toLocaleString('en-IN')}+
                  </div>
                  {t.description && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                      {t.description}
                    </p>
                  )}

                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.75rem', marginBottom: '1.25rem', marginTop: 'auto' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                      Included Benefits:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {t.benefits.map((b, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                          <CheckCircle2 size={13} style={{ color: '#34d399', flexShrink: 0 }} />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={() => handleApplyTier(t.id)}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                  >
                    Select {t.name} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MY SPONSORSHIPS */}
        {activeTab === 'my-sponsorships' && (
          <div className="animate-fade-in">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
                Loading your applications...
              </div>
            ) : mySponsorships.length === 0 ? (
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
                <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.4rem' }}>No Applications Yet</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  You have not submitted any sponsorship proposals yet.
                </p>
                <button
                  className="btn-primary"
                  onClick={() => handleApplyTier()}
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                  Submit Sponsorship Application
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {mySponsorships.map((s) => {
                  const contrib = s.contributions?.[0];
                  return (
                    <div key={s.id} className="donation-receipt-card">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                            {s.sponsor?.name}
                          </span>
                          {s.tier && (
                            <span
                              style={{
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#fbbf24',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                              }}
                            >
                              {s.tier.name}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          Target: <strong>{s.event?.title || s.campaign?.title || 'Community Initiative'}</strong>
                        </div>

                        {contrib && (
                          <div style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 600 }}>
                            {contrib.contribution_type === 'Monetary' ? (
                              <span>Contribution: ₹{contrib.amount?.toLocaleString('en-IN')} ({contrib.payment_method})</span>
                            ) : (
                              <span>In-Kind: {contrib.in_kind_description} ({contrib.in_kind_quantity} {contrib.in_kind_unit})</span>
                            )}
                          </div>
                        )}

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Ref Receipt: <strong>{contrib?.receipt_number || '—'}</strong> ·{' '}
                          {new Date(s.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                        <StatusBadge status={s.status} />
                        {contrib && (
                          <span style={{ fontSize: '0.75rem', color: contrib.status === 'Verified' ? '#34d399' : '#fbbf24' }}>
                            Contribution: {contrib.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* APPLICATION MODAL */}
      <SponsorApplicationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={loadData}
        tiers={tiers}
        defaultTierId={selectedTierId}
      />
    </div>
  );
};
