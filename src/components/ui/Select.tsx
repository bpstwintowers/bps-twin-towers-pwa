import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, placeholder, ...props }) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && <label className="text-sm font-semibold">{label}</label>}
    <select
      className="border rounded p-2 focus:outline-blue-500 bg-white/50 backdrop-blur-sm"
      style={{
        background: 'rgba(255,255,255,0.08)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.625rem 0.75rem',
        fontSize: '0.95rem',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '12px',
        paddingRight: '2rem',
      }}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);
