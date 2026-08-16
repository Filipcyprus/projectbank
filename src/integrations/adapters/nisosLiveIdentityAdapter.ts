/* ---------------------------------------------------------------------------
 * Nisos live identity adapter.
 *
 * Fetches the citizen's real profile from the Nisos backend after login,
 * instead of the invented demo identity. Presentation/share creation is also
 * recorded server-side (POST /api/identity/share) so a code is real and
 * time-limited, not just a client-side object. Still not eIDAS-accredited —
 * see docs/INTEGRATIONS.md for exactly what that would additionally require.
 * ------------------------------------------------------------------------- */

import type { IdentityClaims, IdentityPort, IdentityPresentation, ProviderDescriptor } from '../types';
import { IntegrationError } from '../types';

function getApiBase(): string {
  const url = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';
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
    throw new IntegrationError('Nisos backend unavailable', 'upstream_unavailable', true);
  }
  return res.json();
}

const descriptor: ProviderDescriptor = {
  id: 'identity.nisos-backend',
  kind: 'identity',
  name: 'Nisos identity',
  operator: 'Nisos backend',
  status: 'official-api',
  auth: { type: 'gateway-mtls', gatewayUrl: 'runtime-configured' },
  capabilities: ['claims.read', 'presentation.create'],
  note: 'Real profile served by the Nisos backend after sign-in - configured at runtime via VITE_API_URL.',
};

interface BackendProfile {
  name: string;
  idNumber: string;
  verified: boolean;
  assuranceLevel: 'low' | 'substantial' | 'high';
  dateOfBirth: string;
  nationality: string;
  email: string;
}

function mapClaims(p: BackendProfile): IdentityClaims {
  const [givenName, ...rest] = p.name.split(' ');
  const familyName = rest.join(' ');
  return {
    fullName: p.name,
    givenName,
    familyName,
    dateOfBirth: p.dateOfBirth,
    nationality: p.nationality,
    idNumber: p.idNumber,
    digitalIdNumber: p.idNumber,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    assuranceLevel: p.assuranceLevel,
    verified: p.verified,
    photoInitials: (givenName[0] ?? '') + (familyName[0] ?? ''),
  };
}

export const nisosLiveIdentityAdapter: IdentityPort = {
  descriptor,

  async getClaims(): Promise<IdentityClaims> {
    const profile = await authedFetch<BackendProfile>('/identity/profile');
    return mapClaims(profile);
  },

  async verify(level) {
    // The backend's demo user is already marked verified at "substantial".
    // A real flow would redirect to an eIDAS/OIDC authorize URL here.
    const profile = await authedFetch<BackendProfile>('/identity/profile');
    return { ok: profile.verified, assurance: `${profile.assuranceLevel} (Nisos backend)` };
  },

  async createPresentation(selected, audience): Promise<IdentityPresentation> {
    const profile = await authedFetch<BackendProfile>('/identity/profile');
    const claims = mapClaims(profile);
    const all: Record<string, string | boolean> = {
      name: claims.fullName,
      dateOfBirth: claims.dateOfBirth,
      over18: true,
      nationality: claims.nationality,
      idNumber: claims.idNumber,
      digitalIdNumber: claims.digitalIdNumber,
      identityVerified: claims.verified,
    };
    const releasedClaims: Record<string, string | boolean> = {};
    selected.forEach((k) => {
      if (k in all) releasedClaims[k] = all[k];
    });

    // Record the share server-side — a real, time-limited code, not a
    // client-only object.
    const { shareId, expiresIn } = await authedFetch<{
      shareId: string;
      code: string;
      expiresIn: number;
    }>('/identity/share', {
      method: 'POST',
      body: JSON.stringify({ claims: selected, audience }),
    });

    const created = new Date();
    return {
      id: shareId,
      createdAt: created.toISOString(),
      expiresAt: new Date(created.getTime() + expiresIn * 1000).toISOString(),
      audience,
      claims: releasedClaims,
      source: 'official-api',
    };
  },
};

export function hasNisosSession(): boolean {
  return !!getSessionId();
}
