import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { GANESH_UPI_ID } from '../../../services/liveSheetService';
import type { GaneshContributionType } from '../../../types/ganesh';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultCategory?: GaneshContributionType;
  defaultAmount?: number;
  isSponsorship?: boolean;
}

export const GaneshPaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isSponsorship = false,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  // Direct Mobile UPI Intent URI
  const upiId = 'harish.reddy5@axl';
  const payeeName = 'HARISH REDDY GUDURU';
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&cu=INR&tn=${encodeURIComponent('BPS Twin Towers Ganesh Utsav Contribution')}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    upiUrl
  )}`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="ganesh-modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="ganesh-modal-content"
        style={{
          maxWidth: '460px',
          width: '92%',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="ganesh-modal-header"
          style={{
            background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            padding: '1.2rem 1.4rem',
            borderBottom: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>{isSponsorship ? '🌟' : '🙏'}</span>
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem', fontWeight: 800 }}>
                {isSponsorship ? 'Sponsor Ganesh Utsav 2026' : 'Contribute to Ganesh Utsav 2026'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#ffedd5' }}>
                UPI Scan &amp; Pay • Harish Reddy Guduru
              </span>
            </div>
          </div>
          <button className="ganesh-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="ganesh-modal-body" style={{ padding: '1.5rem', background: '#ffffff', textAlign: 'center' }}>
          <div style={{ marginBottom: '0.85rem' }}>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#b45309',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
              }}
            >
              Official Festival UPI QR Code
            </span>
            <span style={{ fontSize: '0.86rem', color: '#78350f' }}>
              Scan to contribute <strong>any voluntary amount</strong>
            </span>
          </div>

          {/* QR Code Image Container */}
          <div
            className="qr-image-wrapper"
            style={{
              background: '#ffffff',
              padding: '10px',
              borderRadius: '20px',
              border: '2px solid #fed7aa',
              display: 'inline-block',
              boxShadow: '0 8px 24px rgba(234, 88, 12, 0.12)',
              maxWidth: '280px',
              margin: '0 auto',
            }}
          >
            <img
              src="/phonepe-qr.jpg"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = qrImageUrl;
              }}
              alt="PhonePe Accepted Here - HARISH REDDY GUDURU"
              style={{
                width: '100%',
                maxHeight: '340px',
                objectFit: 'contain',
                display: 'block',
                borderRadius: '12px',
              }}
            />
          </div>

          <p style={{ fontSize: '0.82rem', color: '#78350f', margin: '0.85rem 0 1rem 0', fontWeight: 600 }}>
            Scan with <strong>PhonePe, Google Pay, Paytm, BHIM</strong>, or any UPI app
          </p>

          {/* Mobile Intent Direct Launch Buttons */}
          <div style={{ width: '100%', marginBottom: '1.15rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', marginBottom: '0.45rem' }}>
              <a
                href={`phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&cu=INR&tn=${encodeURIComponent('BPS Ganesh Utsav')}`}
                onClick={() => handleCopy(upiId, 'upi')}
                className="btn-festive-primary"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.35rem',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  padding: '0.65rem 0.6rem',
                  background: '#5f259f',
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(95, 37, 159, 0.25)',
                }}
              >
                <span>🟣</span>
                <span>PhonePe</span>
              </a>

              <a
                href={`tez://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&cu=INR&tn=${encodeURIComponent('BPS Ganesh Utsav')}`}
                onClick={() => handleCopy(upiId, 'upi')}
                className="btn-festive-primary"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.35rem',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  padding: '0.65rem 0.6rem',
                  background: '#1a73e8',
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(26, 115, 232, 0.25)',
                }}
              >
                <span>🔵</span>
                <span>Google Pay</span>
              </a>
            </div>

            <a
              href={upiUrl}
              onClick={() => handleCopy(upiId, 'upi')}
              className="btn-festive-primary"
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.45rem',
                textDecoration: 'none',
                fontSize: '0.88rem',
                padding: '0.65rem 1rem',
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                color: '#ffffff',
                borderRadius: '12px',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
              }}
            >
              <Smartphone size={17} />
              <span>Open in Any UPI App</span>
            </a>
          </div>

          {/* Official UPI ID Box with 1-click copy */}
          <div
            className="bank-info-box"
            style={{
              background: '#fff7ed',
              border: '1.5px solid #fed7aa',
              borderRadius: '14px',
              padding: '0.85rem 1.1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: '#9a3412', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                UPI ID (Harish Reddy Guduru):
              </div>
              <strong style={{ color: '#7c2d12', fontSize: '0.98rem', letterSpacing: '0.02em' }}>
                {upiId}
              </strong>
            </div>

            <button
              type="button"
              className="copy-btn"
              onClick={() => handleCopy(upiId, 'upi')}
              style={{
                background: copiedKey === 'upi' ? '#ecfdf5' : '#ffffff',
                border: copiedKey === 'upi' ? '1px solid #10b981' : '1px solid #fdba74',
                color: copiedKey === 'upi' ? '#047857' : '#c2410c',
                padding: '0.45rem 0.85rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              {copiedKey === 'upi' ? <Check size={15} color="#059669" /> : <Copy size={15} />}
              <span>{copiedKey === 'upi' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="btn-festive-secondary"
            style={{
              width: '100%',
              padding: '0.65rem 1.2rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: '#475569',
              borderColor: '#cbd5e1',
              background: '#f8fafc',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
