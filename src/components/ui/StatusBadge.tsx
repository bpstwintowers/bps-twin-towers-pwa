import React from 'react';

type StatusType = 'Pending' | 'Correction Required' | 'Approved' | 'Rejected' | 'Active' | 'Inactive' | string;

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  'Pending': {
    bg: 'rgba(245, 158, 11, 0.12)',
    color: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  'Correction Required': {
    bg: 'rgba(251, 146, 60, 0.12)',
    color: '#fb923c',
    border: 'rgba(251, 146, 60, 0.3)',
  },
  'Approved': {
    bg: 'rgba(16, 185, 129, 0.12)',
    color: '#34d399',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  'Active': {
    bg: 'rgba(16, 185, 129, 0.12)',
    color: '#34d399',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  'Rejected': {
    bg: 'rgba(239, 68, 68, 0.12)',
    color: '#f87171',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  'Inactive': {
    bg: 'rgba(148, 163, 184, 0.12)',
    color: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.3)',
  },
};

const defaultStyle = {
  bg: 'rgba(148, 163, 184, 0.12)',
  color: '#94a3b8',
  border: 'rgba(148, 163, 184, 0.3)',
};

export const StatusBadge: React.FC<{ status: StatusType }> = ({ status }) => {
  const style = statusStyles[status] || defaultStyle;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.8rem',
        fontWeight: 500,
        letterSpacing: '0.01em',
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
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
