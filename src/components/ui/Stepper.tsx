import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="stepper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, margin: '1.5rem 0 2rem' }}>
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <React.Fragment key={label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px', position: 'relative' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  transition: 'all 0.3s ease',
                  background: isCompleted
                    ? 'var(--primary)'
                    : isActive
                      ? 'var(--secondary)'
                      : 'var(--bg-secondary)',
                  color: isCompleted || isActive ? '#ffffff' : 'var(--text-muted)',
                  border: isActive
                    ? '1px solid var(--secondary)'
                    : '1px solid var(--border-color)',
                  boxShadow: isActive
                    ? 'var(--shadow-gold)'
                    : 'none',
                }}
              >
                {isCompleted ? <Check size={16} /> : index + 1}
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  marginTop: '0.4rem',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  maxWidth: '76px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  transition: 'color 0.3s ease',
                }}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  minWidth: '20px',
                  maxWidth: '48px',
                  background: index < currentStep
                    ? 'var(--primary)'
                    : 'var(--border-color)',
                  borderRadius: '1px',
                  transition: 'background 0.3s ease',
                  marginBottom: '1.25rem',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
