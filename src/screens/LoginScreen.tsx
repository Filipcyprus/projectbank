import React, { useState } from 'react';
import { useApp } from '../state/store';
import { Button } from '../components/ui';
import { Logo } from '../components/Icon';

const inputStyle: React.CSSProperties = {
  marginBottom: 'var(--s4)',
  padding: 'var(--s2)',
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  font: 'inherit',
};

export function LoginScreen({ onLogin }: { onLogin: (sessionId: string) => void } = { onLogin: () => {} }) {
  const { t, refresh } = useApp();
  const [mode, setMode] = useState<'signin' | 'register'>('signin');

  const [email, setEmail] = useState('citizen@nisos.cy');
  const [pin, setPin] = useState('1234');

  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPin, setRegPin] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const completeLogin = async (sessionId: string) => {
    // Persist the session BEFORE refreshing so the registry's per-call
    // session check (localStorage) sees it and the live adapters kick in.
    localStorage.setItem('nisos_session_id', sessionId);
    await refresh(); // re-fetch identity + banking now that a session exists
    onLogin(sessionId);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const { sessionId } = await res.json();
      await completeLogin(sessionId);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      if (!/^\d{4,6}$/.test(regPin)) throw new Error('PIN must be 4-6 digits');
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: regEmail, pin: regPin }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not create your account');
      await completeLogin(body.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--s5)' }}>
      <Logo size={80} />
      <h1 className="serif" style={{ font: '400 40px/1.1 var(--font-display)', marginTop: 'var(--s6)', marginBottom: 'var(--s4)', textAlign: 'center' }}>
        {t('brand.tagline')}
      </h1>

      <div className="row" style={{ gap: 6, marginBottom: 'var(--s5)', background: 'var(--surface-2)', padding: 4, borderRadius: 'var(--radius)' }}>
        <button
          type="button"
          className="chip"
          aria-pressed={mode === 'signin'}
          onClick={() => {
            setMode('signin');
            setError('');
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={mode === 'register'}
          onClick={() => {
            setMode('register');
            setError('');
          }}
        >
          Create account
        </button>
      </div>

      {mode === 'signin' ? (
        <div style={{ width: '100%', maxWidth: 360, marginBottom: 'var(--s5)' }}>
          <label className="t-sm" style={{ display: 'block', marginBottom: 'var(--s2)' }}>
            Email
          </label>
          <input
            type="email"
            placeholder="citizen@nisos.cy"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.currentTarget.value)}
            style={inputStyle}
          />

          <label className="t-sm" style={{ display: 'block', marginBottom: 'var(--s2)' }}>
            PIN (Demo: 1234)
          </label>
          <input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPin(e.currentTarget.value)}
            style={inputStyle}
          />

          {error && <div style={{ color: 'var(--signal-alert)', marginBottom: 'var(--s3)' }} className="t-sm">{error}</div>}

          <Button block loading={loading} onClick={handleLogin} style={{ marginBottom: 'var(--s3)' }}>
            Sign in
          </Button>

          <div className="t-sm muted" style={{ textAlign: 'center' }}>
            Demo credentials:
            <br />
            citizen@nisos.cy | 1234
          </div>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 360, marginBottom: 'var(--s5)' }}>
          <label className="t-sm" style={{ display: 'block', marginBottom: 'var(--s2)' }}>
            Full name
          </label>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.currentTarget.value)}
            style={inputStyle}
          />

          <label className="t-sm" style={{ display: 'block', marginBottom: 'var(--s2)' }}>
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={regEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegEmail(e.currentTarget.value)}
            style={inputStyle}
          />

          <label className="t-sm" style={{ display: 'block', marginBottom: 'var(--s2)' }}>
            Choose a PIN (4-6 digits)
          </label>
          <input
            type="password"
            inputMode="numeric"
            placeholder="e.g. 4821"
            value={regPin}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegPin(e.currentTarget.value)}
            style={inputStyle}
          />

          {error && <div style={{ color: 'var(--signal-alert)', marginBottom: 'var(--s3)' }} className="t-sm">{error}</div>}

          <Button
            block
            loading={loading}
            disabled={!name.trim() || !regEmail.trim() || !regPin}
            onClick={handleRegister}
            style={{ marginBottom: 'var(--s3)' }}
          >
            Create account
          </Button>

          <div className="t-sm muted" style={{ textAlign: 'center' }}>
            Creates a real, empty account on the Nisos backend under your own name — no seeded demo data. Add your own
            bank accounts from Money once you're in.
          </div>
        </div>
      )}
    </div>
  );
}
