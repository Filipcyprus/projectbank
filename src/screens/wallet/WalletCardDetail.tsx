import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { BiometricGate, DemoQr } from '../../components/auth';
import { Button, Card, Disclaimer, EmptyState, ListRow, ResultState, Sheet, StatusBadge, TopBar } from '../../components/ui';
import { navigate } from '../../lib/router';
import { dateShort, daysUntil } from '../../lib/format';
import { useApp } from '../../state/store';
import { WalletCardTile } from './Wallet';

export function WalletCardDetail({ id }: { id: string }) {
  const { state, t, intlLocale, toast } = useApp();
  const card = state.walletCards.find((c) => c.id === id);
  const [gate, setGate] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [verify, setVerify] = useState<'idle' | 'checking' | 'result'>('idle');

  if (!card) {
    return (
      <>
        <TopBar title={t('wallet.title')} onBack />
        <div className="page">
          <EmptyState title="Card not found" action={{ label: t('common.back'), onClick: () => navigate('/wallet') }} />
        </div>
      </>
    );
  }

  const runVerify = () => {
    setVerify('checking');
    window.setTimeout(() => setVerify('result'), 1200);
  };

  return (
    <>
      <TopBar title={card.name} onBack />
      <div className="page">
        <WalletCardTile card={card} />

        <Card pad="sm" className="mt5">
          <div className="list">
            <ListRow icon="building" title={t('vault.issuer')} end={<span className="t-sm truncate" style={{ maxWidth: 160 }}>{card.issuer}</span>} />
            {card.fields.map((f) => (
              <ListRow key={f.k} icon="info" title={f.k} end={f.v} />
            ))}
            {card.expiresAt && (
              <ListRow
                icon="calendar"
                title={t('common.expires')}
                end={dateShort(card.expiresAt, intlLocale)}
                endSub={daysUntil(card.expiresAt) < 30 ? `${daysUntil(card.expiresAt)} days left` : undefined}
              />
            )}
            <ListRow icon="link" title="Source" end={<StatusBadge status={card.source} compact />} />
          </div>
        </Card>

        <div className="grid g3 mt5" style={{ gap: 10 }}>
          <Button variant="secondary" icon="eye" onClick={() => setGate(true)}>
            {t('common.view')}
          </Button>
          <Button variant="secondary" icon="share" onClick={() => setGate(true)}>
            {t('common.share')}
          </Button>
          <Button variant="secondary" icon="shield" onClick={runVerify}>
            {t('common.verify')}
          </Button>
        </div>

        <Button
          variant="outline"
          block
          icon="download"
          className="mt3"
          onClick={() => toast('Adding to the platform wallet needs a signed pass from the issuer.')}
        >
          {t('wallet.addToWallet')}
        </Button>

        <div className="mt5">
          <Disclaimer icon="shield">
            Sharing a card releases only the fields you choose, for five minutes. In production the presentation is
            signed by a key held in this device's secure element, so a verifier can confirm it without contacting Nisos.
          </Disclaimer>
        </div>
      </div>

      <BiometricGate
        open={gate}
        title={t('id.unlock')}
        reason={`Show ${card.name}`}
        onSuccess={() => {
          setGate(false);
          setShowQr(true);
        }}
        onCancel={() => setGate(false)}
      />

      <Sheet open={showQr} onClose={() => setShowQr(false)} title={card.name}>
        <div className="center">
          <div className="qr-frame">
            <DemoQr payload={`${card.id}|${card.primaryValue ?? ''}|${Date.now()}`} />
          </div>
          <p className="t-sm muted mt5" style={{ maxWidth: 280, margin: '20px auto 0' }}>
            Demo graphic — it is not a scannable code. A real presentation encodes a signed, short-lived credential.
          </p>
          <div className="row" style={{ justifyContent: 'center', marginTop: 'var(--s5)' }}>
            <StatusBadge status="demo" />
          </div>
        </div>
      </Sheet>

      <Sheet open={verify !== 'idle'} onClose={() => setVerify('idle')}>
        {verify === 'checking' ? (
          <div className="center" style={{ padding: 'var(--s7) 0' }}>
            <span className="spinner" style={{ width: 30, height: 30, margin: '0 auto', display: 'block' }} />
            <p className="t-sm muted mt4">Checking the credential…</p>
          </div>
        ) : (
          <ResultState
            tone={card.verifiable ? 'ok' : 'info'}
            title={card.verifiable ? 'Structure valid' : 'Cannot be verified yet'}
            body={
              card.verifiable
                ? 'The credential is well-formed. Cryptographic verification against the issuer is not available until the issuing authority is integrated.'
                : `${card.issuer} does not publish a verification endpoint in this prototype, so this card cannot be proven genuine.`
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
