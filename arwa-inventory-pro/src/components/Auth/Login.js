import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function Login() {
  const { login, theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = login(email, password);
    setLoading(false);
    if (ok) {
      navigate('/');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: theme === 'dark'
        ? 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)'
        : 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #F8FAFC 100%)',
      position: 'relative', padding: 20,
    }}>
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute', top: 20, right: 20,
          width: 40, height: 40, borderRadius: 10,
          border: '1px solid var(--border)', background: 'var(--bg-secondary)',
          color: 'var(--text-secondary)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: 40,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.3s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 900, color: 'white',
            margin: '0 auto 16px',
            boxShadow: '0 0 30px rgba(79,70,229,0.4)',
          }}>A</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            Arwa 1.0
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Enterprise Business Platform</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700,
              color: 'var(--text-secondary)', marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@arwaenterprises.com"
              required
              style={{
                width: '100%', background: 'var(--bg-tertiary)',
                border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: 8, padding: '10px 12px',
                color: 'var(--text-primary)', fontSize: 13,
                fontFamily: 'var(--font-family)', outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700,
              color: 'var(--text-secondary)', marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', background: 'var(--bg-tertiary)',
                  border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '10px 40px 10px 12px',
                  color: 'var(--text-primary)', fontSize: 13,
                  fontFamily: 'var(--font-family)', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', display: 'flex',
                }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              color: '#EF4444', fontSize: 13, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-family)',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.15s',
              boxShadow: '0 4px 15px rgba(79,70,229,0.4)',
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: 28, padding: '14px 16px',
          background: 'var(--bg-tertiary)', borderRadius: 10,
          border: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Credentials</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>admin@arwaenterprises.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
