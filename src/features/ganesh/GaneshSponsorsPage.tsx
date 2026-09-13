import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Sparkles,
  ChevronLeft,
  Check,
  Heart,
  Crown,
  Flame,
  Utensils,
  Music,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { GaneshBottomNav } from './components/GaneshBottomNav';
import { GaneshPaymentModal } from './components/GaneshPaymentModal';
import { HeaderNavbar } from './components/HeaderNavbar';
import './PoojaSchedule.css';

interface SponsorTier {
  id: string;
  name: string;
  amount: string;
  badgeColor: string;
  accentBg: string;
  icon: React.ReactNode;
  benefits: string[];
  slotsLeft: number;
}

interface GaneshSponsorsPageProps {
  embedded?: boolean;
  onBackToHome?: () => void;
}

const SPONSOR_TIERS: SponsorTier[] = [
  {
    id: 'maha-yajaman',
    name: 'Grand Maha Yajaman Seva',
    amount: '₹25,000',
    badgeColor: '#78350f',
    accentBg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    icon: <Crown size={22} color="#b45309" />,
    slotsLeft: 2,
    benefits: [
      'Primary Yajaman seat for Day 1 Ganapathi Sthapana & Day 3 Homam',
      'Exclusive Family Special Vedic Archana & Silver Coin Memento',
      'Prominent recognition on main pandal LED screen & circulars',
      'VIP front row seating for all 6 days evening cultural shows',
    ],
  },
  {
    id: 'prasadam-patron',
    name: 'Maha Prasadam Grand Patron',
    amount: '₹15,000',
    badgeColor: '#9a3412',
    accentBg: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
    icon: <Utensils size={22} color="#ea580c" />,
    slotsLeft: 3,
    benefits: [
      'Sponsors community feast meal for 150+ residents on Day 5',
      'Family Naivedyam blessing and dedicated Maha Prasadam service honor',
      'Framed Lord Ganesha Blessed Portrait & Prasad box delivered home',
    ],
  },
  {
    id: 'flower-decor',
    name: 'Mandap Flower Alankaram',
    amount: '₹10,000',
    badgeColor: '#166534',
    accentBg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    icon: <Sparkles size={22} color="#15803d" />,
    slotsLeft: 4,
    benefits: [
      'Sponsors majestic daily floral garlands and stage aesthetic alankaram',
      'Special morning Harathi participation privilege for sponsor family',
    ],
  },
  {
    id: 'cultural-trophies',
    name: 'Cultural Evening & Youth Awards',
    amount: '₹7,500',
    badgeColor: '#1e40af',
    accentBg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    icon: <Award size={22} color="#1d4ed8" />,
    slotsLeft: 5,
    benefits: [
      'Sponsors mementos, gifts & certificates for participating society kids',
      'Felicitation on stage by Cultural Committee during prize distribution',
    ],
  },
  {
    id: 'naivedyam-modak',
    name: 'Special Maha Naivedyam & 108 Modaks',
    amount: '₹5,000',
    badgeColor: '#3730a3',
    accentBg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
    icon: <Flame size={22} color="#4f46e5" />,
    slotsLeft: 6,
    benefits: [
      'Pure ghee 108 Modak / Laddu offering during evening Aarti',
      'Blessed Modak gift box delivered to sponsor flat',
    ],
  },
];

export const GaneshSponsorsPage: React.FC<GaneshSponsorsPageProps> = ({ embedded = false, onBackToHome }) => {
  const navigate = useNavigate();
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  return (
    <div className={`pooja-page-root ${!embedded ? 'has-bottom-nav' : ''}`}>
      {/* Top Header (Standalone only) */}
      {!embedded && <HeaderNavbar />}

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

      <div className="pooja-container">
        {/* Banner Hero */}
        <div
          style={{
            background: 'linear-gradient(135deg, #312e81 0%, #4338ca 60%, #6366f1 100%)',
            borderRadius: '20px',
            padding: '1.5rem',
            color: '#ffffff',
            boxShadow: '0 10px 25px rgba(67, 56, 202, 0.25)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Crown size={18} color="#fde047" />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fde047', letterSpacing: '0.05em' }}>
              SACRED SEVA SPONSORSHIP 2026
            </span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 0.5rem 0', fontFamily: 'Cinzel, Georgia, serif' }}>
            Become a Festival Patron
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.95, lineHeight: 1.4 }}>
            Earn sacred blessings for your family by sponsoring daily rituals, flower decorations, cultural shows, or the grand community Maha Prasadam feast.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsPayModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #fde047 0%, #facc15 100%)',
                color: '#713f12',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(250, 204, 21, 0.3)',
              }}
            >
              <Heart size={16} fill="#713f12" />
              <span>Sponsor a Seva via UPI</span>
            </button>
          </div>
        </div>

        {/* Tiers List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {SPONSOR_TIERS.map((tier) => (
            <div
              key={tier.id}
              style={{
                background: '#ffffff',
                border: '1.5px solid #fed7aa',
                borderRadius: '18px',
                padding: '1.35rem',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: tier.accentBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {tier.icon}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                      {tier.name}
                    </h3>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                      {tier.slotsLeft} slots remaining
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    padding: '0.35rem 0.85rem',
                    borderRadius: '12px',
                    fontFamily: 'Cinzel, Georgia, serif',
                  }}
                >
                  {tier.amount}
                </div>
              </div>

              {/* Benefits list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.15rem' }}>
                {tier.benefits.map((benefit, bIdx) => (
                  <div key={bIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem', color: '#334155' }}>
                    <Check size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsPayModalOpen(true)}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  color: '#1e293b',
                  padding: '0.65rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#fef3c7';
                  e.currentTarget.style.borderColor = '#f59e0b';
                  e.currentTarget.style.color = '#92400e';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.color = '#1e293b';
                }}
              >
                Choose {tier.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {isPayModalOpen && (
        <GaneshPaymentModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          onSuccess={() => setIsPayModalOpen(false)}
        />
      )}

      {/* Floating Bottom Nav (Standalone only) */}
      {!embedded && <GaneshBottomNav />}
    </div>
  );
};
