import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { BiometricGate } from '../../components/auth';
import { Button, Card, Disclaimer, Field, ListRow, ResultState, SearchField, StatusBadge, TopBar } from '../../components/ui';
import { back, navigate, queryParams } from '../../lib/router';
import { initials, money } from '../../lib/format';
import { useApp } from '../../state/store';
import { registry } from '../../integrations/registry';
import { assertPaymentsAllowed } from '../../lib/guard';
import { shareReceipt } from '../../lib/share';
import type { Payee } from '../../integrations/types';

type Step = 'payee' | 'amount' | 'review' | 'sending' | 'success' | 'error';

export function SendMoney({ path }: { path: string }) {
  const { state, dispatch, t, intlLocale, toast } = useApp();
  const preset = queryParams(path).get('payee');

  const [step, setStep] = useState<Step>(preset ? 'amount' : 'payee');
  const [payee, setPayee] = useState<Payee | null>(state.payees.find((p) => p.id === preset) ?? null);
  const [q, setQ] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [accountId, setAccountId] = useState(state.accounts[0]?.id ?? 'acc_current');
  const [gate, setGate] = useState(false);
  const [error, setError] = useState<string>();
  const [quote, setQuote] = useState<{ fee: number; total: number; arrival: string } | null>(null);

  const numericAmount = Number(amount || 0);
  const account = state.accounts.find((a) => a.id === accountId);
  const insufficient = account ? numericAmount > (account.available ?? account.balance) : false;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.payees.filter(
      (p) => !needle || p.name.toLowerCase().includes(needle) || (p.handle ?? '').toLowerCase().includes(needle),
    );
  }, [q, state.payees]);

  const goReview = async () => {
    if (!payee || numericAmount <= 0) return;
    const kind = payee.iban ? 'sepa' : 'internal';
    try {
      setQuote(await registry.ports.payments.quote({ amount: numericAmount, payee: payee.name, kind }));
    } catch {
      setQuote({ fee: 0, total: numericAmount, arrival: 'Unknown' });
    }
    setStep('review');
  };

  const send = async () => {
    if (!payee) return;
    setGate(false);
    setStep('sending');
    try {
      assertPaymentsAllowed(state.security);
      const tx = await registry.ports.payments.execute({
        amount: numericAmount,
        payeeId: payee.id,
        payeeName: payee.name,
        kind: payee.iban ? 'sepa' : 'internal',
        reference: reference || undefined,
        accountId,
      });
      dispatch({ type: 'addTransaction', tx: { ...tx, id: `tx_local_${tx.id}` } });
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The payment could not be completed.');
      setStep('error');
    }
  };

  /* --- Step: choose payee -------------------------------------------------- */
  if (step === 'payee') {
    return (
      <>
        <TopBar title={t('action.sendMoney')} onBack={() => back()} />
        <div className="page">
          <SearchField value={q} onChange={setQ} placeholder="Name, @handle or IBAN" autoFocus />
          <div className="mt5">
            <div className="day-head">{t('pay.recipients')}</div>
            <div className="list card-list">
              {filtered.map((p) => (
                <ListRow
                  key={p.id}
                  emoji={initials(p.name)}
                  title={p.name}
                  sub={p.handle ?? p.iban}
                  end={p.favourite ? <Icon name="star" size={15} style={{ color: 'var(--accent)' }} /> : undefined}
                  onClick={() => {
                    setPayee(p);
                    setStep('amount');
                  }}
                />
              ))}
              <ListRow
                icon="plus"
                title="New recipient"
                sub="Add a name and IBAN"
                chevron
                onClick={() => {
                  const newPayee: Payee = {
                    id: `p_local_${Date.now()}`,
                    name: 'New recipient',
                    iban: 'CY•• •••• •••• •••• ••••',
                    bank: 'External bank',
                  };
                  dispatch({ type: 'addPayee', payee: newPayee });
                  setPayee(newPayee);
                  setStep('amount');
                  toast('Recipient added to your list.');
                }}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  /* --- Step: amount -------------------------------------------------------- */
  if (step === 'amount') {
    return (
      <>
        <TopBar title={payee?.name ?? t('action.sendMoney')} onBack={() => setStep('payee')} />
        <div className="page">
          <div className="amount-display">
            <div className={`val${amount ? '' : ' placeholder'}`}>{money(numericAmount, { locale: intlLocale })}</div>
            {insufficient && (
              <p className="t-sm" style={{ color: 'var(--danger-500)', marginTop: 10 }}>
                Not enough available balance in {account?.name}.
              </p>
            )}
          </div>

          <Card flat pad="sm" className="mb4">
            <div className="row-between">
              <span className="t-sm muted">{t('pay.from')}</span>
              <select
                className="t-sm"
                style={{ background: 'none', border: 0, textAlign: 'end', fontWeight: 500 }}
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {state.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {money(a.balance, { locale: intlLocale })}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          <Field label={t('pay.reference')}>
            <input
              className="input"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Dinner, rent, invoice…"
              maxLength={60}
            />
          </Field>

          <div className="keypad mt4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() =>
                  setAmount((a) => {
                    if (k === '.' && a.includes('.')) return a;
                    if (a.includes('.') && a.split('.')[1]?.length >= 2) return a;
                    return (a + k).replace(/^0(\d)/, '$1');
                  })
                }
              >
                {k}
              </button>
            ))}
            <button type="button" onClick={() => setAmount((a) => a.slice(0, -1))} aria-label="Delete">
              <Icon name="chevron-left" size={22} />
            </button>
          </div>

          <Button block className="mt5" disabled={numericAmount <= 0 || insufficient} onClick={goReview}>
            {t('pay.review')}
          </Button>
        </div>
      </>
    );
  }

  /* --- Step: review -------------------------------------------------------- */
  if (step === 'review') {
    return (
      <>
        <TopBar title={t('pay.review')} onBack={() => setStep('amount')} />
        <div className="page">
          <Card className="center" style={{ paddingBlock: 'var(--s6)' }}>
            <span className="avatar-ico round accent" style={{ margin: '0 auto', width: 54, height: 54, fontSize: 18 }}>
              {initials(payee?.name ?? '')}
            </span>
            <h2 className="num mt4" style={{ font: '600 32px/1.1 var(--font)' }}>
              {money(numericAmount, { locale: intlLocale })}
            </h2>
            <p className="t-sm muted mt2">to {payee?.name}</p>
          </Card>

          <div className="list card-list mt4">
            <ListRow icon="money" title={t('pay.from')} end={account?.name} endSub={money(account?.balance ?? 0, { locale: intlLocale })} />
            <ListRow icon="database" title="To" end={payee?.handle ?? payee?.iban} />
            {reference && <ListRow icon="receipt" title={t('pay.reference')} end={reference} />}
            <ListRow icon="swap" title={t('pay.fee')} end={money(quote?.fee ?? 0, { locale: intlLocale })} />
            <ListRow icon="clock" title={t('pay.arrival')} end={quote?.arrival ?? '—'} />
            <ListRow
              icon="link"
              title="Rail"
              end={<StatusBadge status={registry.descriptorFor('payments').status} compact />}
              endSub={payee?.iban ? 'SEPA (recorded, not delivered externally)' : 'Internal'}
            />
          </div>

          {state.security.accountFrozen ? (
            <Disclaimer icon="alert">
              Your account is frozen, so this payment can't be sent. Unfreeze it in{' '}
              <a href="#/security" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                Security
              </a>{' '}
              first.
            </Disclaimer>
          ) : (
            <Button block className="mt5" icon="lock" onClick={() => setGate(true)}>
              {t('pay.confirmBiometric')}
            </Button>
          )}
          <Button variant="quiet" block className="mt2" onClick={() => setStep('amount')}>
            {t('common.cancel')}
          </Button>

          <div className="mt5">
            <Disclaimer icon="shield">
              {registry.descriptorFor('payments').status === 'official-api'
                ? 'Every payment is confirmed with biometrics or PIN. This really deducts your balance and is recorded by the Nisos backend — it is not a licensed SEPA transfer to an external bank.'
                : 'Every payment is confirmed with biometrics or PIN. Nothing leaves the demo ledger — no real transfer is made.'}
            </Disclaimer>
          </div>
        </div>

        <BiometricGate
          open={gate}
          title={t('pay.confirmBiometric')}
          reason={`Send ${money(numericAmount, { locale: intlLocale })} to ${payee?.name}`}
          onSuccess={send}
          onCancel={() => setGate(false)}
        />
      </>
    );
  }

  /* --- Step: sending / result --------------------------------------------- */
  return (
    <>
      <TopBar title={t('pay.title')} onBack={step === 'sending' ? undefined : () => navigate('/money')} />
      <div className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: '70vh' }}>
        {step === 'sending' && (
          <div className="result-state">
            <span className="spinner" style={{ width: 34, height: 34 }} />
            <p className="t-sm muted mt5">Sending {money(numericAmount, { locale: intlLocale })}…</p>
          </div>
        )}

        {step === 'success' && (
          <ResultState
            title={t('pay.success')}
            body={
              registry.descriptorFor('payments').status === 'official-api' ? (
                <>
                  {money(numericAmount, { locale: intlLocale })} to {payee?.name}. Deducted from your real balance and
                  recorded by the Nisos backend.
                </>
              ) : (
                <>
                  {money(numericAmount, { locale: intlLocale })} to {payee?.name}. Recorded in the demo ledger only.
                </>
              )
            }
          >
            <div className="row" style={{ justifyContent: 'center', marginTop: 'var(--s4)' }}>
              <StatusBadge status={registry.descriptorFor('payments').status} />
            </div>
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
                    amount: money(numericAmount, { locale: intlLocale }),
                    counterparty: payee?.name ?? '',
                    reference: reference || undefined,
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

        {step === 'error' && (
          <ResultState tone="err" title={t('pay.failed')} body={error}>
            <div className="grid" style={{ width: '100%', marginTop: 'var(--s6)', gap: 10 }}>
              <Button block icon="refresh" onClick={() => setStep('review')}>
                {t('common.retry')}
              </Button>
              <Button variant="secondary" block onClick={() => navigate('/money')}>
                {t('common.cancel')}
              </Button>
            </div>
          </ResultState>
        )}
      </div>
    </>
  );
}
