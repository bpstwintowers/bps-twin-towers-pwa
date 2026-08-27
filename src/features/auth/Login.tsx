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
        <div className="login-header">
          <div className="logo-placeholder">
            <span>BPS</span>
          </div>
          <h1>Welcome to BPS Twin Towers</h1>
          <p className="subtitle">Sign in to access your community portal</p>
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
