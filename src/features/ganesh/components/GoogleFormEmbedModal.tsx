import React, { useState } from 'react';
import { X, ExternalLink, Sparkles, Check, Link } from 'lucide-react';
import { getGoogleFormUrl, setGoogleFormUrl } from '../../../services/liveSheetService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userFlat?: string;
  isAdmin?: boolean;
}

export const GoogleFormEmbedModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userFlat = '',
}) => {
  const [formUrl, setFormUrl] = useState(() => getGoogleFormUrl());
  const [urlInput, setUrlInput] = useState(formUrl);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setGoogleFormUrl(urlInput.trim());
    setFormUrl(urlInput.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 1200);
  };

  const isDefaultPlaceholder = formUrl.includes('1FAIpQLSd7gqA2gW9z9P9n1H6eQe1e9Y9_q1');

  return (
    <div className="ganesh-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="ganesh-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '820px',
          width: '95vw',
          maxHeight: '92vh',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        <div
          className="ganesh-modal-header"
          style={{
            padding: '0.9rem 1.4rem',
            background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="#fef08a" />
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.12rem', fontWeight: 800 }}>
                Register Gothram for Puja {userFlat && userFlat !== 'GUEST' ? `(Flat ${userFlat.toUpperCase()})` : ''}
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#fed7aa', fontWeight: 500 }}>
                Official Google Form for Sankalpam &amp; Archana Registry
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!isDefaultPlaceholder && (
              <a
                href={formUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-festive-secondary"
                style={{
                  background: '#ffffff',
                  color: '#9a3412',
                  padding: '0.38rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  textDecoration: 'none',
                }}
              >
                <span>Open in New Tab</span>
                <ExternalLink size={13} />
              </a>
            )}

            <button
              type="button"
              className="ganesh-modal-close-btn"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: '#ffedd5',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9a3412',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Inline URL Setting Bar */}
        {isDefaultPlaceholder && (
          <div
            style={{
              background: '#fffbeb',
              borderBottom: '1.5px solid #fde68a',
              padding: '0.75rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#92400e', fontSize: '0.82rem', fontWeight: 700 }}>
              <Link size={14} /> Paste your official Google Form link:
            </div>
            <form onSubmit={handleSaveUrl} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="url"
                required
                placeholder="https://docs.google.com/forms/d/e/.../viewform"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="ganesh-form-input"
                style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.84rem', background: '#ffffff' }}
              />
              <button
                type="submit"
                className="btn-festive-primary"
                style={{ background: '#ea580c', color: '#ffffff', padding: '0.45rem 1.1rem', fontSize: '0.84rem', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {isSaved ? <Check size={14} /> : null}
                <span>{isSaved ? 'Saved!' : 'Save Link'}</span>
              </button>
            </form>
            <div style={{ fontSize: '0.74rem', color: '#b45309' }}>
              💡 <em>Tip: In your Google Sheet, click <strong>Tools ➔ Manage form ➔ Go to live form</strong>, then copy and paste the URL here.</em>
            </div>
          </div>
        )}

        <div style={{ flex: 1, position: 'relative', background: '#f8fafc' }}>
          {isDefaultPlaceholder ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                textAlign: 'center',
                color: '#475569',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📝</div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.2rem' }}>
                Please Paste Your Google Form Link Above
              </h4>
              <p style={{ margin: 0, maxWidth: '480px', fontSize: '0.88rem', lineHeight: '1.5' }}>
                To embed the form directly for your residents, open your <strong>Gothram for pooja (Responses)</strong> Google Sheet, click <strong>Tools ➔ Manage form ➔ Go to live form</strong>, and paste the URL into the bar above.
              </p>
            </div>
          ) : (
            <iframe
              src={formUrl.includes('embedded=true') ? formUrl : formUrl.replace(/\/viewform(\?.*)?$/i, '/viewform?embedded=true')}
              title="Official Gothram Google Form"
              width="100%"
              height="100%"
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              style={{ display: 'block', width: '100%', height: '100%', border: 'none' }}
            >
              Loading Google Form...
            </iframe>
          )}
        </div>
      </div>
    </div>
  );
};
