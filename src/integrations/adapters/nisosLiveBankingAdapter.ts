/* ---------------------------------------------------------------------------
 * Nisos live banking adapter.
 *
 * Talks to the real Nisos backend (server/index.js) instead of demo data.
 * This is what a citizen actually sees once they log in: real accounts,
 * real balances, real transaction history — all served from a real server,
 * not invented in the browser. It is still not a licensed PSD2 connection to
 * an external bank (see docs/INTEGRATIONS.md); "Nisos backend" is its own
 * institution in this build, the way a neobank's own ledger would be.
 * ------------------------------------------------------------------------- */

import type { Account, BankingPort, ProviderDescriptor, Transaction } from '../types';
import { IntegrationError } from '../types';

function getApiBase(): string {
  const url = (import.meta.env.VITE_API_URL as string) || 'https://projectbank-production.up.railway.app';
  return `${url}/api`;
}

function getSessionId(): string | null {
  return localStorage.getItem('nisos_session_id');
}

async function authedFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const sessionId = getSessionId();
  if (!sessionId) {
    throw new IntegrationError('Not signed in', 'auth_expired', false);
  }

  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionId}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) throw new IntegrationError('Session expired', 'auth_expired', false);
    if (res.status === 403) {
      const body = await res.json().catch(() => ({}));
      throw new IntegrationError(body.error || 'This action is not allowed.', 'rejected', false);
    }
    if (res.status === 400 || res.status === 503) {
      const body = await res.json().catch(() => ({}));
      if (body.error) throw new IntegrationError(body.error, res.status === 503 ? 'consent_revoked' : 'rejected', false);
    }
    throw new IntegrationError('Nisos backend unavailable', 'upstream_unavailable', true);
  }

  return res.json();
}

const descriptor: ProviderDescriptor = {
  id: 'banking.nisos-backend',
  kind: 'banking',
  name: 'Nisos accounts',
  operator: 'Nisos backend',
  status: 'official-api',
  auth: { type: 'gateway-mtls', gatewayUrl: 'runtime-configured' },
  capabilities: ['accounts.read', 'transactions.read', 'transfer.internal'],
  note: 'Real accounts and transactions served by the Nisos backend - configured at runtime via VITE_API_URL.',
};

interface BackendAccount {
  id: string;
  type: string;
  name: string;
  bank: string;
  iban: string;
  balance: number;
  currency: string;
  status: string;
  mandatory?: boolean;
  createdAt: string;
}

interface BackendTransaction {
  id: string;
  accountId: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  date: string;
  category: string;
  status: string;
}

function mapAccountType(type: string): Account['type'] {
  if (type === 'current' || type === 'savings' || type === 'card' || type === 'investment') return type;
  if (type === 'business') return 'current';
  return 'current';
}

function mapAccount(a: BackendAccount): Account {
  return {
    id: a.id,
    type: mapAccountType(a.type),
    name: a.name,
    institution: a.bank,
    institutionId: 'nisos-backend',
    iban: a.iban,
    balance: a.balance,
    available: a.balance,
    currency: 'EUR',
    source: 'official-api',
    connectedAt: a.createdAt,
    mandatory: !!a.mandatory,
  };
}

const CATEGORY_MAP: Record<string, Transaction['category']> = {
  groceries: 'groceries',
  salary: 'income',
  utilities: 'utilities',
  transfer: 'transfer',
  dining: 'dining',
  transport: 'transport',
  government: 'government',
  health: 'health',
  shopping: 'shopping',
  entertainment: 'entertainment',
  housing: 'housing',
};

function mapTransaction(t: BackendTransaction): Transaction {
  return {
    id: t.id,
    accountId: t.accountId,
    merchant: t.description,
    amount: t.type === 'debit' ? -Math.abs(t.amount) : Math.abs(t.amount),
    currency: 'EUR',
    date: t.date,
    category: CATEGORY_MAP[t.category] ?? 'other',
    status: t.status === 'completed' ? 'settled' : 'pending',
    source: 'official-api',
  };
}

export const nisosLiveBankingAdapter: BankingPort = {
  descriptor,

  async listAccounts(): Promise<Account[]> {
    const { accounts } = await authedFetch<{ accounts: BackendAccount[] }>('/banking/accounts');
    return accounts.map(mapAccount);
  },

  async listTransactions(accountId?: string): Promise<Transaction[]> {
    if (accountId) {
      const { transactions } = await authedFetch<{ transactions: BackendTransaction[] }>(
        `/banking/accounts/${accountId}/transactions`,
      );
      return transactions.map(mapTransaction);
    }
    // No accountId: aggregate across all of the citizen's accounts.
    const { accounts } = await authedFetch<{ accounts: BackendAccount[] }>('/banking/accounts');
    const all = await Promise.all(
      accounts.map((a) =>
        authedFetch<{ transactions: BackendTransaction[] }>(`/banking/accounts/${a.id}/transactions`),
      ),
    );
    return all.flatMap((r) => r.transactions).map(mapTransaction);
  },

  async beginConsent() {
    // Real Salt Edge integration (see docs/INTEGRATIONS.md): the citizen
    // picks their own bank on Salt Edge's hosted page - Nisos never sees
    // banking credentials. Returns a real 503 if the server has no Salt
    // Edge keys configured, rather than pretending this always works.
    const returnTo = `${window.location.origin}/#/money/bank-callback`;
    const { connectUrl } = await authedFetch<{ connectUrl: string }>('/banking/connect-bank', {
      method: 'POST',
      body: JSON.stringify({ returnTo }),
    });
    return { authorizationUrl: connectUrl, state: '' };
  },
};

/**
 * Called on return from the Salt Edge hosted connect flow. Pulls whatever
 * accounts/transactions Salt Edge now has for this citizen's connections
 * into the Nisos backend's own ledger so the rest of the app (which only
 * knows how to read Nisos accounts) picks them up unchanged.
 */
export async function syncSaltEdgeBank(): Promise<{ synced: number }> {
  return authedFetch<{ synced: number }>('/banking/sync-bank', { method: 'POST' });
}

export function hasNisosSession(): boolean {
  return !!getSessionId();
}

/**
 * Manually add an account to the citizen's own Nisos backend ledger. Not
 * part of BankingPort - the demo adapter has no server to persist to, and
 * this is deliberately a citizen-entered record (name + starting balance
 * they choose), not something the app claims to have fetched from a bank.
 */
export async function createNisosAccount(input: {
  name: string;
  type: 'current' | 'savings' | 'card' | 'investment' | 'business';
  balance: number;
}): Promise<Account> {
  const { account } = await authedFetch<{ account: BackendAccount }>('/banking/accounts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return mapAccount(account);
}

/** Removes a citizen-added account (and its transactions) from the ledger. */
export async function removeNisosAccount(accountId: string): Promise<void> {
  await authedFetch<{ ok: boolean }>(`/banking/accounts/${accountId}`, { method: 'DELETE' });
}
