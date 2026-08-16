import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Button, Card, Disclaimer, ListRow, ResultState, SectionHead, Sheet, TopBar } from '../../components/ui';
import { institutions } from '../../data/seed';
import { registry } from '../../integrations/registry';
import { useApp } from '../../state/store';

/**
 * Account connection is the clearest place where honesty matters: nothing is
 * connected, so pressing Connect calls the real port and surfaces the real
 * reason it cannot proceed instead of faking a success screen.
 */
export function ConnectBank() {
  const { t, dispatch } = useApp();
  const [state, setState] = useState<'idle' | 'connecting' | 'blocked'>('idle');
  const [reason, setReason] = useState<string>();

  const connect = async (institutionId: string) => {
    setState('connecting');
    const bank = institutions.find((i) => i.id === institutionId);
    try {
      const { authorizationUrl } = await registry.ports.banking.beginConsent(institutionId);
      window.location.href = authorizationUrl;
    } catch (err) {
      setReason(err instanceof Error ? err.message : 'Connection unavailable.');
      setState('blocked');
      dispatch({
        type: 'addDataAccessEvent',
        event: {
          id: `access_${Date.now()}`,
          at: new Date().toISOString(),
          category: 'banking',
          actor: bank?.name ?? institutionId,
          action: 'Attempted an open banking consent',
          detail: err instanceof Error ? err.message : 'Connection unavailable.',
        },
      });
    }
  };

  const banks = institutions.filter((i) => i.type === 'bank');

  return (
    <>
      <TopBar title={t('money.connectBank')} onBack />
      <div className="page">
        <Card className="mb4">
          <div className="row" style={{ gap: 'var(--s4)', alignItems: 'flex-start' }}>
            <span className="avatar-ico sea">
              <Icon name="shield" size={20} />
            </span>
            <div>
              <h2 className="t-h3">How connection works</h2>
              <p className="t-sm muted mt2">{t('money.connectBankHint')}</p>
            </div>
          </div>
          <ol className="timeline mt5">
            <li className="node done">
              <div style={{ font: '500 14px/1.3 var(--font)' }}>You choose your bank</div>
              <div className="t-sm muted mt1">Nisos never sees your credentials.</div>
            </li>
            <li className="node done">
              <div style={{ font: '500 14px/1.3 var(--font)' }}>You approve on your bank's own app</div>
              <div className="t-sm muted mt1">Strong customer authentication happens there, under PSD2.</div>
            </li>
            <li className="node active">
              <div style={{ font: '500 14px/1.3 var(--font)' }}>Your bank returns a scoped token</div>
              <div className="t-sm muted mt1">Read-only access to balances and transactions, revocable at any time.</div>
            </li>
            <li className="node">
              <div style={{ font: '500 14px/1.3 var(--font)' }}>Consent expires after 90 days</div>
              <div className="t-sm muted mt1">You are asked to renew it, as the regulation requires.</div>
            </li>
          </ol>
        </Card>

        <SectionHead title="Available connections" />
        <div className="list card-list">
          {banks.map((b) => (
            <ListRow
              key={b.id}
              icon="database"
              title={b.name}
              sub={b.note}
              end={<Badge tone="warn">{t('status.coming-soon')}</Badge>}
              onClick={() => connect(b.id)}
            />
          ))}
        </div>

        <div className="mt5">
          <Disclaimer icon="lock">
            Nisos will never ask for your online banking password. Account access is only ever granted by your bank
            through a regulated open-banking flow, and can be withdrawn from Profile → Connected banks.
          </Disclaimer>
        </div>
      </div>

      <Sheet open={state !== 'idle'} onClose={() => setState('idle')}>
        {state === 'connecting' && (
          <div className="center" style={{ padding: 'var(--s7) 0' }}>
            <span className="spinner" style={{ width: 30, height: 30, margin: '0 auto', display: 'block' }} />
            <p className="t-sm muted mt4">Contacting the provider…</p>
          </div>
        )}
        {state === 'blocked' && (
          <ResultState tone="info" title="Not connected yet" body={reason}>
            <div className="grid" style={{ width: '100%', marginTop: 'var(--s6)', gap: 10 }}>
              <Button block onClick={() => setState('idle')}>
                {t('common.done')}
              </Button>
            </div>
            <p className="t-sm subtle" style={{ marginTop: 'var(--s5)', maxWidth: 300 }}>
              This screen deliberately shows the real failure instead of a simulated success: the prototype does not
              pretend to hold a banking licence.
            </p>
          </ResultState>
        )}
      </Sheet>
    </>
  );
}
