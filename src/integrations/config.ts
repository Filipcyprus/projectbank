/* ---------------------------------------------------------------------------
 * Integration configuration.
 *
 * The single rule of this file: an adapter is only allowed to claim
 * `official-api` when real configuration is present at runtime. With an empty
 * .env — which is how this prototype ships — every adapter degrades to
 * `demo` or `coming-soon`, and the UI says so on every screen.
 * ------------------------------------------------------------------------- */

import type { IntegrationStatus } from './types';

const env = import.meta.env as Record<string, string | undefined>;

const val = (key: string): string => (env[key] ?? '').trim();

export const integrationEnv = {
  idp: {
    issuer: val('VITE_IDP_ISSUER'),
    clientId: val('VITE_IDP_CLIENT_ID'),
    redirectUri: val('VITE_IDP_REDIRECT_URI') || `${location.origin}/auth/callback`,
    scopes: (val('VITE_IDP_SCOPES') || 'openid profile').split(/\s+/),
  },
  openBanking: {
    baseUrl: val('VITE_OPENBANKING_BASE_URL'),
    clientId: val('VITE_OPENBANKING_CLIENT_ID'),
    redirectUri: val('VITE_OPENBANKING_REDIRECT_URI') || `${location.origin}/banking/callback`,
  },
  psp: {
    baseUrl: val('VITE_PSP_BASE_URL'),
    publishableKey: val('VITE_PSP_PUBLISHABLE_KEY'),
  },
  gov: { gatewayUrl: val('VITE_GOV_GATEWAY_URL') },
  docVerify: { baseUrl: val('VITE_DOCVERIFY_BASE_URL') },
  push: { publicKey: val('VITE_PUSH_PUBLIC_KEY') },
  analytics: { endpoint: val('VITE_ANALYTICS_ENDPOINT') },
};

/**
 * Resolve the honest status of an integration.
 * `configured` must be true only when credentials for a *signed* integration
 * are actually present. Everything else falls back to the declared placeholder.
 */
export function resolveStatus(configured: boolean, fallback: IntegrationStatus): IntegrationStatus {
  return configured ? 'official-api' : fallback;
}

export const isLive = {
  identity: Boolean(integrationEnv.idp.issuer && integrationEnv.idp.clientId),
  banking: Boolean(integrationEnv.openBanking.baseUrl && integrationEnv.openBanking.clientId),
  payments: Boolean(integrationEnv.psp.baseUrl && integrationEnv.psp.publishableKey),
  government: Boolean(integrationEnv.gov.gatewayUrl),
  documents: Boolean(integrationEnv.docVerify.baseUrl),
  notifications: Boolean(integrationEnv.push.publicKey),
  analytics: Boolean(integrationEnv.analytics.endpoint),
};

/** True when nothing at all is wired up — drives the global DEMO banner. */
export const isPrototypeMode = !Object.values(isLive).some(Boolean);

export const STATUS_LABEL: Record<IntegrationStatus, string> = {
  'official-api': 'Official API',
  'official-link': 'Official website link',
  'coming-soon': 'Coming soon',
  demo: 'Demo',
};

export const STATUS_TONE: Record<IntegrationStatus, 'ok' | 'info' | 'warn' | 'demo'> = {
  'official-api': 'ok',
  'official-link': 'info',
  'coming-soon': 'warn',
  demo: 'demo',
};
