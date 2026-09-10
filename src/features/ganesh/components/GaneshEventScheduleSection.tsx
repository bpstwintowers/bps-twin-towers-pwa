import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  Users,
  PartyPopper,
  Flame,
  Award,
  ExternalLink,
  ChevronRight,
  Heart,
  QrCode,
} from 'lucide-react';

interface Props {
  onOpenContributeModal: () => void;
}

export const GaneshEventScheduleSection: React.FC<Props> = ({ onOpenContributeModal }) => {
  const [isFlyerModalOpen, setIsFlyerModalOpen] = useState(false);

  return (
    <div
      className="ganesh-event-flyer-card"
      style={{
        background: 'linear-gradient(135deg, #fffdfa 0%, #fff7ed 50%, #fef3c7 100%)',
        border: '2px solid #e2b342',
        borderRadius: '24px',
        padding: '1.75rem',
        marginBottom: '1.75rem',
        boxShadow: '0 12px 36px -8px rgba(180, 83, 9, 0.18)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Traditional Corner Motifs */}
      <div
        style={{
          position: 'absolute',
          top: '-15px',
          right: '-15px',
          width: '100px',
          height: '100px',
          background: 'radial-gradient(circle, rgba(234, 88, 12, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* Royal Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#b45309', fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          <span>🪔</span>
          <span>BPS TWIN TOWERS AT SAIDABAD</span>
          <span>🪔</span>
        </div>

        <h2
          style={{
            margin: '0.35rem 0 0.2rem 0',
            fontFamily: "'Cinzel', 'Georgia', serif, system-ui",
            fontSize: '1.65rem',
            fontWeight: 900,
            color: '#1e3a8a',
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
          }}
        >
          <span style={{ color: '#d97706', fontSize: '1.3rem' }}>🌿</span>
          <span>EVENT DETAILS</span>
          <span style={{ color: '#d97706', fontSize: '1.3rem' }}>🌿</span>
        </h2>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350f', fontWeight: 600 }}>
          Grand Ganesh Utsav 2026 Celebration Schedule &amp; Timings
        </p>
      </div>

      {/* Main Content Layout: Left Details + Right Flyer & QR */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          alignItems: 'stretch',
        }}
      >
        {/* Left Column: Detailed Schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 1. Sthapana */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '0.85rem 1rem',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #fed7aa',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.05)',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e3a8a, #0f172a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fef08a',
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(30, 58, 138, 0.25)',
              }}
            >
              <Calendar size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                GANESH JI STHAPANA
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#b45309' }}>
                14th SEP, MONDAY
              </div>
              <div style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 500, marginTop: '2px' }}>
                He will be with us for 5 auspicious days.
              </div>
            </div>
          </div>

          {/* 2. Immersion */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '0.85rem 1rem',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #fed7aa',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.05)',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e3a8a, #0f172a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fef08a',
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(30, 58, 138, 0.25)',
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                IMMERSION (VISARJAN)
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#b45309' }}>
                19th SEP, SATURDAY
              </div>
              <div style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 500, marginTop: '2px' }}>
                On the 6th day, we bid farewell to Bappa with heartfelt devotion.
              </div>
            </div>
          </div>

          {/* 3. Pooja Every Day */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '0.85rem 1rem',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #fed7aa',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.05)',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e3a8a, #0f172a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fef08a',
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(30, 58, 138, 0.25)',
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                POOJA EVERY DAY
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#9a3412' }}>
                Pooja will be done twice: <span style={{ color: '#b45309' }}>Morning &amp; Evening</span>
              </div>
              <div style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600, marginTop: '2px' }}>
                🕕 Pooja starts at <strong style={{ color: '#b45309' }}>7:00 PM</strong> every evening.
              </div>
            </div>
          </div>

          {/* 4. Interested in Pooja */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '0.85rem 1rem',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #fed7aa',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.05)',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e3a8a, #0f172a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fef08a',
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(30, 58, 138, 0.25)',
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                INTERESTED IN POOJA?
              </div>
              <div style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 600 }}>
                Whoever is interested in pooja / archana, please contact – <strong style={{ color: '#b45309', textDecoration: 'underline' }}>CULTURAL TEAM</strong>
              </div>
            </div>
          </div>

          {/* 5. Fun & Devotion */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '0.85rem 1rem',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #fed7aa',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.05)',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e3a8a, #0f172a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fef08a',
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(30, 58, 138, 0.25)',
              }}
            >
              <PartyPopper size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                FUN &amp; DEVOTION TOGETHER!
              </div>
              <div style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 600 }}>
                We have games for <strong style={{ color: '#b45309' }}>kids, bhajans, and many more fun activities</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: QR Contribution Card + Official Flyer Preview */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: '#ffffff',
            borderRadius: '20px',
            border: '2px solid #fed7aa',
            padding: '1.25rem',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(234, 88, 12, 0.08)',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: '#1e3a8a',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
              }}
            >
              FOR CONTRIBUTION PLEASE USE BELOW QR
            </span>
            <div style={{ color: '#b45309', fontWeight: 800, fontSize: '1.05rem', margin: '0.3rem 0 0.75rem 0' }}>
              “Harish reddy guduru”
            </div>

            {/* PhonePe QR Image */}
            <div
              style={{
                background: '#ffffff',
                padding: '8px',
                borderRadius: '16px',
                border: '1.5px solid #fed7aa',
                display: 'inline-block',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.1)',
                maxWidth: '210px',
                margin: '0 auto',
                cursor: 'pointer',
              }}
              onClick={onOpenContributeModal}
              title="Click to open full payment options"
            >
              <img
                src="/phonepe-qr.jpg"
                alt="PhonePe QR Code - Harish Reddy Guduru"
                style={{ width: '100%', display: 'block', borderRadius: '10px' }}
              />
            </div>

            <p style={{ fontSize: '0.85rem', color: '#78350f', fontStyle: 'italic', margin: '0.75rem 0 0.4rem 0', fontWeight: 700 }}>
              Thank you for your generous support! 🪷
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.85rem' }}>
            <button
              type="button"
              onClick={onOpenContributeModal}
              className="btn-festive-primary"
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                fontSize: '0.88rem',
                fontWeight: 800,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
              }}
            >
              <QrCode size={16} />
              <span>Contribute via QR / UPI</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFlyerModalOpen(true)}
              className="btn-festive-secondary"
              style={{
                width: '100%',
                padding: '0.55rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderRadius: '12px',
                background: '#fff7ed',
                color: '#9a3412',
                border: '1.5px solid #fdba74',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <ExternalLink size={14} />
              <span>View Full Official Flyer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Highlight Cards: Laddu Auction + Immersion Sharp */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1.5px dashed #fed7aa',
        }}
      >
        {/* Laddu Auction */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
            border: '2px solid #fde68a',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.1)',
          }}
        >
          <div style={{ fontSize: '2rem' }}>🍯</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400e', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              LADDU AUCTION
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#78350f' }}>
              19th SEP, SAT
            </div>
          </div>
          <div
            style={{
              background: '#1e3a8a',
              color: '#ffffff',
              padding: '0.4rem 0.85rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.88rem',
              boxShadow: '0 2px 6px rgba(30, 58, 138, 0.3)',
            }}
          >
            4:00 PM
          </div>
        </div>

        {/* Immersion Starts Sharp */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
            border: '2px solid #bfdbfe',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 4px 12px rgba(30, 58, 138, 0.1)',
          }}
        >
          <div style={{ fontSize: '2rem' }}>🌊</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              IMMERSION STARTS
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b' }}>
              19th SEP, SAT
            </div>
          </div>
          <div
            style={{
              background: '#0f172a',
              color: '#ffffff',
              padding: '0.4rem 0.85rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.88rem',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.3)',
            }}
          >
            6:00 PM SHARP
          </div>
        </div>
      </div>

      {/* Footer Slogan */}
      <div
        style={{
          marginTop: '1.25rem',
          textAlign: 'center',
          color: '#b45309',
          fontFamily: "'Cinzel', 'Georgia', serif",
          fontSize: '1rem',
          fontWeight: 800,
          letterSpacing: '0.05em',
        }}
      >
        ✨ <em>Let&apos;s come together and celebrate <strong>BAPPA&apos;S ARRIVAL!</strong></em> ✨
      </div>

      {/* Full Flyer Popup Modal */}
      {isFlyerModalOpen && (
        <div
          className="ganesh-modal-overlay"
          onClick={() => setIsFlyerModalOpen(false)}
          style={{ zIndex: 1300 }}
        >
          <div
            className="ganesh-modal-content"
            style={{
              maxWidth: '650px',
              width: '94%',
              maxHeight: '94vh',
              overflowY: 'auto',
              borderRadius: '20px',
              padding: '0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.9rem 1.25rem',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
                color: '#ffffff',
              }}
            >
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                🕉️ Official Invitation Flyer • BPS Twin Towers
              </span>
              <button
                type="button"
                onClick={() => setIsFlyerModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '0.5rem', background: '#000000', textAlign: 'center' }}>
              <img
                src="/ganesh-event-flyer.png"
                alt="BPS Twin Towers Ganesh Utsav Event Details Flyer"
                style={{ width: '100%', maxHeight: '82vh', objectFit: 'contain', display: 'block' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
