import React, { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';
import { BiometricGate } from '../../components/auth';
import { Badge, Button, Card, Disclaimer, ListRow, ResultState, SectionHead, Segmented, Sheet, Skeleton, Switch, TopBar } from '../../components/ui';
import { ProgressRing } from '../../components/charts';
import { navigate } from '../../lib/router';
import { dateShort, relativeDay, timeShort } from '../../lib/format';
import { securityScore, useApp } from '../../state/store';
import type { LoginEvent } from '../../data/seed';
import { getNisosLoginHistory, hasNisosSession } from '../../integrations/adapters/nisosSecurityAdapter';

/**
 * Real, server-recorded sign-in history when signed in through the Nisos
 * backend (survives a reinstall, can't be edited from this device); the
 * on-device demo history otherwise. Shared by the summary row on the
 * Security home and the full Login history screen.
 */
function useLoginHistory() {
  const { state } = useApp();
  const real = hasNisosSession();
  const [events, setEvents] = useState<LoginEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!real) return;
    let cancelled = false;
    getNisosLoginHistory()
      .then((h) => {
        if (!cancelled) setEvents(h);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your sign-in history.');
      });
    return () => {
      cancelled = true;
    };
  }, [real]);

  if (!real) return { events: state.loginHistory, loading: false, error: null, real: false };
  if (error) return { events: state.loginHistory, loading: false, error, real: true };
  if (events === null) return { events: [], loading: true, error: null, real: true };
  return { events, loading: false, error: null, real: true };
}

const AUTO_LOCK_OPTIONS: { value: string; label: string }[] = [
  { value: '0', label: 'Off' },
  { value: '1', label: '1 min' },
  { value: '5', label: '5 min' },
  { value: '15', label: '15 min' },
];

