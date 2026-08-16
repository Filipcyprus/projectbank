import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { BiometricGate, DemoQr } from '../../components/auth';
import { Badge, Button, Card, Disclaimer, ListRow, ResultState, Sheet, Skeleton, StatusBadge, TopBar } from '../../components/ui';
import { navigate } from '../../lib/router';
import { dateShort } from '../../lib/format';
import { useApp } from '../../state/store';
import { registry } from '../../integrations/registry';

export function DigitalId() {
  const { state, t, intlLocale } = useApp();
  const { identity, load } = state;
  const [unlocked, setUnlocked] = useState(false);
  const [gate, setGate] = useState(false);
  const [afterUnlock, setAfterUnlock] = useState<'view' | 'qr'>('view');
  const [qrOpen, setQrOpen] = useState(false);
  const [verify, setVerify] = useState<'idle' | 'running' | 'done'>('idle');
  const [verifyResult, setVerifyResult] = useState<string>();

  const runVerify = async () => {
    setVerify('running');
    try {
      const res = await registry.ports.identity.verify('substantial');
      setVerifyResult(res.assurance);
    } catch {
      setVerifyResult(undefined);
    }
    setVerify('done');
  };

  const onUnlocked = () => {
    setGate(false);
    setUnlocked(true);
    if (afterUnlock === 'qr') setQrOpen(true);
  };

  return (
    <>
      <TopBar title={t('id.title')} onBack />
      <div className="page">
        {load.identity === 'loading' || !identity ? (
          <Card>
            <Skeleton h={140} r={16} />
            <div className="mt4">
              <Skeleton h={14} w="60%" />
            </div>
          </Card>
        ) : !unlocked ? (
          <>
            <Card className="center" style={{ paddingBlock: 'var(--s7)' }}>
              <div className="bio-ring" style={{ margin: '0 auto var(--s5)' }}>
                <Icon name="fingerprint" size={40} strokeWidth={1.4} />
              </div>
              <h2 className="t-h2">{t('id.unlock')}</h2>
              <p className="t-sm muted mt2" style={{ maxWidth: 280, margin: '8px auto 0' }}>
                {t('id.unlockHint')}
              </p>
              <Button
                block
                className="mt6"
                icon="unlock"
                onClick={() => {
                  setAfterUnlock('view');
                  setGate(true);
                }}
              >
                {t('id.unlock')}
              </Button>
            </Card>

            <div className="mt5">
              <Disclaimer icon="shield">{t('id.disclaimer')}</Disclaimer>
            </div>
          </>
        ) : (
          <>
            {/* The credential ------------------------------------------------ */}
            <div className="id-card rise">
              <div className="row-between" style={{ alignItems: 'flex-start', marginBottom: 'var(--s5)' }}>
                <div>
                  <div className="t-xs" style={{ opacity: 0.7, letterSpacing: '.1em' }}>
                    Republic of Cyprus · prototype credential
                  </div>
                  <div style={{ font: '600 20px/1.2 var(--font)', marginTop: 6 }}>{identity.fullName}</div>
                </div>
                <span className="badge" style={{ background: 'rgba(255,255,255,.16)', color: '#fff' }}>
                  <Icon name="check-circle" size={12} /> {t('home.verified')}
                </span>
              </div>

              <div className="row" style={{ gap: 'var(--s5)', alignItems: 'flex-start' }}>
                <div className="photo">{identity.photoInitials}</div>
                <div className="grid" style={{ gap: 'var(--s4)', flex: 1 }}>
                  <div className="id-field">
                    <div className="k">{t('id.dob')}</div>
                    <div className="v">{dateShort(identity.dateOfBirth, intlLocale)}</div>
                  </div>
                  <div className="id-field">
                    <div className="k">{t('id.number')}</div>
                    <div className="v">{identity.digitalIdNumber}</div>
                  </div>
                  <div className="id-field">
                    <div className="k">Civil registry no.</div>
                    <div className="v">{identity.idNumber}</div>
                  </div>
                </div>
              </div>

              <div className="row-between" style={{ marginTop: 'var(--s6)' }}>
                <div className="id-field">
                  <div className="k">{t('id.assurance')}</div>
                  <div className="v" style={{ textTransform: 'capitalize' }}>
                    {identity.assuranceLevel}
                  </div>
                </div>
                <div className="id-field" style={{ textAlign: 'end' }}>
                  <div className="k">{t('common.expires')}</div>
                  <div className="v">{dateShort(identity.expiresAt, intlLocale)}</div>
                </div>
              </div>
              <div className="id-holo" aria-hidden="true" />
            </div>

            <div className="row" style={{ gap: 8, marginTop: 'var(--s4)' }}>
              <StatusBadge status={registry.descriptorFor('identity').status} />
              <Badge tone="info">Assurance: {identity.assuranceLevel}</Badge>
            </div>

            <div className="grid mt5" style={{ gap: 10 }}>
              <Button block icon="qr" onClick={() => setQrOpen(true)}>
                {t('id.show')}
              </Button>
              <Button variant="secondary" block icon="share" onClick={() => navigate('/id/share')}>
                {t('id.shareSelected')}
              </Button>
              <Button variant="outline" block icon="shield" onClick={runVerify}>
                {t('id.verifyIdentity')}
              </Button>
            </div>

            <Card pad="sm" className="mt5">
              <div className="list">
                <ListRow
                  icon="check-circle"
                  iconTone="ok"
                  title={t('id.status')}
                  end={<Badge tone="ok">{t('home.verified')}</Badge>}
                />
                <ListRow icon="calendar" title="Issued" end={dateShort(identity.issuedAt, intlLocale)} />
                <ListRow icon="globe" title="Nationality" end={identity.nationality} />
                <ListRow
                  icon="lock"
                  title="Protected by"
                  end={state.security.biometrics ? 'Biometrics + PIN' : 'PIN'}
                />
              </div>
            </Card>

            <div className="mt5">
              <Disclaimer icon="shield">{t('id.disclaimer')}</Disclaimer>
            </div>
          </>
        )}
      </div>

      <BiometricGate
        open={gate}
        title={t('id.unlock')}
        reason={t('id.unlockHint')}
        confirmLabel={t('id.unlock')}
        onSuccess={onUnlocked}
        onCancel={() => setGate(false)}
      />

      <Sheet open={qrOpen} onClose={() => setQrOpen(false)} title={t('id.show')}>
        <div className="center">
          <div className="qr-frame">
            <DemoQr payload={`nisos-id:${identity?.digitalIdNumber ?? 'demo'}`} />
          </div>
          <p className="t-h3 mt5">{identity?.fullName}</p>
          <p className="t-sm muted mt2">{identity?.digitalIdNumber}</p>
          <div className="row" style={{ justifyContent: 'center', gap: 8, marginTop: 'var(--s4)' }}>
            <StatusBadge status={registry.descriptorFor('identity').status} />
            <Badge tone="info">{t('id.expiresIn')}</Badge>
          </div>
          <p className="t-sm subtle mt4" style={{ maxWidth: 290, margin: '16px auto 0' }}>
            This graphic is illustrative and cannot be scanned. Presenting identity to a real verifier requires an
            accredited government identity provider.
          </p>
        </div>
      </Sheet>

      <Sheet open={verify !== 'idle'} onClose={() => setVerify('idle')}>
        {verify === 'running' ? (
          <div className="center" style={{ padding: 'var(--s7) 0' }}>
            <div className="bio-ring scanning" style={{ margin: '0 auto var(--s5)' }}>
              <Icon name="face" size={38} strokeWidth={1.4} />
            </div>
            <p className="t-sm muted">Running the assurance check…</p>
          </div>
        ) : (
          <ResultState
            tone="info"
            title="Simulated check complete"
            body={
              <>
                Assurance recorded as <strong>{verifyResult ?? 'substantial (simulated)'}</strong>. Legally meaningful
                identity assurance can only be issued by an accredited provider — this prototype does not perform
                document or liveness checks.
              </>
            }
          >
            <Button block className="mt6" onClick={() => setVerify('idle')}>
              {t('common.done')}
            </Button>
          </ResultState>
        )}
      </Sheet>
    </>
  );
}
