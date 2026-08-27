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
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  background: isCompleted
                    ? 'var(--success)'
                    : isActive
                      ? 'var(--accent-primary)'
                      : 'var(--bg-tertiary)',
                  color: isCompleted || isActive ? '#fff' : 'var(--text-muted)',
                  border: isActive
                    ? '2px solid var(--accent-primary)'
                    : '2px solid transparent',
                  boxShadow: isActive
                    ? '0 0 12px rgba(59, 130, 246, 0.4)'
                    : 'none',
                }}
              >
                {isCompleted ? <Check size={16} /> : index + 1}
              </div>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  marginTop: '0.375rem',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  maxWidth: '72px',
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
                    ? 'var(--success)'
                    : 'var(--bg-tertiary)',
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
