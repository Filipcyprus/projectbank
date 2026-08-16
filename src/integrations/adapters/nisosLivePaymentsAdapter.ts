/* ---------------------------------------------------------------------------
 * Nisos live payments adapter.
 *
 * Wires "Send money" and bill payments to the real Nisos backend endpoint
 * (POST /api/banking/transfer), which actually deducts the balance and
 * writes a persisted transaction record — the same accounts and ledger the
 * Money screen reads from. Genuinely moves the device's own real balance;
 * it is still not a licensed SEPA/PSP rail to an external bank (see
 * docs/INTEGRATIONS.md) — money leaving to an external IBAN is recorded,
 * not actually wired to that bank.
 *
 * QR/in-store payments (ScanPay) stay on the demo adapter: there is no real
 * merchant acquirer or camera-based QR resolution in this build, and the
 * ScanPay screen is explicit about that ("Simulated camera").
 * ------------------------------------------------------------------------- */

import type { PaymentsPort, ProviderDescriptor, Transaction } from '../types';
import { IntegrationError } from '../types';
import { demoPaymentsAdapter } from '../demo/demoAdapters';

function getApiBase(): string {
  const url = (import.meta.env.VITE_API_URL as string) || 'https://projectbank-production.up.railway.app';
  return `${url}/api`;
}

function getSessionId(): string | null {
  return localStorage.getItem('nisos_session_id');
}

async function authedFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const sessionId = getSessionId();
  if (!sessionId) throw new IntegrationError('Not signed in', 'auth_expired', false);

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
    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      if (body.error === 'Insufficient funds') {
        throw new IntegrationError('Not enough balance in this account.', 'insufficient_funds', false);
      }
    }
    throw new IntegrationError('Nisos backend unavailable', 'upstream_unavailable', true);
  }
  return res.json();
}

const descriptor: ProviderDescriptor = {
  id: 'payments.nisos-backend',
  kind: 'payments',
  name: 'Nisos payments',
  operator: 'Nisos backend',
  status: 'official-api',
  auth: { type: 'gateway-mtls', gatewayUrl: 'runtime-configured' },
  capabilities: ['transfer.internal', 'transfer.sepa.record'],
  note:
    'Transfers really deduct the balance and are persisted by the Nisos backend - configured at runtime via ' +
    'VITE_API_URL. Not a licensed SEPA/PSP rail: money sent to an external IBAN is recorded here but not actually ' +
    "delivered to that bank. QR/in-store payments still use the prototype's simulated merchant flow.",
};

interface TransferResponse {
  transactionId: string;
  status: string;
  amount: number;
}

export const nisosLivePaymentsAdapter: PaymentsPort = {
  descriptor,

  async quote({ amount, kind }) {
    // No live quoting endpoint on the backend; fee/arrival mirror what
    // execute() will actually do (0 fee, instant, own ledger).
    return {
      fee: 0,
      total: amount,
      arrival: kind === 'internal' ? 'Instantly' : 'Recorded instantly (not a real SEPA rail)',
    };
  },

  async execute(input): Promise<Transaction> {
    if (input.amount <= 0) throw new IntegrationError('Enter an amount above zero.', 'rejected');

    // QR/in-store payments have no real merchant behind them yet — keep
    // that flow honestly on the demo ledger rather than debiting a real
    // balance against a fictitious merchant.
    if (input.kind === 'qr') {
      return demoPaymentsAdapter.execute(input);
    }

    const { transactionId } = await authedFetch<TransferResponse>('/banking/transfer', {
      method: 'POST',
      body: JSON.stringify({
        fromAccountId: input.accountId,
        toIban: input.payeeId ?? input.payeeName,
        amount: input.amount,
        description: input.reference ? `${input.payeeName}: ${input.reference}` : input.payeeName,
      }),
    });

    return {
      id: transactionId,
      accountId: input.accountId,
      merchant: input.payeeName,
      description: input.reference,
      amount: -Math.abs(input.amount),
      currency: 'EUR',
      date: new Date().toISOString(),
      category: input.kind === 'bill' ? 'utilities' : 'transfer',
      status: 'settled',
      method: input.kind === 'internal' ? 'internal' : input.kind === 'bill' ? 'direct-debit' : 'sepa',
      reference: `NIS${Math.floor(100000 + Math.random() * 899999)}`,
      source: 'official-api',
    };
  },

  async resolveQr(payload: string) {
    // No real acquirer/merchant network connected — same simulated
    // resolution the demo adapter uses, honestly labelled by the ScanPay
    // screen itself.
    return demoPaymentsAdapter.resolveQr(payload);
  },
};

export function hasNisosSession(): boolean {
  return !!getSessionId();
}
