import React, { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';
import { BiometricGate } from '../../components/auth';
import { Badge, Button, Card, Disclaimer, ListRow, ResultState, Sheet, StatusBadge } from '../../components/ui';
import { back, navigate } from '../../lib/router';
import { money } from '../../lib/format';
import { useApp } from '../../state/store';
import { registry } from '../../integrations/registry';
import { assertPaymentsAllowed } from '../../lib/guard';
import { shareReceipt } from '../../lib/share';

type Phase = 'scanning' | 'resolved' | 'confirming' | 'success' | 'error';

interface Merchant {
  merchant: string;
  merchantId: string;
  amount?: number;
  reference?: string;
}

export function ScanPay() {
  const { state, dispatch, t, intlLocale, toast } = useApp();
  const [phase, setPhase] = useState<Phase>('scanning');
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [gate, setGate] = useState(false);
  const [error, setError] = useState<string>();
  const accountId = state.accounts[0]?.id ?? 'acc_current';

  // The prototype has no camera access; a scan is simulated after a moment so
  // the full flow (resolve → confirm → authenticate → result) can be reviewed.
  useEffect(() => {
    if (phase !== 'scanning') return;
    const id = window.setTimeout(async () => {
      try {
        const resolved = await registry.ports.payments.resolveQr(`demo-payload-${Date.now() % 7}`);
        setMerchant(resolved);
        setPhase('resolved');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not read the code.');
        setPhase('error');
      }
    }, 2400);
    return () => window.clearTimeout(id);
  }, [phase]);

  const pay = async () => {
    if (!merchant) return;
    setGate(false);
    setPhase('confirming');
    try {
      assertPaymentsAllowed(state.security, 'card');
      const tx = await registry.ports.payments.execute({
        amount: merchant.amount ?? 0,
        payeeName: merchant.merchant,
        kind: 'qr',
        reference: merchant.merchantId,
        accountId,
      });
      dispatch({ type: 'addTransaction', tx: { ...tx, id: `tx_local_${tx.id}`, category: 'shopping' } });
      setPhase('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed.');
      setPhase('error');
    }
  };

  return (
    <div className="app-frame" style={{ position: 'absolute', inset: 0, zIndex: 20, background: '#06121A' }}>
      <div className="topbar" style={{ background: 'transparent', color: '#fff' }}>
        <div className="side">
          <button className="iconbtn ghost" style={{ color: '#fff' }} onClick={() => back()} aria-label={t('common.close')} type="button">
            <Icon name="x" />
          </button>
        </div>
        <h1 style={{ color: '#fff' }}>{t('pay.scanTitle')}</h1>
        <div className="side end" />
      </div>

      <div className="scanner">
        <div className="viewfinder">
          <i />
          <i />
          <i />
          <i />
          {phase === 'scanning' && <span className="laser" />}
        </div>
        <div style={{ position: 'absolute', bottom: 48, insetInline: 0, textAlign: 'center', color: '#fff' }}>
          <p className="t-sm" style={{ opacity: 0.85 }}>
            {phase === 'scanning' ? t('pay.scanHint') : 'Code recognised'}
          </p>
          <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
            <Badge tone="demo" dot>
              Simulated camera
            </Badge>
          </div>
        </div>
      </div>

      {/* Hidden while the biometric gate is up, so only one sheet is ever open. */}
      <Sheet open={phase === 'resolved' && !gate} onClose={() => back()} title={t('pay.merchant')}>
        {merchant && (
          <>
            <div className="center" style={{ paddingBottom: 'var(--s5)' }}>
              <span className="avatar-ico round sea" style={{ width: 54, height: 54, margin: '0 auto' }}>
                <Icon name="bag" size={22} />
              </span>
              <h2 className="t-h2 mt4">{merchant.merchant}</h2>
              <p className="t-sm muted mt1">{merchant.merchantId}</p>
              <div className="num" style={{ font: '600 34px/1.1 var(--font)', marginTop: 'var(--s5)' }}>
                {money(merchant.amount ?? 0, { locale: intlLocale })}
              </div>
              <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
                <StatusBadge status="demo" />
              </div>
            </div>

            <div className="list card-list mb4">
              <ListRow icon="money" title={t('pay.from')} end={state.accounts[0]?.name} />
              <ListRow icon="clock" title={t('pay.arrival')} end="Instant" />
              <ListRow icon="shield" title="Merchant checks" end="Not performed" endSub="Needs an acquirer" />
            </div>

            {state.security.accountFrozen || state.security.cardFrozen ? (
              <Disclaimer icon="alert">
                {state.security.accountFrozen ? 'Your account' : 'Your card'} is frozen, so this payment can't go
                through. Unfreeze it in Security first.
              </Disclaimer>
            ) : (
              <Button block icon="lock" onClick={() => setGate(true)}>
                {t('common.pay')} {money(merchant.amount ?? 0, { locale: intlLocale })}
              </Button>
            )}
            <Button variant="quiet" block className="mt2" onClick={() => back()}>
              {t('common.cancel')}
            </Button>

            <div className="mt4">
              <Disclaimer>
                A real QR payment resolves the merchant with the acquiring bank before anything is shown here, and the
                amount is signed by the merchant terminal.
              </Disclaimer>
            </div>
          </>
        )}
      </Sheet>

      <BiometricGate
        open={gate}
        title={t('pay.confirmBiometric')}
        reason={merchant ? `Pay ${money(merchant.amount ?? 0, { locale: intlLocale })} to ${merchant.merchant}` : undefined}
        onSuccess={pay}
        onCancel={() => setGate(false)}
      />

      <Sheet open={phase === 'confirming' || phase === 'success' || phase === 'error'} onClose={() => back()}>
        {phase === 'confirming' && (
          <div className="center" style={{ padding: 'var(--s7) 0' }}>
            <span className="spinner" style={{ width: 30, height: 30, margin: '0 auto', display: 'block' }} />
            <p className="t-sm muted mt4">Completing payment…</p>
          </div>
        )}
        {phase === 'success' && merchant && (
          <ResultState
            title={t('pay.success')}
            body={`${money(merchant.amount ?? 0, { locale: intlLocale })} to ${merchant.merchant}. Demo ledger entry — no money moved.`}
          >
            <div className="grid" style={{ width: '100%', marginTop: 'var(--s6)', gap: 10 }}>
              <Button block onClick={() => navigate('/money')}>
                {t('common.done')}
              </Button>
              <Button
                variant="secondary"
                block
                icon="share"
                onClick={async () => {
                  const outcome = await shareReceipt({
                    title: t('pay.success'),
                    amount: money(merchant.amount ?? 0, { locale: intlLocale }),
                    counterparty: merchant.merchant,
                    reference: merchant.merchantId,
                    date: new Date().toLocaleString(intlLocale),
                    status: 'Demo — settled',
                  });
                  if (outcome === 'copied') toast('Receipt copied to clipboard.');
                  else if (outcome === 'unavailable') toast('Sharing is not available in this browser.', 'error');
                }}
              >
                Share receipt
              </Button>
              <Button variant="quiet" block onClick={() => setPhase('scanning')}>
                Scan another
              </Button>
            </div>
          </ResultState>
        )}
        {phase === 'error' && (
          <ResultState tone="err" title={t('pay.failed')} body={error}>
            <div className="grid" style={{ width: '100%', marginTop: 'var(--s6)', gap: 10 }}>
              <Button block icon="refresh" onClick={() => setPhase('scanning')}>
                {t('common.retry')}
              </Button>
              <Button variant="secondary" block onClick={() => back()}>
                {t('common.close')}
              </Button>
            </div>
          </ResultState>
        )}
      </Sheet>
    </div>
  );
}
