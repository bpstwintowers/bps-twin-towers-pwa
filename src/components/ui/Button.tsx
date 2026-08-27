import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export const Button: React.FC<ButtonProps> = ({children, variant = 'primary', className = '', ...props}) => {
  const variantClass = variant === 'primary' ? 'btn-primary' :
                       variant === 'secondary' ? 'btn-outline' :
                       'btn-outline';
  return (
    <button className={`${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};
