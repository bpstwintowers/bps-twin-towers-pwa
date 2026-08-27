import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected application error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI component:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            padding: '1.5rem',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-ambient)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--primary)',
                margin: '0 0 0.5rem',
              }}
            >
              Something went wrong
            </h2>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 1.75rem', lineHeight: 1.5 }}>
              We encountered an unexpected display issue. Your data and account remain completely safe.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleGoHome}
                className="btn-outline"
                style={{ padding: '0.65rem 1.15rem' }}
              >
                <Home size={16} /> Return Home
              </button>

              <button
                onClick={this.handleReload}
                className="btn-primary"
                style={{ padding: '0.65rem 1.25rem' }}
              >
                <RotateCcw size={16} /> Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
