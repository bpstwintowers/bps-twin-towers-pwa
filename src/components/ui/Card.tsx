import React from 'react';

export const Card: React.FC<{children: React.ReactNode, className?: string}> = ({children, className = ''}) => (
  <div className={`glass-panel ${className}`} style={{ padding: '1rem', marginBottom: '0.75rem' }}>
    {children}
  </div>
);
