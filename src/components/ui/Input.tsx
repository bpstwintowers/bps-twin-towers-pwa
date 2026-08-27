import React from 'react';

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label?: string}> = ({label, ...props}) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && <label className="text-sm font-semibold">{label}</label>}
    <input className="border rounded p-2 focus:outline-blue-500 bg-white/50 backdrop-blur-sm" {...props} />
  </div>
);