export function SecurityCenter() {
  const { state, dispatch, t, intlLocale, toast } = useApp();
  const s = state.security;
  const score = securityScore(s);
  const [gate, setGate] = useState<null | 'freezeAccount' | 'emergency'>(null);
  const loginHistory = useLoginHistory();

  const recommendations = [
    !s.recoveryContact && { key: 'recoveryContact' as const, label: 'Add a recovery contact', points: 10 },
    !s.emergencyAccess && { key: 'emergencyAccess' as const, label: 'Set up emergency access', points: 5 },
    !s.twoFactor && { key: 'twoFactor' as const, label: 'Turn on two-factor authentication', points: 20 },
  ].filter(Boolean) as { key: 'recoveryContact' | 'emergencyAccess' | 'twoFactor'; label: string; points: number }[];

  return (
    <>
      <TopBar title={t('sec.title')} onBack />
      <div className="page">
        <Card>
          <div className="row" style={{ gap: 'var(--s5)' }}>
            <ProgressRing
              value={score}
              size={96}
              thickness={9}
              color={score >= 85 ? 'var(--ok-500)' : score >= 60 ? 'var(--warn-500)' : 'var(--danger-500)'}
            />
            <div style={{ flex: 1 }}>
              <div className="t-sm muted">{t('sec.score')}</div>
              <div style={{ font: '600 22px/1.2 var(--font)', marginTop: 4 }}>{score}%</div>
              <p className="t-sm muted mt2">
                {score >= 85 ? t('sec.scoreGood') : 'A few steps would make your account harder to take over.'}
              </p>
            </div>
          </div>
        </Card>

        {recommendations.length > 0 && (
          <>
            <SectionHead title={t('sec.recommended')} />
            <div className="list card-list">
              {recommendations.map((r) => (
                <ListRow
                  key={r.key}
                  icon="sparkle"
                  iconTone="accent"
                  title={r.label}
                  sub={`+${r.points} points`}
                  end={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        dispatch({ type: 'security', patch: { [r.key]: true } });
                        toast(`${r.label} — done.`);
                      }}
                    >
                      Enable
                    </Button>
                  }
                />
              ))}
            </div>
          </>
        )}

        <SectionHead title="Sign-in" />
        <div className="list card-list">
          <div className="list-row">
            <span className="avatar-ico ok">
              <Icon name="fingerprint" size={19} />
            </span>
            <div className="body">
              <div className="title">{t('sec.biometrics')}</div>
              <div className="sub">Unlock the app and confirm payments</div>
            </div>
            <Switch
              checked={s.biometrics}
              label={t('sec.biometrics')}
              onChange={(v) => dispatch({ type: 'security', patch: { biometrics: v } })}
            />
          </div>
          <ListRow
            icon="lock"
            title={t('sec.pin')}
            sub={s.pinSet ? '4-digit PIN set' : 'Not set'}
            end={<Badge tone={s.pinSet ? 'ok' : 'warn'}>{s.pinSet ? 'Active' : 'Off'}</Badge>}
            onClick={() => toast('PIN change is available during onboarding in this prototype.')}
          />
          <div className="list-row">
            <span className="avatar-ico info">
              <Icon name="phone" size={19} />
            </span>
            <div className="body">
              <div className="title">{t('sec.twoFactor')}</div>
              <div className="sub">One-time code on sign-in from a new device</div>
            </div>
            <Switch
              checked={s.twoFactor}
              label={t('sec.twoFactor')}
              onChange={(v) => dispatch({ type: 'security', patch: { twoFactor: v } })}
            />
          </div>
          <div className="list-row" style={{ alignItems: 'flex-start' }}>
            <span className="avatar-ico warn">
              <Icon name="clock" size={19} />
            </span>
            <div className="body">
              <div className="title">Auto-lock</div>
              <div className="sub mb2">Re-locks after this long away, on any device</div>
              <Segmented
                options={AUTO_LOCK_OPTIONS}
                value={String(s.autoLockMinutes)}
                onChange={(v) => {
                  dispatch({ type: 'security', patch: { autoLockMinutes: Number(v) } });
                  toast(v === '0' ? 'Auto-lock turned off.' : `Auto-locks after ${v} minute${v === '1' ? '' : 's'}.`);
                }}
              />
            </div>
          </div>
          <ListRow
            icon="lock"
            iconTone="danger"
            title="Lock app now"
            sub="Require biometrics or PIN immediately"
            onClick={() => dispatch({ type: 'lock', value: true })}
          />
        </div>

        <SectionHead title="Transactions" />
        <div className="list card-list">
          <div className="list-row">
            <span className="avatar-ico accent">
              <Icon name="check-circle" size={19} />
            </span>
            <div className="body">
              <div className="title">{t('sec.txConfirm')}</div>
              <div className="sub">Biometric confirmation on every payment</div>
            </div>
            <Switch
              checked={s.confirmEveryTransaction}
              label={t('sec.txConfirm')}
              onChange={(v) => dispatch({ type: 'security', patch: { confirmEveryTransaction: v } })}
            />
          </div>
          <div className="list-row">
            <span className="avatar-ico warn">
              <Icon name="bell" size={19} />
            </span>
            <div className="body">
              <div className="title">{t('sec.alerts')}</div>
              <div className="sub">Alerts for new devices and unusual activity</div>
            </div>
            <Switch
              checked={s.securityAlerts}
              label={t('sec.alerts')}
              onChange={(v) => dispatch({ type: 'security', patch: { securityAlerts: v } })}
            />
          </div>
          <div className="list-row">
            <span className="avatar-ico danger">
              <Icon name="snowflake" size={19} />
            </span>
            <div className="body">
              <div className="title">{t('sec.freezeCard')}</div>
              <div className="sub">Block new card payments instantly</div>
            </div>
            <Switch
              checked={s.cardFrozen}
              label={t('sec.freezeCard')}
              onChange={(v) => {
                dispatch({ type: 'security', patch: { cardFrozen: v } });
                toast(v ? 'Card frozen' : 'Card unfrozen');
              }}
            />
          </div>
        </div>

        <SectionHead title="Access" />
        <div className="list card-list">
          <ListRow
            icon="phone"
            title={t('sec.devices')}
            sub={`${state.devices.length} devices · ${state.devices.filter((d) => d.trusted).length} trusted`}
            chevron
            onClick={() => navigate('/security/devices')}
          />
          <ListRow
            icon="clock"
            title={t('sec.loginHistory')}
            sub={
              loginHistory.loading
                ? 'Loading…'
                : loginHistory.events.length > 0
                  ? `Last sign-in ${relativeDay(loginHistory.events[0].at, intlLocale)}`
                  : 'No sign-ins recorded yet'
            }
            end={loginHistory.real ? <Badge tone="info">Server-recorded</Badge> : undefined}
            chevron
            onClick={() => navigate('/security/logins')}
          />
          <ListRow
            icon="users"
            title={t('sec.emergency')}
            sub={s.emergencyAccess ? 'A trusted contact can request access' : 'Not configured'}
            end={<Badge tone={s.emergencyAccess ? 'ok' : 'default'}>{s.emergencyAccess ? 'On' : 'Off'}</Badge>}
            onClick={() => setGate('emergency')}
          />
          <ListRow
            icon="shield"
            title="Data & consents"
            sub={`${state.identityShares.filter((sh) => sh.status === 'active').length} active share${state.identityShares.filter((sh) => sh.status === 'active').length === 1 ? '' : 's'} · ${state.dataAccessLog.length} logged event${state.dataAccessLog.length === 1 ? '' : 's'}`}
            chevron
            onClick={() => navigate('/security/data')}
          />
        </div>

        <SectionHead title="Emergency controls" />
        <Card>
          <div className="row-between">
            <div className="row" style={{ gap: 'var(--s4)', alignItems: 'flex-start' }}>
              <span className="avatar-ico danger">
                <Icon name="alert" size={20} />
              </span>
              <div>
                <div style={{ font: '500 15px/1.3 var(--font)' }}>{t('sec.freezeAccount')}</div>
                <p className="t-sm muted mt2">
                  Suspends payments, identity sharing and document access on every device until you unfreeze it.
                </p>
              </div>
            </div>
            {s.accountFrozen && <Badge tone="danger">Frozen</Badge>}
          </div>
          <Button
            variant={s.accountFrozen ? 'secondary' : 'danger'}
            block
            className="mt4"
            icon="snowflake"
            onClick={() => setGate('freezeAccount')}
          >
            {s.accountFrozen ? 'Unfreeze account' : t('sec.freezeAccount')}
          </Button>
        </Card>

        <div className="mt5">
          <Disclaimer icon="shield">
            Security settings here are prototype state held on this device. In production these controls are enforced
            server-side, audited, and mirrored across all your sessions immediately.
          </Disclaimer>
        </div>
      </div>

      <BiometricGate
        open={gate !== null}
        title={gate === 'freezeAccount' ? (s.accountFrozen ? 'Unfreeze account' : t('sec.freezeAccount')) : t('sec.emergency')}
        reason={
          gate === 'freezeAccount'
            ? s.accountFrozen
              ? 'Confirm you want to resume activity'
              : 'Confirm you want to suspend all activity'
            : 'Confirm changes to emergency access'
        }
        onSuccess={() => {
          if (gate === 'freezeAccount') {
            const next = !s.accountFrozen;
            dispatch({ type: 'security', patch: { accountFrozen: next } });
            toast(next ? 'Account frozen. All payments are suspended.' : 'Account unfrozen.');
          } else {
            dispatch({ type: 'security', patch: { emergencyAccess: !s.emergencyAccess } });
            toast(s.emergencyAccess ? 'Emergency access removed.' : 'Emergency access enabled.');
          }
          setGate(null);
        }}
        onCancel={() => setGate(null)}
      />
    </>
  );
}

