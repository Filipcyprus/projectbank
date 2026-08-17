import React, { useEffect, useState } from 'react';
import { TopBar, ResultState, Button } from '../../components/ui';
import { navigate } from '../../lib/router';
import { useApp } from '../../state/store';
import { syncSaltEdgeBank } from '../../integrations/adapters/nisosLiveBankingAdapter';

/**
 * Salt Edge redirects here after the citizen finishes (or cancels) the
 * hosted connect widget. Pulls whatever connections now exist into the
 * Nisos ledger, then sends the citizen back to Money.
 */
export function BankCallback() {
  const { refresh, toast } = useApp();
  const [status, setStatus] = useState<'syncing' | 'done' | 'error'>('syncing');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { synced } = await syncSaltEdgeBank();
        if (cancelled) return;
        await refresh('banking');
        if (synced > 0) {
          toast(`Connected - ${synced} account${synced === 1 ? '' : 's'} added.`);
        } else {
          toast('No new accounts were connected.');
        }
        setStatus('done');
        navigate('/money');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not finish connecting your bank.');
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <TopBar title="Connecting" />
      <div className="page">
        {status === 'syncing' && (
          <div className="center" style={{ padding: 'var(--s7) 0' }}>
            <span className="spinner" style={{ width: 30, height: 30, margin: '0 auto', display: 'block' }} />
            <p className="t-sm muted mt4">Finishing your bank connection…</p>
          </div>
        )}
        {status === 'error' && (
          <ResultState tone="err" title="Could not finish connecting" body={error}>
            <Button block className="mt5" onClick={() => navigate('/money')}>
              Back to Money
            </Button>
          </ResultState>
        )}
      </div>
    </>
  );
}
