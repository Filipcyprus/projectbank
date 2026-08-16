/* ---------------------------------------------------------------------------
 * Provider registry.
 *
 * One place decides, per port, whether the app talks to a live integration or
 * to a demo adapter. Screens ask the registry for a port and render whatever
 * `descriptor.status` says — they never hardcode a bank or a department.
 *
 * Adding a real integration later is a registry change plus configuration; no
 * screen has to be rewritten.
 * ------------------------------------------------------------------------- */

import { isLive } from './config';
import {
  DocumentVerificationAdapter,
  GovGatewayAdapter,
  HttpAnalyticsAdapter,
  OidcIdentityAdapter,
  OpenBankingAdapter,
  PspPaymentsAdapter,
  PushNotificationsAdapter,
} from './adapters/liveAdapters';
import {
  demoAnalyticsAdapter,
  demoBankingAdapter,
  demoDocumentsAdapter,
  demoGovernmentAdapter,
  demoIdentityAdapter,
  demoNotificationsAdapter,
  demoPaymentsAdapter,
} from './demo/demoAdapters';
import { hasNisosSession, nisosLiveBankingAdapter } from './adapters/nisosLiveBankingAdapter';
import { nisosLiveIdentityAdapter } from './adapters/nisosLiveIdentityAdapter';
import { nisosLivePaymentsAdapter } from './adapters/nisosLivePaymentsAdapter';
import type { PortMap, ProviderDescriptor, ProviderKind } from './types';

const liveDescriptor = (
  id: string,
  kind: ProviderKind,
  name: string,
  operator: string,
  capabilities: string[],
): ProviderDescriptor => ({
  id,
  kind,
  name,
  operator,
  status: 'official-api',
  auth: { type: 'gateway-mtls', gatewayUrl: '' },
  capabilities,
  note: 'Configured at runtime.',
});

const ports: PortMap = {
  // Same pattern as banking below: a signed-in Nisos session sees its real
  // profile from the backend; everyone else sees demo data. A configured
  // eIDAS/OIDC provider (isLive.identity) still takes priority.
  identity: isLive.identity
    ? new OidcIdentityAdapter(
        liveDescriptor('identity.oidc', 'identity', 'Accredited identity provider', 'External', [
          'claims.read',
          'presentation.create',
        ]),
      )
    : {
        get descriptor() {
          return hasNisosSession() ? nisosLiveIdentityAdapter.descriptor : demoIdentityAdapter.descriptor;
        },
        getClaims: () => (hasNisosSession() ? nisosLiveIdentityAdapter : demoIdentityAdapter).getClaims(),
        verify: (level: 'substantial' | 'high') =>
          (hasNisosSession() ? nisosLiveIdentityAdapter : demoIdentityAdapter).verify(level),
        createPresentation: (selected: string[], audience: string) =>
          (hasNisosSession() ? nisosLiveIdentityAdapter : demoIdentityAdapter).createPresentation(selected, audience),
      },

  // A citizen signed in through the real Nisos backend (server/index.js) sees
  // their real accounts and transactions from it; everyone else sees demo
  // data. Checked per-call (not at module load) so logging in swaps this
  // live without a page reload. External bank aggregation (isLive.banking)
  // still takes priority if that's ever configured.
  banking: isLive.banking
    ? new OpenBankingAdapter(
        liveDescriptor('banking.psd2', 'banking', 'Open banking aggregator', 'Licensed TPP', [
          'accounts.read',
          'transactions.read',
          'consent.manage',
        ]),
      )
    : {
        get descriptor() {
          return hasNisosSession() ? nisosLiveBankingAdapter.descriptor : demoBankingAdapter.descriptor;
        },
        listAccounts: () => (hasNisosSession() ? nisosLiveBankingAdapter : demoBankingAdapter).listAccounts(),
        listTransactions: (accountId?: string) =>
          (hasNisosSession() ? nisosLiveBankingAdapter : demoBankingAdapter).listTransactions(accountId),
        beginConsent: (institutionId: string) =>
          (hasNisosSession() ? nisosLiveBankingAdapter : demoBankingAdapter).beginConsent(institutionId),
      },

  // A signed-in Nisos session sends real transfers through the Nisos
  // backend (server/index.js) — the balance actually moves and the
  // transaction is persisted. Everyone else uses the on-device demo ledger.
  // A configured licensed PSP (isLive.payments) still takes priority.
  payments: isLive.payments
    ? new PspPaymentsAdapter(
        liveDescriptor('payments.psp', 'payments', 'Payment service provider', 'Licensed PSP', [
          'transfer.sepa',
          'qr.resolve',
        ]),
      )
    : {
        get descriptor() {
          return hasNisosSession() ? nisosLivePaymentsAdapter.descriptor : demoPaymentsAdapter.descriptor;
        },
        quote: (input) => (hasNisosSession() ? nisosLivePaymentsAdapter : demoPaymentsAdapter).quote(input),
        execute: (input) => (hasNisosSession() ? nisosLivePaymentsAdapter : demoPaymentsAdapter).execute(input),
        resolveQr: (payload: string) =>
          (hasNisosSession() ? nisosLivePaymentsAdapter : demoPaymentsAdapter).resolveQr(payload),
      },

  government: isLive.government
    ? new GovGatewayAdapter(
        liveDescriptor('government.gateway', 'government', 'Government service gateway', 'Nisos gateway', [
          'services.list',
          'applications.submit',
        ]),
      )
    : demoGovernmentAdapter,

  documents: isLive.documents
    ? new DocumentVerificationAdapter(
        liveDescriptor('documents.trust', 'documents', 'Document trust service', 'External', [
          'vault.read',
          'vault.write',
          'verify',
        ]),
      )
    : demoDocumentsAdapter,

  notifications: isLive.notifications
    ? new PushNotificationsAdapter(
        liveDescriptor('notifications.push', 'notifications', 'Push delivery', 'Nisos gateway', ['feed.read']),
      )
    : demoNotificationsAdapter,

  analytics: isLive.analytics
    ? new HttpAnalyticsAdapter(
        liveDescriptor('analytics.http', 'analytics', 'Product analytics', 'Nisos', ['event.track']),
      )
    : demoAnalyticsAdapter,
};

export function use<K extends keyof PortMap>(kind: K): PortMap[K] {
  return ports[kind];
}

export const registry = {
  ports,
  descriptors(): ProviderDescriptor[] {
    return (Object.keys(ports) as (keyof PortMap)[]).map((k) => ports[k].descriptor);
  },
  descriptorFor(kind: keyof PortMap): ProviderDescriptor {
    return ports[kind].descriptor;
  },
};
