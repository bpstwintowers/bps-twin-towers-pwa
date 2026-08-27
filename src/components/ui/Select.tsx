import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, placeholder, ...props }) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && <label className="form-label">{label}</label>}
    <select
      style={{
        background: '#ffffff',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.65rem 0.85rem',
        fontSize: '0.9rem',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2375777f' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '12px',
        paddingRight: '2rem',
        width: '100%',
      }}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ background: '#ffffff', color: '#121c2c' }}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);
