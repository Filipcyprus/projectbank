import React, { useEffect, useState } from 'react';
import { Icon, Logo } from './Icon';
import { Button, FullScreenLayer, Sheet } from './ui';
import { useApp, usePinLockout } from '../state/store';

/* ---------------------------------------------------------------------------
 * Authentication surfaces.
 *
 * In this prototype the biometric check is simulated. In a production build
 * this component wraps the platform authenticator (WebAuthn / passkeys on web,
 * Face ID / fingerprint on device). The key never leaves the secure element and
 * the app only ever receives a signed assertion — which is why the confirm
 * step lives here, wrapping every sensitive action, rather than in each screen.
 * ------------------------------------------------------------------------- */

export const DEMO_PIN = '1234';

type Phase = 'idle' | 'scanning' | 'success' | 'error';

export function BiometricGate({
  open,
  title,
  reason,
  confirmLabel,
  onSuccess,
  onCancel,
}: {
  open: boolean;
  title: string;
  reason?: string;
  confirmLabel?: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { state, t } = useApp();
  const pinLockout = usePinLockout();
  const [phase, setPhase] = useState<Phase>('idle');
  const [usePin, setUsePin] = useState(!state.security.biometrics);

  useEffect(() => {
    if (open) {
      setPhase('idle');
      setUsePin(!state.security.biometrics);
    }
  }, [open, state.security.biometrics]);

  const runScan = () => {
    setPhase('scanning');
    window.setTimeout(() => {
      setPhase('success');
      window.setTimeout(() => {
        onSuccess();
      }, 480);
    }, 1100);
  };

  return (
    <Sheet open={open} onClose={phase === 'scanning' ? () => {} : onCancel} title={title}>
      {usePin ? (
        <PinEntry
          prompt={reason ?? t('sec.pin')}
          onDone={(ok) => {
            if (ok) {
              pinLockout.registerSuccess();
              onSuccess();
            }
          }}
          onFail={pinLockout.registerFail}
          locked={pinLockout.locked}
          remainingSeconds={pinLockout.remainingSeconds}
          attemptsLeft={pinLockout.attemptsLeft}
          onCancelToBiometrics={state.security.biometrics ? () => setUsePin(false) : undefined}
        />
      ) : (
        <div className="bio-prompt">
          <div className={`bio-ring${phase === 'success' ? ' scanning' : ''}`}>
            <Icon
              name={phase === 'success' ? 'check' : 'face'}
              size={40}
              strokeWidth={phase === 'success' ? 2.4 : 1.5}
            />
          </div>
          <h3 className="t-h3" style={{ marginBottom: 6 }}>
            {phase === 'success' ? 'Authenticated' : phase === 'scanning' ? 'Verifying…' : reason ?? t('pay.confirmBiometric')}
          </h3>
          <p className="t-sm muted" style={{ maxWidth: 280, marginBottom: 22 }}>
            {phase === 'success'
              ? 'Signature verified on this device.'
              : 'Simulated biometric check. A production build uses the platform authenticator (passkey / Face ID).'}
          </p>
          <Button block loading={phase === 'scanning'} disabled={phase === 'success'} onClick={runScan}>
            {confirmLabel ?? t('pay.confirmBiometric')}
          </Button>
          <button className="btn quiet mt3" onClick={() => setUsePin(true)} type="button">
            Use PIN instead
          </button>
        </div>
      )}
    </Sheet>
  );
}

export function PinEntry({
  prompt,
  onDone,
  onFail,
  onCancelToBiometrics,
  setup,
  locked,
  remainingSeconds,
  attemptsLeft,
}: {
  prompt: string;
  onDone: (ok: boolean, pin?: string) => void;
  /** Called once per wrong entry in verify mode — drives the shared lockout. */
  onFail?: () => void;
  onCancelToBiometrics?: () => void;
  setup?: boolean;
  /** When true, the keypad is replaced by a cooldown message. */
  locked?: boolean;
  remainingSeconds?: number;
  attemptsLeft?: number;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const push = (d: string) => {
    if (locked || pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      window.setTimeout(() => {
        if (setup || next === DEMO_PIN) {
          onDone(true, next);
          setPin('');
        } else {
          onFail?.();
          setError(true);
          window.setTimeout(() => {
            setError(false);
            setPin('');
          }, 480);
        }
      }, 160);
    }
  };

  if (locked) {
    return (
      <div className="center">
        <span className="avatar-ico danger" style={{ width: 48, height: 48, margin: '0 auto 14px' }}>
          <Icon name="lock" size={22} />
        </span>
        <h3 className="t-h3" style={{ marginBottom: 6 }}>
          Too many attempts
        </h3>
        <p className="t-sm muted" style={{ maxWidth: 260, marginBottom: 4 }}>
          The PIN pad is locked for your protection.
        </p>
        <p className="t-sm num" style={{ color: 'var(--danger-500)', fontWeight: 600 }}>
          Try again in {Math.max(0, remainingSeconds ?? 0)}s
        </p>
      </div>
    );
  }

  return (
    <div className="center">
      <p className="t-sm muted" style={{ marginBottom: 4 }}>
        {prompt}
      </p>
      <div className={`pin-dots${error ? ' shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i < pin.length ? 'on' : ''} />
        ))}
      </div>
      {error && (
        <p className="t-sm" style={{ color: 'var(--danger-500)', marginBottom: 12 }}>
          Incorrect PIN.{' '}
          {attemptsLeft !== undefined ? `${Math.max(0, attemptsLeft - 1)} attempts remaining before lock.` : ''}
        </p>
      )}
      {!setup && (
        <p className="t-xs subtle" style={{ marginBottom: 12, textTransform: 'none', letterSpacing: 0 }}>
          Prototype PIN: {DEMO_PIN}
        </p>
      )}
      <div className="keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} onClick={() => push(d)} type="button">
            {d}
          </button>
        ))}
        <button aria-hidden="true" tabIndex={-1} style={{ visibility: 'hidden' }} />
        <button onClick={() => push('0')} type="button">
          0
        </button>
        <button onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Delete" type="button">
          <Icon name="chevron-left" size={22} />
        </button>
      </div>
      {onCancelToBiometrics && (
        <button className="btn quiet mt3" onClick={onCancelToBiometrics} type="button">
          Use biometrics
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * App lock screen.
 *
 * Shown full-screen, undismissable except by unlocking (or explicitly
 * signing out), whenever the store decides the app should re-lock — see the
 * auto-lock effect in state/store.tsx. This is what makes autoLockMinutes
 * more than a setting nobody enforces.
 * ------------------------------------------------------------------------- */

export function AppLockScreen({ open }: { open: boolean }) {
  const { state, dispatch, t } = useApp();
  const pinLockout = usePinLockout();
  const [phase, setPhase] = useState<Phase>('idle');
  const [usePin, setUsePin] = useState(!state.security.biometrics);

  useEffect(() => {
    if (open) {
      setPhase('idle');
      setUsePin(!state.security.biometrics);
    }
  }, [open, state.security.biometrics]);

  if (!open) return null;

  const unlock = () => {
    pinLockout.registerSuccess();
    dispatch({ type: 'lock', value: false });
  };

  const runScan = () => {
    setPhase('scanning');
    window.setTimeout(() => {
      setPhase('success');
      window.setTimeout(unlock, 420);
    }, 1000);
  };

  return (
    <FullScreenLayer open>
      <div className="lock-screen">
        <div style={{ flex: 1 }} />
        <div className="center">
          <Logo size={44} />
          <h1 className="t-h1 mt5">Nisos is locked</h1>
          <p className="t-sm muted mt2" style={{ maxWidth: 260, margin: '8px auto 0' }}>
            {state.security.autoLockMinutes > 0
              ? `Locked automatically after ${state.security.autoLockMinutes} minute${state.security.autoLockMinutes === 1 ? '' : 's'} away.`
              : 'Unlock to continue.'}
          </p>

          <div className="mt7" style={{ width: '100%' }}>
            {usePin ? (
              <PinEntry
                prompt={t('sec.pin')}
                onDone={(ok) => ok && unlock()}
                onFail={pinLockout.registerFail}
                locked={pinLockout.locked}
                remainingSeconds={pinLockout.remainingSeconds}
                attemptsLeft={pinLockout.attemptsLeft}
                onCancelToBiometrics={state.security.biometrics ? () => setUsePin(false) : undefined}
              />
            ) : (
              <div className="bio-prompt">
                <div className={`bio-ring${phase === 'success' ? ' scanning' : ''}`}>
                  <Icon name={phase === 'success' ? 'check' : 'face'} size={40} strokeWidth={phase === 'success' ? 2.4 : 1.5} />
                </div>
                <h3 className="t-h3" style={{ marginBottom: 6 }}>
                  {phase === 'success' ? 'Authenticated' : phase === 'scanning' ? 'Verifying…' : 'Unlock with biometrics'}
                </h3>
                <Button block loading={phase === 'scanning'} disabled={phase === 'success'} onClick={runScan}>
                  Unlock
                </Button>
                <button className="btn quiet mt3" onClick={() => setUsePin(true)} type="button">
                  Use PIN instead
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button
          className="btn quiet block mb5"
          type="button"
          onClick={() => {
            dispatch({ type: 'lock', value: false });
            dispatch({ type: 'onboarded', value: false });
          }}
        >
          Not you? Sign out
        </button>
      </div>
    </FullScreenLayer>
  );
}

/* ---------------------------------------------------------------------------
 * A deterministic QR-style graphic.
 *
 * This is NOT a real QR encoder — it renders a stable pattern from a payload so
 * share/verify screens look right in the prototype. Scanning it with a phone
 * will not work, and the UI says so wherever it appears.
 * ------------------------------------------------------------------------- */

export function DemoQr({ payload, size = 25 }: { payload: string; size?: number }) {
  const cells: boolean[] = [];
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  const rnd = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1000) / 1000;
  };
  for (let i = 0; i < size * size; i++) cells.push(rnd() > 0.52);

  const isFinder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" role="img" aria-label="Demo QR code">
      <rect width={size} height={size} fill="#fff" />
      {cells.map((on, i) => {
        const x = i % size;
        const y = Math.floor(i / size);
        if (isFinder(x, y) || !on) return null;
        return <rect key={i} x={x} y={y} width="1" height="1" fill="#0B1F2A" rx="0.28" />;
      })}
      {[
        [0, 0],
        [size - 7, 0],
        [0, size - 7],
      ].map(([fx, fy]) => (
        <g key={`${fx}-${fy}`}>
          <rect x={fx} y={fy} width="7" height="7" rx="1.6" fill="#0B1F2A" />
          <rect x={fx + 1.2} y={fy + 1.2} width="4.6" height="4.6" rx="1" fill="#fff" />
          <rect x={fx + 2.3} y={fy + 2.3} width="2.4" height="2.4" rx="0.6" fill="#C05F2C" />
        </g>
      ))}
    </svg>
  );
}
