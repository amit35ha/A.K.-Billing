import React, { useState } from 'react';
import { LogIn, ShieldCheck, Sun, Moon } from 'lucide-react';

export default function Login({ onLogin, theme, onToggleTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        onLogin(data.user || { email });
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      padding: '1rem',
      transition: 'background-color 0.25s ease'
    }}>
      <div style={{
        background: 'var(--card-bg)',
        padding: '2.5rem',
        borderRadius: '1rem',
        boxShadow: 'var(--shadow-card)',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid var(--border)',
        position: 'relative',
        transition: 'background-color 0.25s ease, border-color 0.25s ease'
      }}>
        {onToggleTheme && (
          <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb, #10b981)',
            color: '#ffffff',
            marginBottom: '0.75rem'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
            KMC Billing Portal
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Sign in to access and manage bills
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
              Email Address
            </label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
              Password
            </label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '0.75rem',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '0.5rem',
              border: 'none',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
          >
            <LogIn size={18} />
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
