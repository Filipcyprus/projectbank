/* ---------------------------------------------------------------------------
 * Nisos security adapter.
 *
 * Sign-in history the way Estonia's e-service portals show it: every
 * successful and failed sign-in against your account, recorded server-side
 * so it survives a reinstall and can't be edited from the device itself.
 * Not a "port" like banking/identity/payments - this is an internal Nisos
 * account-security feature, not something a third-party provider fulfils.
 * ------------------------------------------------------------------------- */

import { IntegrationError } from '../types';
import type { LoginEvent } from '../../data/seed';

function getApiBase(): string {
  const url = (import.meta.env.VITE_API_URL as string) || 'https://projectbank-production.up.railway.app';
  return `${url}/api`;
}

function getSessionId(): string | null {
  return localStorage.getItem('nisos_session_id');
}

export function hasNisosSession(): boolean {
  return !!getSessionId();
}

interface BackendLoginEvent {
  id: string;
  at: string;
  outcome: 'success' | 'failed';
  method: 'pin' | 'registration';
  device: string;
  ip: string;
}

function mapLoginEvent(e: BackendLoginEvent): LoginEvent {
  return {
    id: e.id,
    at: e.at,
    // The prototype has no geo-IP lookup - showing the real request IP
    // instead of a fabricated city keeps this honest.
    location: `IP ${e.ip}`,
    device: e.device,
    method: e.method === 'registration' ? 'password' : 'pin',
    outcome: e.outcome,
  };
}

/** Fetches the signed-in citizen's own sign-in history from the backend. */
export async function getNisosLoginHistory(): Promise<LoginEvent[]> {
  const sessionId = getSessionId();
  if (!sessionId) throw new IntegrationError('Not signed in', 'auth_expired', false);

  const res = await fetch(`${getApiBase()}/auth/login-history`, {
    headers: { Authorization: `Bearer ${sessionId}` },
  });

  if (!res.ok) {
    if (res.status === 401) throw new IntegrationError('Session expired', 'auth_expired', false);
    throw new IntegrationError('Could not load your sign-in history.', 'upstream_unavailable', true);
  }

  const { history } = (await res.json()) as { history: BackendLoginEvent[] };
  return history.map(mapLoginEvent);
}
