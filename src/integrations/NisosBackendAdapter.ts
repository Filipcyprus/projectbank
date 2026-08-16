/**
 * Live adapter that connects to the Nisos backend at localhost:3001.
 * Fetches real banking, identity, and government data.
 */

import type {
  BankingPort,
  IdentityPort,
  Account,
  Transaction,
  IdentityClaims,
} from './types';

const API_BASE = 'http://localhost:3001/api';

export class NisosBackendAdapter {
  sessionId: string | null = null;

  setSession(sessionId: string) {
    this.sessionId = sessionId;
  }

  private async fetch<T>(method: string, path: string, body?: any): Promise<T> {
    if (!this.sessionId && !path.includes('login')) {
      throw new Error('No session');
    }

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.sessionId ? `Bearer ${this.sessionId}` : '',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return res.json();
  }

  /** Banking: Get accounts */
  async getAccounts(): Promise<Account[]> {
    const { accounts } = await this.fetch<{ accounts: Account[] }>('GET', '/banking/accounts');
    return accounts;
  }

  /** Banking: Get transactions for an account */
  async getTransactions(accountId: string): Promise<Transaction[]> {
    const { transactions } = await this.fetch<{ transactions: Transaction[] }>(
      'GET',
      `/banking/accounts/${accountId}/transactions`
    );
    return transactions;
  }

  /** Banking: Transfer money */
  async transfer(fromAccountId: string, toIban: string, amount: number, description: string) {
    return this.fetch('POST', '/banking/transfer', {
      fromAccountId,
      toIban,
      amount,
      description,
    });
  }

  /** Identity: Get citizen's profile */
  async getIdentity(): Promise<IdentityClaims> {
    const profile = await this.fetch<any>('GET', '/identity/profile');
    const [givenName, ...familyNameParts] = profile.name.split(' ');
    const familyName = familyNameParts.join(' ');
    return {
      fullName: profile.name,
      givenName,
      familyName,
      idNumber: profile.idNumber,
      digitalIdNumber: profile.idNumber,
      dateOfBirth: profile.dateOfBirth,
      nationality: profile.nationality,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      verified: profile.verified,
      assuranceLevel: profile.assuranceLevel,
      photoInitials: givenName[0] + (familyName[0] || ''),
    };
  }

  /** Identity: Create a share code */
  async shareIdentity(claims: string[], audience: string) {
    return this.fetch('POST', '/identity/share', { claims, audience });
  }
}

export const nisosBackend = new NisosBackendAdapter();
