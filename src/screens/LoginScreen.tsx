import React, { useState } from 'react';
import { useApp } from '../state/store';
import { Button } from '../components/ui';
import { Logo } from '../components/Icon';
import { checkPassword, isFullName, isStrongPassword } from '../lib/password';

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
  const [password, setPassword] = useState('');

  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || 'https://projectbank-production.up.railway.app';

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
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Invalid email or password');
      const { sessionId } = await res.json();
      await completeLogin(sessionId);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setLoading(false);
    }
  };

  const rules = checkPassword(regPassword);
  const nameValid = isFullName(name);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim());
  const passwordValid = isStrongPassword(regPassword);
  const passwordsMatch = regPassword.length > 0 && regPassword === regConfirm;
  const canRegister = nameValid && emailValid && passwordValid && passwordsMatch;

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      if (!canRegister) throw new Error('Fix the highlighted fields before continuing');
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: regEmail, password: regPassword }),
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
            Password
          </label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.currentTarget.value)}
            style={inputStyle}
          />

          {error && <div style={{ color: 'var(--danger-500)', marginBottom: 'var(--s3)' }} className="t-sm">{error}</div>}

          <Button block loading={loading} disabled={!email.trim() || !password} onClick={handleLogin} style={{ marginBottom: 'var(--s3)' }}>
            Sign in
          </Button>

          <div className="t-sm muted" style={{ textAlign: 'center' }}>
            Demo credentials:
            <br />
            citizen@nisos.cy | Cyprus#Nisos2026
          </div>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 360, marginBottom: 'var(--s5)' }}>
          <label className="t-sm" style={{ display: 'block', marginBottom: 'var(--s2)' }}>
            Full name
          </label>
          <input
            type="text"
            placeholder="e.g. Maria Georgiou"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.currentTarget.value)}
            style={inputStyle}
          />
          {name.length > 0 && !nameValid && (
            <div className="t-sm" style={{ color: 'var(--danger-500)', marginTop: -10, marginBottom: 'var(--s3)' }}>
              Enter your first and last name
            </div>
          )}

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
          {regEmail.length > 0 && !emailValid && (
            <div className="t-sm" style={{ color: 'var(--danger-500)', marginTop: -10, marginBottom: 'var(--s3)' }}>
              Enter a valid email address
            </div>
          )}

          <label className="t-sm" style={{ display: 'block', marginBottom: 'var(--s2)' }}>
            Password
          </label>
          <input
            type="password"
            placeholder="Choose a strong password"
            value={regPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegPassword(e.currentTarget.value)}
            onFocus={() => setPasswordTouched(true)}
            style={inputStyle}
          />

          {passwordTouched && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '-10px 0 var(--s3)' }}>
              {rules.map((r) => (
                <li key={r.label} className="t-sm" style={{ color: r.ok ? 'var(--ok-500)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span aria-hidden="true">{r.ok ? '✓' : '○'}</span>
                  {r.label}
                </li>
              ))}
            </ul>
          )}

          <label className="t-sm" style={{ display: 'block', marginBottom: 'var(--s2)' }}>
            Confirm password
          </label>
          <input
            type="password"
            placeholder="Retype your password"
            value={regConfirm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegConfirm(e.currentTarget.value)}
            style={inputStyle}
          />
          {regConfirm.length > 0 && !passwordsMatch && (
            <div className="t-sm" style={{ color: 'var(--danger-500)', marginTop: -10, marginBottom: 'var(--s3)' }}>
              Passwords don't match
            </div>
          )}

          {error && <div style={{ color: 'var(--danger-500)', marginBottom: 'var(--s3)' }} className="t-sm">{error}</div>}

          <Button block loading={loading} disabled={!canRegister} onClick={handleRegister} style={{ marginBottom: 'var(--s3)' }}>
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
