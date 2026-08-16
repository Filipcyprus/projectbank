/* ---------------------------------------------------------------------------
 * Live adapter skeletons.
 *
 * These are the seams where real integrations attach. They are deliberately
 * *not* implemented against any specific ministry or bank: doing so would
 * require a signed agreement, a licence (PSD2 AISP/PISP for account and payment
 * access) and credentials that must never live in a client bundle.
 *
 * What they do provide:
 *   - the exact call shape the gateway must expose
 *   - OAuth 2.0 / OIDC with PKCE for user-present authorisation
 *   - a hard failure (NotConfiguredError) when configuration is absent, so the
 *     app can never silently fall back to invented data while claiming to be live
 * ------------------------------------------------------------------------- */

import { integrationEnv } from '../config';
import type {
  Account,
  AnalyticsPort,
  AppNotification,
  BankingPort,
  DocumentsPort,
  GovApplication,
  GovernmentPort,
  GovService,
  IdentityClaims,
  IdentityPort,
  IdentityPresentation,
  NotificationsPort,
  PaymentsPort,
  ProviderDescriptor,
  Transaction,
  VaultDocument,
} from '../types';
import { IntegrationError, NotConfiguredError } from '../types';

/* --- Token handling -------------------------------------------------------
 * Access tokens are short-lived and held in memory only. Refresh tokens are
 * never exposed to the client: the Nisos gateway holds them in an httpOnly,
 * SameSite=Strict cookie session. Bank credentials are never seen by Nisos at
 * all — the citizen authenticates on their own bank's domain.
 * ------------------------------------------------------------------------- */

interface TokenSet {
  accessToken: string;
  expiresAt: number;
  scope: string[];
}

const tokens = new Map<string, TokenSet>();

export const tokenStore = {
  get(providerId: string): TokenSet | undefined {
    const t = tokens.get(providerId);
    if (t && t.expiresAt <= Date.now()) {
      tokens.delete(providerId);
      return undefined;
    }
    return t;
  },
  set(providerId: string, t: TokenSet) {
    tokens.set(providerId, t);
  },
  clear(providerId?: string) {
    if (providerId) tokens.delete(providerId);
    else tokens.clear();
  },
};

/** RFC 7636 PKCE challenge, generated with the platform CSPRNG. */
export async function createPkceChallenge(): Promise<{ verifier: string; challenge: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64url(bytes);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}

