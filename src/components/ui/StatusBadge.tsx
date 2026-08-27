import React from 'react';

type StatusType = 'Pending' | 'Correction Required' | 'Approved' | 'Rejected' | 'Active' | 'Inactive' | string;

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  'Pending': {
    bg: '#fef3c7',
    color: '#92400e',
    border: 'rgba(180, 83, 9, 0.3)',
  },
  'Correction Required': {
    bg: '#ffedd5',
    color: '#c2410c',
    border: 'rgba(194, 65, 12, 0.3)',
  },
  'Approved': {
    bg: '#ccfbf1',
    color: '#0f766e',
    border: 'rgba(15, 118, 110, 0.3)',
  },
  'Active': {
    bg: '#ccfbf1',
    color: '#0f766e',
    border: 'rgba(15, 118, 110, 0.3)',
  },
  'Rejected': {
    bg: '#ffdad6',
    color: '#ba1a1a',
    border: 'rgba(186, 26, 26, 0.3)',
  },
  'Inactive': {
    bg: '#f1f5f9',
    color: '#64748b',
    border: 'rgba(100, 116, 139, 0.25)',
  },
};

const defaultStyle = {
  bg: '#f1f5f9',
  color: '#475569',
  border: 'rgba(71, 85, 105, 0.25)',
};

export const StatusBadge: React.FC<{ status: StatusType }> = ({ status }) => {
  const style = statusStyles[status] || defaultStyle;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.6rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
        fontFamily: "'Hanken Grotesk', -apple-system, sans-serif",
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: style.color,
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
};
