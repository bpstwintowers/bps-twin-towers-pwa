import React, { useState } from 'react';
import { Sparkles, QrCode, ExternalLink, X } from 'lucide-react';

interface Props {
  onOpenContributeModal?: () => void;
  onOpenGothramModal?: () => void;
}

export const GaneshBannerOverlay: React.FC<Props> = ({
  onOpenContributeModal,
  onOpenGothramModal,
}) => {
  const [isFlyerModalOpen, setIsFlyerModalOpen] = useState(false);

  return (
    <>
      <div className="ganesh-banner-overlay-wrap">
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.85rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Invitation Text */}
          <p
            style={{
              margin: 0,
              fontSize: 'clamp(0.78rem, 1.15vw, 0.88rem)',
              lineHeight: 1.45,
              color: '#f8fafc',
              fontWeight: 500,
              flex: '1 1 260px',
            }}
          >
            Join the entire BPS Twin Towers family for the auspicious{' '}
            <strong style={{ color: '#fef08a' }}>Ganesh Sthapana</strong>, evening{' '}
            <strong style={{ color: '#fed7aa' }}>Aarti</strong>, cultural performances by{' '}
            <strong style={{ color: '#fed7aa' }}>children</strong>, and community{' '}
            <strong style={{ color: '#fef08a' }}>Mahaprasad dinner</strong>.
          </p>

          {/* Action Links (Side by Side) */}
          <div
            style={{
              display: 'flex',
              gap: '0.45rem',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'flex-end',
              flexShrink: 0,
            }}
          >
            {/* Clickable Festive Community Invitation Button */}
            <button
              type="button"
              onClick={() => setIsFlyerModalOpen(true)}
              title="Click to view Official Invitation Flyer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                border: '1px solid rgba(254, 215, 170, 0.35)',
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.4)',
                whiteSpace: 'nowrap',
              }}
            >
              <Sparkles size={13} color="#fef08a" />
              <span>Community Invitation</span>
              <ExternalLink size={12} color="#fef08a" />
            </button>
            {onOpenContributeModal && (
              <button
                type="button"
                onClick={onOpenContributeModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)',
                }}
              >
                <QrCode size={12} />
                <span>Contribute Now</span>
              </button>
            )}

            {onOpenGothramModal && (
              <button
                type="button"
                onClick={onOpenGothramModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#fed7aa',
                  border: '1px solid rgba(254, 215, 170, 0.35)',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={12} />
                <span>Gothram Entry</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Official Invitation Flyer Popup Modal */}
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
              <span style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🕉️</span> Official Invitation Flyer • BPS Twin Towers
              </span>
              <button
                type="button"
                onClick={() => setIsFlyerModalOpen(false)}
                aria-label="Close"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
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
    </>
  );
};
