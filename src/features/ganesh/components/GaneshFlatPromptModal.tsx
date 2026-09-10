import React, { useState, useEffect } from 'react';
import { Home, X, ArrowRight, Building2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentFlat?: string;
  onSelectFlat: (flatNo: string) => void;
}

export const GaneshFlatPromptModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentFlat = '',
  onSelectFlat,
}) => {
  const [flatInput, setFlatInput] = useState(currentFlat);
  const [tower, setTower] = useState<'A' | 'B'>('A');

  useEffect(() => {
    if (currentFlat) {
      setFlatInput(currentFlat);
      if (currentFlat.toUpperCase().startsWith('B')) {
        setTower('B');
      } else {
        setTower('A');
      }
    }
  }, [currentFlat, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatInput.trim()) return;
    const cleanFlat = flatInput.trim().toUpperCase();
    onSelectFlat(cleanFlat);
    onClose();
  };

  const canDismiss = !!currentFlat && currentFlat !== 'GUEST';

  const sampleFlats = tower === 'A'
    ? ['A811', 'A1701', 'A1102', 'A602', 'A1005', 'A2008']
    : ['B901', 'B1609', 'B1106', 'B809', 'B501', 'B1904'];

  return (
    <div
      className="ganesh-modal-overlay"
      onClick={() => {
        if (canDismiss) onClose();
      }}
      style={{ zIndex: 1050 }}
    >
      <div
        className="ganesh-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          width: '92%',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          className="ganesh-modal-header"
          style={{
            padding: '1.25rem 1.4rem',
            background: 'linear-gradient(135deg, #9a3412 0%, #ea580c 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Home size={22} color="#fef08a" />
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem', fontWeight: 800 }}>
                Welcome Resident!
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#fed7aa', fontWeight: 500 }}>
                BPS Twin Towers Ganesh Utsav 2026
              </span>
            </div>
          </div>
          {canDismiss && (
            <button
              type="button"
              className="ganesh-modal-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.4rem' }}>
          <p style={{ margin: '0 0 1.25rem 0', color: '#475569', fontSize: '0.92rem', lineHeight: '1.45' }}>
            Please select your <strong>Tower</strong> and enter your <strong>Flat Number</strong> to view and manage your festival details.
          </p>

          <div style={{ marginBottom: '1.2rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.86rem',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '0.45rem',
              }}
            >
              Select Tower &amp; Enter Flat Number <span style={{ color: '#ef4444' }}>*</span>
            </label>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <button
                type="button"
                onClick={() => {
                  setTower('A');
                  if (!flatInput || flatInput.startsWith('B')) {
                    setFlatInput('A' + flatInput.replace(/^[a-zA-Z]/, ''));
                  }
                }}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: '10px',
                  border: tower === 'A' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                  background: tower === 'A' ? '#fff7ed' : '#ffffff',
                  color: tower === 'A' ? '#9a3412' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <Building2 size={16} /> Tower A
              </button>
              <button
                type="button"
                onClick={() => {
                  setTower('B');
                  if (!flatInput || flatInput.startsWith('A')) {
                    setFlatInput('B' + flatInput.replace(/^[a-zA-Z]/, ''));
                  }
                }}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: '10px',
                  border: tower === 'B' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                  background: tower === 'B' ? '#fff7ed' : '#ffffff',
                  color: tower === 'B' ? '#9a3412' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <Building2 size={16} /> Tower B
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                placeholder="e.g. A811, B901, A1701"
                className="ganesh-form-input"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  border: '2px solid #fed7aa',
                  borderRadius: '12px',
                  background: '#fffdfa',
                  boxSizing: 'border-box',
                }}
                value={flatInput === 'GUEST' ? '' : flatInput}
                onChange={(e) => setFlatInput(e.target.value.toUpperCase())}
                autoFocus
              />
            </div>
          </div>

          {/* Quick Flat Suggestions */}
          <div style={{ marginBottom: '1.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
              Quick Selection:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
              {sampleFlats.map((flat) => (
                <button
                  key={flat}
                  type="button"
                  onClick={() => setFlatInput(flat)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '8px',
                    border: flatInput === flat ? '1.5px solid #ea580c' : '1px solid #e2e8f0',
                    background: flatInput === flat ? '#ffedd5' : '#f8fafc',
                    color: flatInput === flat ? '#9a3412' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {flat}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <button
              type="submit"
              className="btn-festive-primary"
              style={{
                width: '100%',
                background: '#ea580c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '1rem',
                padding: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
              }}
            >
              Confirm Flat &amp; Continue <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
