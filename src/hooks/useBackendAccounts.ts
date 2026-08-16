import { useEffect, useState } from 'react';
import type { Account, Transaction } from '../integrations/types';

export function useBackendAccounts(sessionId: string | null) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch('http://localhost:3001/api/banking/accounts', {
          headers: { Authorization: `Bearer ${sessionId}` },
        });
        if (res.ok) {
          const { accounts: data } = await res.json();
          setAccounts(data);
        }
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  return { accounts, loading };
}

export function useBackendTransactions(accountId: string, sessionId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!sessionId || !accountId) return;

    (async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/api/banking/accounts/${accountId}/transactions`,
          { headers: { Authorization: `Bearer ${sessionId}` } }
        );
        if (res.ok) {
          const { transactions: data } = await res.json();
          setTransactions(data);
        }
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      }
    })();
  }, [accountId, sessionId]);

  return { transactions };
}
