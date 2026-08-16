import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { BiometricGate } from '../../components/auth';
import { Badge, Button, Card, Disclaimer, EmptyState, ListRow, ResultState, SectionHead, Sheet, StatusBadge, Switch, TopBar } from '../../components/ui';
import { navigate } from '../../lib/router';
import { daysUntil, money, relativeDay } from '../../lib/format';
import { useApp } from '../../state/store';
import { registry } from '../../integrations/registry';
import { assertPaymentsAllowed } from '../../lib/guard';
import { shareReceipt } from '../../lib/share';
import type { Bill } from '../../integrations/types';

export function Bills() {
  const { state, dispatch, t, intlLocale, toast } = useApp();
  const [selected, setSelected] = useState<Bill | null>(null);
  const [gate, setGate] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'paying' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string>();

  const open = state.bills.filter((b) => b.status !== 'paid').sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate));
  const paid = state.bills.filter((b) => b.status === 'paid');

  const pay = async () => {
    if (!selected) return;
    setGate(false);
    setPhase('paying');
    try {
      assertPaymentsAllowed(state.security);
      const tx = await registry.ports.payments.execute({
        amount: selected.amount,
        payeeName: selected.issuer,
        kind: 'bill',
        reference: selected.name,
        accountId: state.accounts[0]?.id ?? 'acc_current',
      });
      dispatch({ type: 'addTransaction', tx: { ...tx, id: `tx_local_${tx.id}`, category: selected.category } });
      dispatch({ type: 'payBill', id: selected.id });
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setPhase('error');
    }
  };

  const statusTone = (b: Bill) =>
    b.status === 'overdue' ? 'danger' : b.status === 'scheduled' ? 'info' : daysUntil(b.dueDate) < 7 ? 'warn' : 'default';

  return (
    <>
      <TopBar title={t('money.bills')} onBack />
      <div className="page">
        <SectionHead title="Due and scheduled" />
        {open.length === 0 ? (
          <EmptyState icon="check-circle" title="Nothing to pay" body="All your bills are settled." />
        ) : (
          <div className="list card-list">
            {open.map((b) => {
              const days = daysUntil(b.dueDate);
              return (
                <ListRow
                  key={b.id}
                  icon={b.category === 'government' ? 'gov' : 'receipt'}
                  iconTone={statusTone(b) as 'danger' | 'info' | 'warn' | 'default'}
                  title={b.name}
                  sub={
                    <span className="row" style={{ gap: 6 }}>
                      {b.status === 'overdue' ? `Overdue by ${Math.abs(days)} days` : `${t('common.due')} ${relativeDay(b.dueDate, intlLocale)}`}
                      <StatusBadge status={b.source} compact />
                    </span>
                  }
                  end={money(b.amount, { locale: intlLocale })}
                  endSub={b.autopay ? 'Autopay on' : undefined}
                  onClick={() => {
                    setSelected(b);
                    setPhase('idle');
                  }}
                />
              );
            })}
          </div>
        )}

        <SectionHead title={t('money.scheduled')} />
        <Card>
          <div className="row-between">
            <div>
              <div style={{ font: '500 15px/1.2 var(--font)' }}>Autopay for utilities</div>
              <div className="t-sm muted mt1">Pays each bill 2 days before the due date</div>
            </div>
            <Switch checked label="Autopay" onChange={() => toast('Autopay settings are simulated in this prototype.')} />
          </div>
        </Card>

        {paid.length > 0 && (
          <>
            <SectionHead title="Paid" />
            <div className="list card-list">
              {paid.map((b) => (
                <ListRow
                  key={b.id}
                  icon="check-circle"
                  iconTone="ok"
                  title={b.name}
                  sub={`${b.issuer} · paid`}
                  end={money(b.amount, { locale: intlLocale })}
                />
              ))}
            </div>
          </>
        )}

        <div className="mt5">
          <Disclaimer>
            Government charges shown here are statutory fees that go to the department. Nisos does not add a fee to any
            government service, and no payment in this prototype moves real money.
          </Disclaimer>
        </div>
      </div>

      {/* Bill detail / pay ------------------------------------------------- */}
      {/* Hidden while the biometric gate is up, so only one sheet is ever open. */}
      <Sheet open={!!selected && phase === 'idle' && !gate} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <>
            <div className="center" style={{ padding: 'var(--s3) 0 var(--s5)' }}>
              <div className="num" style={{ font: '600 34px/1.1 var(--font)' }}>
                {money(selected.amount, { locale: intlLocale })}
              </div>
              <p className="t-sm muted mt2">{selected.issuer}</p>
              <div className="row" style={{ justifyContent: 'center', marginTop: 10, gap: 8 }}>
                <Badge tone={selected.status === 'overdue' ? 'danger' : 'warn'}>
                  {t('common.due')} {relativeDay(selected.dueDate, intlLocale)}
                </Badge>
                <StatusBadge status={selected.source} />
              </div>
            </div>
            <div className="list card-list mb4">
              <ListRow icon="money" title={t('pay.from')} end={state.accounts[0]?.name ?? '—'} />
              <ListRow icon="receipt" title="Reference" end={selected.id.toUpperCase()} />
              <ListRow icon="clock" title={t('pay.arrival')} end="Instant (demo)" />
            </div>
            {selected.serviceId && (
              <Button variant="secondary" block className="mb3" onClick={() => navigate(`/gov/service/${selected.serviceId}`)}>
                View government service
              </Button>
            )}
            {state.security.accountFrozen ? (
              <Disclaimer icon="alert">
                Your account is frozen, so bills can't be paid right now. Unfreeze it in Security first.
              </Disclaimer>
            ) : (
              <Button block icon="lock" onClick={() => setGate(true)}>
                {t('common.pay')} {money(selected.amount, { locale: intlLocale })}
              </Button>
            )}
          </>
        )}
      </Sheet>

      <BiometricGate
        open={gate}
        title={t('pay.confirmBiometric')}
        reason={selected ? `Pay ${money(selected.amount, { locale: intlLocale })} to ${selected.issuer}` : undefined}
        onSuccess={pay}
        onCancel={() => setGate(false)}
      />

      {/* Paying / result --------------------------------------------------- */}
      <Sheet open={phase !== 'idle'} onClose={() => { setPhase('idle'); setSelected(null); }}>
        {phase === 'paying' && (
          <div className="center" style={{ padding: 'var(--s7) 0' }}>
            <span className="spinner" style={{ width: 30, height: 30, margin: '0 auto', display: 'block' }} />
            <p className="t-sm muted mt4">Sending payment…</p>
          </div>
        )}
        {phase === 'done' && selected && (
          <ResultState
            title={t('pay.success')}
            body={`${money(selected.amount, { locale: intlLocale })} to ${selected.issuer}. This is a demo ledger entry — no money moved.`}
          >
            <div className="grid" style={{ width: '100%', marginTop: 'var(--s6)', gap: 10 }}>
              <Button block onClick={() => { setPhase('idle'); setSelected(null); }}>
                {t('common.done')}
              </Button>
              <Button
                variant="secondary"
                block
                icon="share"
                onClick={async () => {
                  const outcome = await shareReceipt({
                    title: t('pay.success'),
                    amount: money(selected.amount, { locale: intlLocale }),
                    counterparty: selected.issuer,
                    reference: selected.id.toUpperCase(),
                    date: new Date().toLocaleString(intlLocale),
                    status: 'Demo — settled',
                  });
                  if (outcome === 'copied') toast('Receipt copied to clipboard.');
                  else if (outcome === 'unavailable') toast('Sharing is not available in this browser.', 'error');
                }}
              >
                Share receipt
              </Button>
            </div>
          </ResultState>
        )}
        {phase === 'error' && (
          <ResultState tone="err" title={t('pay.failed')} body={error}>
            <div className="grid" style={{ width: '100%', marginTop: 'var(--s6)', gap: 10 }}>
              <Button block icon="refresh" onClick={() => setGate(true)}>
                {t('common.retry')}
              </Button>
              <Button variant="secondary" block onClick={() => { setPhase('idle'); setSelected(null); }}>
                {t('common.cancel')}
              </Button>
            </div>
          </ResultState>
        )}
      </Sheet>
    </>
  );
}