export function DevicesScreen() {
  const { state, dispatch, t, intlLocale, toast } = useApp();
  const [action, setAction] = useState<string | null>(null);
  const [trustGate, setTrustGate] = useState(false);
  const device = state.devices.find((d) => d.id === action);

  return (
    <>
      <TopBar title={t('sec.devices')} onBack />
      <div className="page">
        <div className="list card-list">
          {state.devices.map((d) => (
            <ListRow
              key={d.id}
              icon="phone"
              iconTone={d.current ? 'ok' : d.trusted ? 'sea' : 'warn'}
              title={
                <span className="row" style={{ gap: 8 }}>
                  {d.name}
                  {d.current && <Badge tone="ok">This device</Badge>}
                </span>
              }
              sub={`${d.platform} · ${d.location}`}
              end={relativeDay(d.lastActive, intlLocale)}
              endSub={d.trusted ? 'Trusted' : 'Not trusted'}
              onClick={d.current ? undefined : () => setAction(d.id)}
            />
          ))}
        </div>

        <div className="mt5">
          <Disclaimer icon="info">
            Revoking a device ends its session immediately and requires full re-authentication, including identity
            step-up for sensitive actions. Trusting a device only relaxes prompts on this local record — it does not
            push approval to that device, since there is no account server behind this prototype to carry it.
          </Disclaimer>
        </div>
      </div>

      <Sheet open={!!device} onClose={() => setAction(null)} title={device?.name}>
        {device && (
          <>
            <p className="t-sm muted mb5">{device.platform} · {device.location}</p>
            {!device.trusted && (
              <Button block icon="shield" className="mb2" onClick={() => setTrustGate(true)}>
                Trust this device
              </Button>
            )}
            <Button
              variant="danger"
              block
              onClick={() => {
                dispatch({ type: 'revokeDevice', id: device.id });
                setAction(null);
                toast('Device revoked.');
              }}
            >
              Revoke access
            </Button>
            <Button variant="quiet" block className="mt2" onClick={() => setAction(null)}>
              {t('common.cancel')}
            </Button>
          </>
        )}
      </Sheet>

      <BiometricGate
        open={trustGate}
        title="Confirm to trust this device"
        reason={device ? `Mark ${device.name} as trusted` : undefined}
        confirmLabel="Trust device"
        onSuccess={() => {
          dispatch({ type: 'trustDevice', id: device!.id });
          setTrustGate(false);
          setAction(null);
          toast('Device trusted.');
        }}
        onCancel={() => setTrustGate(false)}
      />
    </>
  );
}

