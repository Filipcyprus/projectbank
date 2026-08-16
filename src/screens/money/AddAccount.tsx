import React, { useState } from 'react';
import { Button, Card, Disclaimer, Field, SectionHead, TopBar } from '../../components/ui';
import { back, navigate } from '../../lib/router';
import { useApp } from '../../state/store';
import { createNisosAccount } from '../../integrations/adapters/nisosLiveBankingAdapter';

const TYPES: { id: 'current' | 'savings' | 'card' | 'investment' | 'business'; label: string }[] = [
  { id: 'current', label: 'Current' },
  { id: 'savings', label: 'Savings' },
  { id: 'business', label: 'Business' },
  { id: 'investment', label: 'Investment' },
  { id: 'card', label: 'Card' },
];

/**
 * Adds a real account to the citizen's own Nisos backend ledger, with a
 * name and starting balance they choose. This is genuinely persisted
 * server-side - it's just not a fetch from a licensed bank, which is why
 * it's a form instead of a "Connect" button (see ConnectBank.tsx).
 */
export function AddAccount() {
  const { t, refresh, toast } = useApp();
  const [name, setName] = useState('');
  const [type, setType] = useState<(typeof TYPES)[number]['id']>('current');
  const [balance, setBalance] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const numericBalance = Number(balance || 0);
  const canSave = name.trim().length > 0 && balance !== '' && numericBalance >= 0 && !saving;

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await createNisosAccount({ name: name.trim(), type, balance: numericBalance });
      await refresh('banking');
      toast(`${name.trim()} added to your accounts.`);
      navigate('/money');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TopBar title="Add your own account" onBack={() => back()} />
      <div className="page">
        <SectionHead title="Details" />
        <Card pad="sm">
          <Field label="Account name">
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rent savings"
              maxLength={40}
              autoFocus
            />
          </Field>

          <div className="mt4">
            <Field label="Type">
              <div className="row wrap" style={{ gap: 8 }}>
                {TYPES.map((tOpt) => (
                  <button
                    key={tOpt.id}
                    type="button"
                    className="chip"
                    aria-pressed={type === tOpt.id}
                    onClick={() => setType(tOpt.id)}
                  >
                    {tOpt.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div className="mt4">
            <Field label="Starting balance (EUR)" hint="Whatever you want to test with.">
              <input
                className="input"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
              />
            </Field>
          </div>
        </Card>

        {error && (
          <p className="t-sm" style={{ color: 'var(--danger-500)', marginTop: 'var(--s3)' }}>
            {error}
          </p>
        )}

        <Button block className="mt5" loading={saving} disabled={!canSave} onClick={save}>
          Add account
        </Button>

        <div className="mt5">
          <Disclaimer icon="shield">
            This is really saved on the Nisos backend and behaves like any other account here - you can send money
            from it and it will show real transactions. It is not a connection to an actual bank; the balance is
            whatever you enter.
          </Disclaimer>
        </div>
      </div>
    </>
  );
}
