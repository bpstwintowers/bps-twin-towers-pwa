import React, { useState } from 'react';
import { supabase } from '../../services/supabase/client';
import { LogIn } from 'lucide-react';
import './Login.css'; // We will create this or use index.css

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Error during Google login:', err.message);
      setError('Failed to initiate Google login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container flex-center">
      <div className="login-card glass-panel animate-fade-in">
        <div className="login-header" style={{ textAlign: 'center' }}>
          <img
            src="/logo.png"
            alt="BPS Twin Towers"
            style={{
              width: '96px',
              height: 'auto',
              borderRadius: '12px',
              margin: '0 auto 1rem',
              display: 'block',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            }}
          />
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.35rem' }}>
            BPS Twin Towers
          </h1>
          <p className="subtitle" style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Saidabad Community Portal
          </p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="login-actions">
          <button 
            className="btn-outline google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <LogIn size={20} />
            {loading ? 'Connecting...' : 'Sign in with Google'}
          </button>
        </div>
        
        <div className="login-footer">
          <p>By signing in, you agree to the community guidelines.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
