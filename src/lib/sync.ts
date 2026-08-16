/* ---------------------------------------------------------------------------
 * Cross-device sync — honestly, a manual code.
 *
 * There is no Nisos account server in this prototype, so there is nothing to
 * push a change to continuously. What this *can* do today, for real: package
 * up preferences/security settings/profile/family into a portable code the
 * citizen copies to a second device themselves. A production build replaces
 * this entirely with a signed-in account that syncs automatically the moment
 * a setting changes — see the disclaimer on the Sync screen.
 * ------------------------------------------------------------------------- */

import type { Preferences, SecuritySettings, AppState, FamilyMember } from '../state/store';

const SYNC_VERSION = 1;

export interface SyncPayload {
  v: number;
  at: string;
  prefs: Preferences;
  security: Omit<SecuritySettings, 'pinFailStreak' | 'pinLockedUntil'>;
  user: AppState['user'];
  familyMembers: FamilyMember[];
}

export function buildSyncPayload(state: AppState): SyncPayload {
  const { pinFailStreak, pinLockedUntil, ...security } = state.security;
  void pinFailStreak;
  void pinLockedUntil;
  return {
    v: SYNC_VERSION,
    at: new Date().toISOString(),
    prefs: state.prefs,
    security,
    user: state.user,
    familyMembers: state.familyMembers,
  };
}

export function encodeSyncCode(payload: SyncPayload): string {
  const json = JSON.stringify(payload);
  // btoa is Latin1-only; encodeURIComponent round-trips arbitrary UTF-8 through it safely.
  return btoa(encodeURIComponent(json)).replace(/=+$/, '');
}

export class SyncCodeError extends Error {}

export function decodeSyncCode(code: string): SyncPayload {
  let json: string;
  try {
    json = decodeURIComponent(atob(code.trim()));
  } catch {
    throw new SyncCodeError('That code is not readable. Check you copied the whole thing.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new SyncCodeError('That code is not a valid Nisos sync code.');
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('v' in parsed) ||
    !('prefs' in parsed) ||
    !('security' in parsed) ||
    !('user' in parsed)
  ) {
    throw new SyncCodeError('That code is missing expected fields.');
  }
  return parsed as SyncPayload;
}