export function LoginHistoryScreen() {
  const { t, intlLocale } = useApp();
  const [detail, setDetail] = useState<string | null>(null);
  const { events, loading, error, real } = useLoginHistory();
  const event = events.find((l) => l.id === detail);

  return (
    <>
      <TopBar title={t('sec.loginHistory')} onBack />
      <div className="page">
        {real && (
          <div className="row" style={{ justifyContent: 'flex-end', marginBottom: 'var(--s3)' }}>
            <Badge tone="info">Recorded by the Nisos backend</Badge>
          </div>
        )}

        {loading ? (
          <Card>
            <Skeleton h={14} w="70%" />
            <div className="mt3">
              <Skeleton h={14} w="55%" />
            </div>
            <div className="mt3">
              <Skeleton h={14} w="60%" />
            </div>
          </Card>
        ) : error ? (
          <Card>
            <p className="t-sm" style={{ color: 'var(--danger-500)' }}>
              {error}
            </p>
          </Card>
        ) : events.length === 0 ? (
          <Card flat pad="sm">
            <p className="t-sm muted">No sign-ins recorded yet.</p>
          </Card>
        ) : (
          <div className="list card-list">
            {events.map((l) => (
              <ListRow
                key={l.id}
                icon={l.outcome === 'success' ? 'check-circle' : l.outcome === 'blocked' ? 'shield' : 'alert'}
                iconTone={l.outcome === 'success' ? 'ok' : l.outcome === 'blocked' ? 'danger' : 'warn'}
                title={`${l.method} · ${l.device}`}
                sub={`${l.location} · ${relativeDay(l.at, intlLocale)} ${timeShort(l.at, intlLocale)}`}
                end={
                  <Badge tone={l.outcome === 'success' ? 'ok' : l.outcome === 'blocked' ? 'danger' : 'warn'}>
                    {l.outcome}
                  </Badge>
                }
                onClick={() => setDetail(l.id)}
              />
            ))}
          </div>
        )}

        <div className="mt5">
          <Disclaimer icon="info">
            {real
              ? "Every sign-in to your account is recorded on the Nisos backend, including failed attempts with the right email but the wrong PIN — so you can tell if someone else tried to get in. This list survives a reinstall; it isn't just kept on this device."
              : 'A blocked sign-in from an unusual location is shown as a security event, not hidden. Real deployments retain these records for audit and can export them on request.'}
          </Disclaimer>
        </div>
      </div>

      <Sheet open={!!event} onClose={() => setDetail(null)} title="Sign-in detail">
        {event && (
          <div className="list card-list">
            <ListRow icon="clock" title="When" end={`${dateShort(event.at, intlLocale)} ${timeShort(event.at, intlLocale)}`} />
            <ListRow icon="phone" title="Device" end={event.device} />
            <ListRow icon="globe" title="Location" end={event.location} />
            <ListRow icon="key" title="Method" end={event.method} />
            <ListRow
              icon="shield"
              title="Outcome"
              end={<Badge tone={event.outcome === 'success' ? 'ok' : 'danger'}>{event.outcome}</Badge>}
            />
          </div>
        )}
      </Sheet>
    </>
  );
}

