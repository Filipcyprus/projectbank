import React, { useState } from 'react';
import { DemoQr } from '../../components/auth';
import { Button, Card, Disclaimer, Field, ListRow, SectionHead, StatusBadge, TopBar } from '../../components/ui';
import { initials, money } from '../../lib/format';
import { useApp } from '../../state/store';
import { shareReceipt } from '../../lib/share';

export function RequestMoney() {
  const { state, t, intlLocale, toast } = useApp();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const value = Number(amount || 0);
  const handle = `@${state.user.name.split(' ')[0].toLowerCase()}`;

  return (
    <>
      <TopBar title={t('action.request')} onBack />
      <div className="page">
        <Card className="center" style={{ paddingBlock: 'var(--s6)' }}>
          <div className="qr-frame" style={{ width: 180, height: 180 }}>
            <DemoQr payload={`nisos-request:${handle}:${value}`} />
          </div>
          <p className="t-h3 mt5">{state.user.name}</p>
          <p className="t-sm muted mt1">{handle}</p>
          <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
            <StatusBadge status="demo" />
          </div>
        </Card>

        <div className="mt5">
          <Field label={`${t('pay.amount')} (optional)`}>
            <input
              className="input"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            />
          </Field>
          <Field label="Note">
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Dinner split" />
          </Field>
        </div>

        <Button
          block
          icon="share"
          onClick={async () => {
            const outcome = await shareReceipt({
              title: 'Payment request',
              amount: value > 0 ? money(value, { locale: intlLocale }) : 'Any amount',
              counterparty: `${state.user.name} (${handle})`,
              reference: note || undefined,
              date: new Date().toLocaleString(intlLocale),
              status: 'Demo — awaiting payment',
            });
            if (outcome === 'copied') toast('Request copied to clipboard.');
            else if (outcome === 'unavailable') toast('Sharing is not available in this browser.', 'error');
          }}
        >
          Share request {value > 0 ? `· ${money(value, { locale: intlLocale })}` : ''}
        </Button>

        <SectionHead title="Request from a contact" />
        <div className="list card-list">
          {state.payees.slice(0, 4).map((p) => (
            <ListRow
              key={p.id}
              emoji={initials(p.name)}
              title={p.name}
              sub={p.handle ?? p.bank}
              end={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    const outcome = await shareReceipt({
                      title: 'Payment request',
                      amount: value > 0 ? money(value, { locale: intlLocale }) : 'Any amount',
                      counterparty: `${p.name} — from ${state.user.name}`,
                      reference: note || undefined,
                      date: new Date().toLocaleString(intlLocale),
                      status: 'Demo — awaiting payment',
                    });
                    if (outcome === 'shared' || outcome === 'copied') toast(`Request ready to send to ${p.name}.`);
                    else if (outcome === 'unavailable') toast('Sharing is not available in this browser.', 'error');
                  }}
                >
                  {t('common.request')}
                </Button>
              }
            />
          ))}
        </div>

        <div className="mt5">
          <Disclaimer>
            Requests are simulated. A production build sends a signed payment request that the payer approves in their
            own banking app.
          </Disclaimer>
        </div>
      </div>
    </>
  );
}