function base64url(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Every outbound call goes through here: auth header, timeout, error mapping. */
async function call<T>(
  providerId: string,
  baseUrl: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!baseUrl) throw new NotConfiguredError(providerId);
  const token = tokenStore.get(providerId);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
      ...init,
      signal: controller.signal,
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token.accessToken}` } : {}),
        ...(init.headers ?? {}),
      },
    });
    if (res.status === 401) throw new IntegrationError('Authorisation expired.', 'auth_expired');
    if (res.status === 403) throw new IntegrationError('Consent was withdrawn.', 'consent_revoked');
    if (res.status === 429) throw new IntegrationError('Too many requests.', 'rate_limited', true);
    if (!res.ok) throw new IntegrationError(`Upstream error ${res.status}.`, 'upstream_unavailable', true);
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof IntegrationError || err instanceof NotConfiguredError) throw err;
    throw new IntegrationError('Network unavailable.', 'network', true);
  } finally {
    clearTimeout(timer);
  }
}

/* --- Identity (OIDC) ------------------------------------------------------ */

export class OidcIdentityAdapter implements IdentityPort {
  descriptor: ProviderDescriptor;
  constructor(descriptor: ProviderDescriptor) {
    this.descriptor = descriptor;
  }
  private get cfg() {
    const c = integrationEnv.idp;
    if (!c.issuer || !c.clientId) throw new NotConfiguredError(this.descriptor.id);
    return c;
  }
  /** Builds the authorization request. The user authenticates on the IdP domain. */
  async beginAuthorization(): Promise<string> {
    const c = this.cfg;
    const { challenge, verifier } = await createPkceChallenge();
    sessionStorage.setItem('nisos.pkce', verifier);
    const state = base64url(crypto.getRandomValues(new Uint8Array(16)));
    sessionStorage.setItem('nisos.oidc_state', state);
    const q = new URLSearchParams({
      response_type: 'code',
      client_id: c.clientId,
      redirect_uri: c.redirectUri,
      scope: c.scopes.join(' '),
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
    return `${c.issuer.replace(/\/$/, '')}/authorize?${q.toString()}`;
  }
  async getClaims(): Promise<IdentityClaims> {
    return call<IdentityClaims>(this.descriptor.id, this.cfg.issuer, '/userinfo');
  }
  async verify(level: 'substantial' | 'high') {
    return call<{ ok: boolean; assurance: string }>(this.descriptor.id, this.cfg.issuer, '/assurance', {
      method: 'POST',
      body: JSON.stringify({ level }),
    });
  }
  async createPresentation(selected: string[], audience: string): Promise<IdentityPresentation> {
    // A production build issues a W3C Verifiable Presentation with selective
    // disclosure (SD-JWT), signed by a key held in the device secure element.
    return call<IdentityPresentation>(this.descriptor.id, this.cfg.issuer, '/presentations', {
      method: 'POST',
      body: JSON.stringify({ claims: selected, audience }),
    });
  }
}

/* --- Open Banking (PSD2 AISP) --------------------------------------------- */

export class OpenBankingAdapter implements BankingPort {
  descriptor: ProviderDescriptor;
  constructor(descriptor: ProviderDescriptor) {
    this.descriptor = descriptor;
  }
  private get base() {
    const c = integrationEnv.openBanking;
    if (!c.baseUrl || !c.clientId) throw new NotConfiguredError(this.descriptor.id);
    return c.baseUrl;
  }
  listAccounts(): Promise<Account[]> {
    return call<Account[]>(this.descriptor.id, this.base, '/accounts');
  }
  listTransactions(accountId?: string): Promise<Transaction[]> {
    const q = accountId ? `?accountId=${encodeURIComponent(accountId)}` : '';
    return call<Transaction[]>(this.descriptor.id, this.base, `/transactions${q}`);
  }
  /** The citizen approves access on their bank's own site; we never see credentials. */
  beginConsent(institutionId: string) {
    return call<{ authorizationUrl: string; state: string }>(this.descriptor.id, this.base, '/consents', {
      method: 'POST',
      body: JSON.stringify({ institutionId, redirectUri: integrationEnv.openBanking.redirectUri }),
    });
  }
}

/* --- Payments (PSP / PISP) ------------------------------------------------ */

export class PspPaymentsAdapter implements PaymentsPort {
  descriptor: ProviderDescriptor;
  constructor(descriptor: ProviderDescriptor) {
    this.descriptor = descriptor;
  }
  private get base() {
    const c = integrationEnv.psp;
    if (!c.baseUrl || !c.publishableKey) throw new NotConfiguredError(this.descriptor.id);
    return c.baseUrl;
  }
  quote(input: { amount: number; payee: string; kind: 'sepa' | 'qr' | 'internal' }) {
    return call<{ fee: number; total: number; arrival: string }>(this.descriptor.id, this.base, '/quotes', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
  /** Strong Customer Authentication is enforced server-side, not by this call. */
  execute(input: {
    amount: number;
    payeeId?: string;
    payeeName: string;
    kind: 'sepa' | 'qr' | 'internal' | 'bill';
    reference?: string;
    accountId: string;
  }): Promise<Transaction> {
    return call<Transaction>(this.descriptor.id, this.base, '/payments', {
      method: 'POST',
      // Idempotency key protects against double submission on retry.
      headers: { 'Idempotency-Key': base64url(crypto.getRandomValues(new Uint8Array(16))) },
      body: JSON.stringify(input),
    });
  }
  resolveQr(payload: string) {
    return call<{ merchant: string; merchantId: string; amount?: number; reference?: string }>(
      this.descriptor.id,
      this.base,
      '/qr/resolve',
      { method: 'POST', body: JSON.stringify({ payload }) },
    );
  }
}

/* --- Government gateway --------------------------------------------------- */

export class GovGatewayAdapter implements GovernmentPort {
  descriptor: ProviderDescriptor;
  constructor(descriptor: ProviderDescriptor) {
    this.descriptor = descriptor;
  }
  private get base() {
    const c = integrationEnv.gov.gatewayUrl;
    if (!c) throw new NotConfiguredError(this.descriptor.id);
    return c;
  }
  listServices(): Promise<GovService[]> {
    return call<GovService[]>(this.descriptor.id, this.base, '/services');
  }
  listApplications(): Promise<GovApplication[]> {
    return call<GovApplication[]>(this.descriptor.id, this.base, '/applications');
  }
  submitApplication(serviceId: string): Promise<GovApplication> {
    return call<GovApplication>(this.descriptor.id, this.base, '/applications', {
      method: 'POST',
      body: JSON.stringify({ serviceId }),
    });
  }
}

/* --- Documents ------------------------------------------------------------ */

export class DocumentVerificationAdapter implements DocumentsPort {
  descriptor: ProviderDescriptor;
  constructor(descriptor: ProviderDescriptor) {
    this.descriptor = descriptor;
  }
  private get base() {
    const c = integrationEnv.docVerify.baseUrl;
    if (!c) throw new NotConfiguredError(this.descriptor.id);
    return c;
  }
  list(): Promise<VaultDocument[]> {
    return call<VaultDocument[]>(this.descriptor.id, this.base, '/documents');
  }
  /** Bytes are encrypted on device; the server stores ciphertext plus metadata. */
  upload(input: { name: string; category: VaultDocument['category']; sizeKb: number; fileType: VaultDocument['fileType'] }) {
    return call<VaultDocument>(this.descriptor.id, this.base, '/documents', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
  async remove(id: string): Promise<void> {
    await call<void>(this.descriptor.id, this.base, `/documents/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
}

/* --- Notifications & analytics -------------------------------------------- */

export class PushNotificationsAdapter implements NotificationsPort {
  descriptor: ProviderDescriptor;
  constructor(descriptor: ProviderDescriptor) {
    this.descriptor = descriptor;
  }
  list(): Promise<AppNotification[]> {
    if (!integrationEnv.push.publicKey) throw new NotConfiguredError(this.descriptor.id);
    return call<AppNotification[]>(this.descriptor.id, integrationEnv.gov.gatewayUrl, '/notifications');
  }
}

export class HttpAnalyticsAdapter implements AnalyticsPort {
  descriptor: ProviderDescriptor;
  constructor(descriptor: ProviderDescriptor) {
    this.descriptor = descriptor;
  }
  track(event: string, props?: Record<string, string | number | boolean>) {
    const endpoint = integrationEnv.analytics.endpoint;
    if (!endpoint) return;
    // Event name and coarse properties only. No identifiers, no amounts, no IBANs.
    navigator.sendBeacon?.(endpoint, JSON.stringify({ event, props, ts: Date.now() }));
  }
}
