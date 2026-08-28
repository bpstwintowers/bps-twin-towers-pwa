import React, { useState, useEffect } from 'react';
import { X, Award, CheckCircle2, Copy, Check, Calendar, HeartHandshake } from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import {
  submitSponsorApplication,
  type SponsorTierItem,
  type SponsorType,
  type ContributionType,
  type SubmitSponsorshipPayload,
} from '../../services/supabase/sponsorService';
import { fetchAdminEvents, type EventItem } from '../../services/supabase/eventService';
import { fetchActiveCampaigns, type CampaignItem } from '../../services/supabase/financeService';

interface SponsorApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tiers: SponsorTierItem[];
  defaultTierId?: string;
}

export const SponsorApplicationModal: React.FC<SponsorApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tiers,
  defaultTierId,
}) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);

  const [sponsorName, setSponsorName] = useState('');
  const [sponsorType, setSponsorType] = useState<SponsorType>('Business');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  const [targetType, setTargetType] = useState<'event' | 'campaign'>('event');
  const [eventId, setEventId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [tierId, setTierId] = useState(defaultTierId || '');

  // Contribution Type
  const [contributionType, setContributionType] = useState<ContributionType>('Monetary');
  const [amount, setAmount] = useState<number>(25000);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentReference, setPaymentReference] = useState('');

  // In-Kind fields
  const [inKindDesc, setInKindDesc] = useState('');
  const [inKindQty, setInKindQty] = useState<number>(100);
  const [inKindUnit, setInKindUnit] = useState('packets');
  const [inKindVal, setInKindVal] = useState<number>(15000);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedReceipt, setConfirmedReceipt] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setConfirmedReceipt(null);

      Promise.all([
        fetchAdminEvents().catch(() => []),
        fetchActiveCampaigns().catch(() => []),
      ]).then(([evs, camps]) => {
        setEvents(evs);
        setCampaigns(camps);
        if (evs.length > 0) setEventId(evs[0].id);
        if (camps.length > 0) setCampaignId(camps[0].id);
      });

      if (defaultTierId) {
        setTierId(defaultTierId);
      } else if (tiers.length > 0) {
        setTierId(tiers[0].id);
      }

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
            .then(({ data: p }) => {
              if (p) {
                setContactName(p.full_name || '');
                setEmail(p.email || '');
                setPhone(p.mobile || '');
              }
            });
        }
      });
    }
  }, [isOpen, defaultTierId, tiers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorName.trim() || !contactName.trim()) {
      setError('Please provide the sponsor name and primary contact person.');
      return;
    }

    if (contributionType === 'Monetary' && (!amount || amount <= 0)) {
      setError('Please provide a valid monetary contribution amount.');
      return;
    }

    if (contributionType === 'In-Kind' && !inKindDesc.trim()) {
      setError('Please provide a description of the in-kind contribution.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: SubmitSponsorshipPayload = {
        sponsor_name: sponsorName.trim(),
        sponsor_type: sponsorType,
        contact_name: contactName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        description: description.trim() || undefined,
        event_id: targetType === 'event' ? eventId || undefined : undefined,
        campaign_id: targetType === 'campaign' ? campaignId || undefined : undefined,
        tier_id: tierId || undefined,
        contribution_type: contributionType,
        amount: contributionType === 'Monetary' ? Number(amount) : undefined,
        payment_method: contributionType === 'Monetary' ? paymentMethod : undefined,
        payment_reference: contributionType === 'Monetary' ? paymentReference.trim() || undefined : undefined,
        in_kind_description: contributionType === 'In-Kind' ? inKindDesc.trim() : undefined,
        in_kind_quantity: contributionType === 'In-Kind' ? Number(inKindQty) : undefined,
        in_kind_unit: contributionType === 'In-Kind' ? inKindUnit.trim() : undefined,
        in_kind_estimated_value: contributionType === 'In-Kind' ? Number(inKindVal) : undefined,
      };

      const res = await submitSponsorApplication(payload);
      setConfirmedReceipt(res);
      onSuccess();
    } catch (err: any) {
      console.error('Error submitting sponsor application:', err);
      setError(err.message || 'Failed to submit sponsorship application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyReceipt = () => {
    if (confirmedReceipt?.receipt_number) {
      navigator.clipboard.writeText(confirmedReceipt.receipt_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={22} style={{ color: '#fbbf24' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Become a Community Sponsor</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                BPS Twin Towers Partnership Application
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {confirmedReceipt ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 1.25rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.4rem' }}>
              Application Submitted!
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Thank you for partnering with BPS Twin Towers. Your sponsorship application has been logged and queued for review.
            </p>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'left',
                fontSize: '0.88rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Reference Receipt:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <strong>{confirmedReceipt.receipt_number}</strong>
                  <button
                    onClick={handleCopyReceipt}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '0.2rem' }}
                    title="Copy receipt number"
                  >
                    {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>{' '}
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>Pending Approval</span>
              </div>
            </div>

            <button className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#f87171',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Sponsor Identity */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Sponsor / Organization Name *
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Royal Sweets & Bakery / TechCorp"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Sponsor Type *
                </label>
                <select
                  className="admin-search-input"
                  style={{ width: '100%', padding: '0.55rem' }}
                  value={sponsorType}
                  onChange={(e) => setSponsorType(e.target.value as SponsorType)}
                >
                  <option value="Business">Business</option>
                  <option value="Individual">Individual</option>
                  <option value="Community Member">Community Member</option>
                  <option value="Organization">Organization</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Contact Person *
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Phone / Mobile
                </label>
                <input
                  type="tel"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Website URL (Optional)
                </label>
                <input
                  type="url"
                  className="admin-search-input"
                  style={{ width: '100%' }}
                  placeholder="https://example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>

            {/* Target Event & Tier */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', marginBottom: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Target Initiative *
                  </label>
                  <select
                    className="admin-search-input"
                    style={{ width: '100%', padding: '0.55rem' }}
                    value={targetType === 'event' ? eventId : campaignId}
                    onChange={(e) => {
                      if (targetType === 'event') setEventId(e.target.value);
                      else setCampaignId(e.target.value);
                    }}
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>Event: {ev.title}</option>
                    ))}
                    {campaigns.map((cp) => (
                      <option key={cp.id} value={cp.id}>Fund: {cp.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Sponsorship Tier *
                  </label>
                  <select
                    className="admin-search-input"
                    style={{ width: '100%', padding: '0.55rem' }}
                    value={tierId}
                    onChange={(e) => setTierId(e.target.value)}
                  >
                    {tiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Min ₹{t.minimum_amount.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contribution Details */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                Contribution Type *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <button
                  type="button"
                  className={`btn-outline ${contributionType === 'Monetary' ? 'active' : ''}`}
                  onClick={() => setContributionType('Monetary')}
                  style={{
                    flex: 1,
                    background: contributionType === 'Monetary' ? 'rgba(245, 158, 11, 0.2)' : undefined,
                    borderColor: contributionType === 'Monetary' ? '#f59e0b' : undefined,
                    color: contributionType === 'Monetary' ? '#fbbf24' : undefined,
                  }}
                >
                  Monetary (Cash / UPI)
                </button>
                <button
                  type="button"
                  className={`btn-outline ${contributionType === 'In-Kind' ? 'active' : ''}`}
                  onClick={() => setContributionType('In-Kind')}
                  style={{
                    flex: 1,
                    background: contributionType === 'In-Kind' ? 'rgba(59, 130, 246, 0.2)' : undefined,
                    borderColor: contributionType === 'In-Kind' ? '#3b82f6' : undefined,
                    color: contributionType === 'In-Kind' ? '#60a5fa' : undefined,
                  }}
                >
                  In-Kind (Goods / Services)
                </button>
              </div>

              {contributionType === 'Monetary' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '0.2rem', fontWeight: 600 }}>
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="admin-search-input"
                      style={{ width: '100%' }}
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '0.2rem', fontWeight: 600 }}>
                      Payment Method
                    </label>
                    <select
                      className="admin-search-input"
                      style={{ width: '100%', padding: '0.55rem' }}
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '0.2rem', fontWeight: 600 }}>
                      Ref / UTR No
                    </label>
                    <input
                      type="text"
                      className="admin-search-input"
                      style={{ width: '100%' }}
                      placeholder="Transaction Ref"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '0.2rem', fontWeight: 600 }}>
                      In-Kind Item Description *
                    </label>
                    <input
                      type="text"
                      className="admin-search-input"
                      style={{ width: '100%' }}
                      placeholder="e.g. 500 Snack Packets / 100 T-Shirts / LED Lighting Equipment"
                      value={inKindDesc}
                      onChange={(e) => setInKindDesc(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '0.2rem', fontWeight: 600 }}>
                        Quantity
                      </label>
                      <input
                        type="number"
                        min={1}
                        className="admin-search-input"
                        style={{ width: '100%' }}
                        value={inKindQty}
                        onChange={(e) => setInKindQty(parseFloat(e.target.value) || 1)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '0.2rem', fontWeight: 600 }}>
                        Unit
                      </label>
                      <input
                        type="text"
                        className="admin-search-input"
                        style={{ width: '100%' }}
                        placeholder="packets / units / sets"
                        value={inKindUnit}
                        onChange={(e) => setInKindUnit(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '0.2rem', fontWeight: 600 }}>
                        Estimated Value (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="admin-search-input"
                        style={{ width: '100%' }}
                        value={inKindVal}
                        onChange={(e) => setInKindVal(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn-outline" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                {submitting ? 'Submitting Application...' : 'Submit Sponsorship Application →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