const ACCESS_CATEGORY_META: Record<string, { icon: 'id-card' | 'gov' | 'money' | 'doc'; tone: 'accent' | 'sea' | 'ok' | 'info' }> = {
  identity: { icon: 'id-card', tone: 'accent' },
  government: { icon: 'gov', tone: 'sea' },
  banking: { icon: 'money', tone: 'ok' },
  documents: { icon: 'doc', tone: 'info' },
};

function shareStatus(share: { status: 'active' | 'expired' | 'revoked'; expiresAt: string }): 'active' | 'expired' | 'revoked' {
  if (share.status === 'revoked') return 'revoked';
  if (new Date(share.expiresAt).getTime() < Date.now()) return 'expired';
  return 'active';
}

export function DataPrivacyScreen() {
  const { state, dispatch, t, intlLocale, toast } = useApp();
  const [tab, setTab] = useState<'consents' | 'log'>('consents');

  const log = [...state.dataAccessLog].sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <>
      <TopBar title="Data & consents" onBack />
      <div className="page">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'consents', label: 'Active consents' },
            { value: 'log', label: 'Access log' },
          ]}
        />

        {tab === 'consents' ? (
          <div className="mt5">
            {state.identityShares.length === 0 ? (
              <Card flat pad="sm">
                <p className="t-sm muted">
                  Nothing shared yet. When you release Digital ID fields from <strong>Share identity</strong>, they'll
                  appear here so you can see and revoke exactly what you've given out.
                </p>
              </Card>
            ) : (
              <div className="list card-list">
                {state.identityShares.map((share) => {
                  const status = shareStatus(share);
                  return (
                    <ListRow
                      key={share.id}
                      icon="id-card"
                      iconTone={status === 'active' ? 'accent' : 'default'}
                      title={share.audience}
                      sub={share.claims.join(', ')}
                      end={
                        <Badge tone={status === 'active' ? 'ok' : status === 'revoked' ? 'danger' : 'default'}>
                          {status}
                        </Badge>
                      }
                      endSub={`${relativeDay(share.createdAt, intlLocale)} ${timeShort(share.createdAt, intlLocale)}`}
                      onClick={
                        status === 'active'
                          ? () => {
                              dispatch({ type: 'revokeIdentityShare', id: share.id });
                              toast(`Revoked access for ${share.audience}.`);
                            }
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            )}

            <div className="mt5">
              <Disclaimer icon="shield">
                Tap an active consent to revoke it immediately. Share codes also expire on their own five minutes
                after creation, whether or not you revoke them.
              </Disclaimer>
            </div>
          </div>
        ) : (
          <div className="mt5">
            {log.length === 0 ? (
              <Card flat pad="sm">
                <p className="t-sm muted">
                  Every identity share, government submission, bank connection attempt and document signature you make
                  will be logged here, on this device.
                </p>
              </Card>
            ) : (
              <div className="list card-list">
                {log.map((e) => {
                  const meta = ACCESS_CATEGORY_META[e.category];
                  return (
                    <ListRow
                      key={e.id}
                      icon={meta.icon}
                      iconTone={meta.tone}
                      title={e.action}
                      sub={`${e.actor}${e.detail ? ` · ${e.detail}` : ''}`}
                      end={`${relativeDay(e.at, intlLocale)} ${timeShort(e.at, intlLocale)}`}
                    />
                  );
                })}
              </div>
            )}

            <div className="mt5">
              <Disclaimer icon="info">
                This log lives only on this device — there is no server collecting it. A production build would keep
                the same log server-side too, for account recovery and to answer "who accessed my data" even after a
                reinstall.
              </Disclaimer>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
