/* ---------------------------------------------------------------------------
 * Demo adapters.
 *
 * These fulfil the same ports as a live integration would, but every record
 * they return is generated locally and stamped `source: 'demo'`. They exist so
 * the product can be designed, reviewed and tested end-to-end without ever
 * implying that a bank or a ministry is connected.
 *
 * They also simulate the unglamorous parts of a real integration — latency,
 * occasional failure — so that loading and error states are real screens
 * rather than an afterthought.
 * ------------------------------------------------------------------------- */

import {
  demoAccounts,
  demoApplications,
  demoDocuments,
  demoIdentity,
  demoNotifications,
  demoTransactions,
  govServices,
} from '../../data/seed';
import type {
  Account,
  AnalyticsPort,
  AppNotification,
  BankingPort,
  DocCategory,
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
import { IntegrationError } from '../types';

const latency = (min = 260, max = 620) =>
  new Promise<void>((r) => setTimeout(r, min + Math.random() * (max - min)));

/** Deterministic-ish failure so error states can be exercised on demand. */
let forcedFailure: string | null = null;
export const demoControls = {
  failNext(scope: string) {
    forcedFailure = scope;
  },
  clear() {
    forcedFailure = null;
  },
};
const maybeFail = (scope: string) => {
  if (forcedFailure === scope) {
    forcedFailure = null;
    throw new IntegrationError(
      'The demo provider is temporarily unavailable.',
      'upstream_unavailable',
      true,
    );
  }
};

const rid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

/* --- Identity ------------------------------------------------------------- */

const identityDescriptor: ProviderDescriptor = {
  id: 'identity.demo',
  kind: 'identity',
  name: 'Nisos demo identity',
  operator: 'Nisos (prototype)',
  status: 'demo',
  auth: { type: 'demo' },
  capabilities: ['claims.read', 'presentation.create', 'assurance.simulate'],
  note: 'Simulated credential. Real assurance requires an accredited eID provider.',
  lawfulBasis: 'Not applicable — synthetic data held on device.',
};

export const demoIdentityAdapter: IdentityPort = {
  descriptor: identityDescriptor,
  async getClaims(): Promise<IdentityClaims> {
    await latency(180, 380);
    maybeFail('identity');
    return { ...demoIdentity };
  },
  async verify(level) {
    await latency(900, 1500);
    maybeFail('identity.verify');
    return { ok: true, assurance: `${level} (simulated)` };
  },
  async createPresentation(selected, audience): Promise<IdentityPresentation> {
    await latency(400, 800);
    const all: Record<string, string | boolean> = {
      name: demoIdentity.fullName,
      dateOfBirth: demoIdentity.dateOfBirth,
      over18: true,
      nationality: demoIdentity.nationality,
      idNumber: demoIdentity.idNumber,
      digitalIdNumber: demoIdentity.digitalIdNumber,
      identityVerified: demoIdentity.verified,
      address: 'Larnaca, Cyprus',
    };
    const claims: Record<string, string | boolean> = {};
    selected.forEach((k) => {
      if (k in all) claims[k] = all[k];
    });
    const created = new Date();
    return {
      id: rid('vp'),
      createdAt: created.toISOString(),
      expiresAt: new Date(created.getTime() + 5 * 60_000).toISOString(),
      claims,
      audience,
      source: 'demo',
    };
  },
};

/* --- Banking -------------------------------------------------------------- */

const bankingDescriptor: ProviderDescriptor = {
  id: 'banking.demo',
  kind: 'banking',
  name: 'Nisos demo ledger',
  operator: 'Nisos (prototype)',
  status: 'demo',
  auth: { type: 'demo' },
  capabilities: ['accounts.read', 'transactions.read'],
  note: 'No bank is connected. Balances are invented for the prototype.',
};

export const demoBankingAdapter: BankingPort = {
  descriptor: bankingDescriptor,
  async listAccounts(): Promise<Account[]> {
    await latency();
    maybeFail('banking');
    return demoAccounts.map((a) => ({ ...a }));
  },
  async listTransactions(accountId?: string): Promise<Transaction[]> {
    await latency();
    maybeFail('banking.tx');
    const rows = demoTransactions.map((t) => ({ ...t }));
    return accountId ? rows.filter((t) => t.accountId === accountId) : rows;
  },
  async beginConsent() {
    await latency(300, 500);
    throw new IntegrationError(
      'Account connection requires a licensed open-banking provider. Nothing is connected in this prototype.',
      'consent_revoked',
      false,
    );
  },
};

/* --- Payments ------------------------------------------------------------- */

const paymentsDescriptor: ProviderDescriptor = {
  id: 'payments.demo',
  kind: 'payments',
  name: 'Nisos demo payments',
  operator: 'Nisos (prototype)',
  status: 'demo',
  auth: { type: 'demo' },
  capabilities: ['transfer.internal', 'transfer.sepa.simulate', 'qr.resolve', 'bill.pay.simulate'],
  note: 'No money moves. Transfers are written to the on-device demo ledger only.',
};

export const demoPaymentsAdapter: PaymentsPort = {
  descriptor: paymentsDescriptor,
  async quote({ amount, kind }) {
    await latency(200, 420);
    const fee = kind === 'sepa' ? 0 : 0;
    return {
      fee,
      total: amount + fee,
      arrival: kind === 'internal' ? 'Instantly' : 'Within 1 business day (SEPA)',
    };
  },
  async execute(input): Promise<Transaction> {
    await latency(700, 1200);
    maybeFail('payments');
    if (input.amount <= 0) throw new IntegrationError('Enter an amount above zero.', 'rejected');
    return {
      id: rid('tx'),
      accountId: input.accountId,
      merchant: input.payeeName,
      description: input.reference,
      amount: -Math.abs(input.amount),
      currency: 'EUR',
      date: new Date().toISOString(),
      category: input.kind === 'bill' ? 'utilities' : 'transfer',
      status: 'settled',
      method: input.kind === 'bill' ? 'sepa' : input.kind === 'internal' ? 'internal' : input.kind,
      reference: `NIS${Math.floor(100000 + Math.random() * 899999)}`,
      source: 'demo',
    };
  },
  async resolveQr(payload: string) {
    await latency(500, 900);
    maybeFail('payments.qr');
    // A real implementation parses an EMVCo / SEPA QR payload and verifies the
    // merchant against the acquirer. This demo maps to a fixed sample merchant.
    const merchants = [
      { merchant: 'Zorbas Bakery — Larnaca', merchantId: 'M-40182', amount: 6.4 },
      { merchant: 'Coastline Fitness', merchantId: 'M-22910', amount: 35 },
      { merchant: 'Petrolina Station 12', merchantId: 'M-71120', amount: 48.15 },
    ];
    const pick = merchants[Math.abs(payload.length) % merchants.length];
    return { ...pick, reference: 'Demo QR payload' };
  },
};

/* --- Government ----------------------------------------------------------- */

const governmentDescriptor: ProviderDescriptor = {
  id: 'government.catalogue',
  kind: 'government',
  name: 'Government service catalogue',
  operator: 'Nisos (prototype)',
  status: 'demo',
  auth: { type: 'demo' },
  capabilities: ['services.list', 'applications.simulate', 'deeplink'],
  note:
    'The catalogue describes publicly known services and links to official sites. ' +
    'No department API is connected; application tracking is simulated.',
};

export const demoGovernmentAdapter: GovernmentPort = {
  descriptor: governmentDescriptor,
  async listServices(): Promise<GovService[]> {
    await latency(220, 520);
    maybeFail('government');
    return govServices.map((s) => ({ ...s }));
  },
  async listApplications(): Promise<GovApplication[]> {
    await latency();
    return demoApplications.map((a) => ({ ...a }));
  },
  async submitApplication(serviceId: string): Promise<GovApplication> {
    await latency(900, 1400);
    maybeFail('government.submit');
    const svc = govServices.find((s) => s.id === serviceId);
    if (!svc) throw new IntegrationError('Unknown service.', 'rejected');
    if (svc.status === 'official-link') {
      throw new IntegrationError(
        'This service has no API yet. Continue on the official website.',
        'upstream_unavailable',
      );
    }
    const at = new Date().toISOString();
    return {
      id: rid('app'),
      serviceId,
      serviceName: svc.name,
      department: svc.department,
      state: 'submitted',
      submittedAt: at,
      updatedAt: at,
      reference: `DEMO-${serviceId.toUpperCase().slice(0, 6)}-${Math.floor(10000 + Math.random() * 89999)}`,
      timeline: [
        { label: 'Application submitted', at, done: true },
        { label: 'Under review', at: '', done: false },
        { label: 'Decision', at: '', done: false },
      ],
      source: 'demo',
    };
  },
};

/* --- Documents ------------------------------------------------------------ */

const documentsDescriptor: ProviderDescriptor = {
  id: 'documents.demo',
  kind: 'documents',
  name: 'On-device document vault',
  operator: 'Nisos (prototype)',
  status: 'demo',
  auth: { type: 'demo' },
  capabilities: ['vault.read', 'vault.write', 'expiry.track'],
  note: 'Prototype vault. Verification against an issuing register is not connected.',
};

export const demoDocumentsAdapter: DocumentsPort = {
  descriptor: documentsDescriptor,
  async list(): Promise<VaultDocument[]> {
    await latency();
    maybeFail('documents');
    return demoDocuments.map((d) => ({ ...d }));
  },
  async upload(input): Promise<VaultDocument> {
    await latency(800, 1400);
    maybeFail('documents.upload');
    return {
      id: rid('doc'),
      name: input.name,
      category: input.category as DocCategory,
      issuer: 'Uploaded by you',
      issuedAt: new Date().toISOString(),
      // Verification is a separate async step (see Vault.tsx) — a fresh
      // upload always starts pending, never pre-approved.
      verification: 'pending',
      fileType: input.fileType,
      sizeKb: input.sizeKb,
      encryption: 'aes-256-gcm-envelope',
      source: 'demo',
    };
  },
  async remove() {
    await latency(200, 400);
  },
};

/* --- Notifications -------------------------------------------------------- */

const notificationsDescriptor: ProviderDescriptor = {
  id: 'notifications.demo',
  kind: 'notifications',
  name: 'Local notification feed',
  operator: 'Nisos (prototype)',
  status: 'demo',
  auth: { type: 'none' },
  capabilities: ['feed.read'],
  note: 'Push delivery requires a configured push service and department feeds.',
};

export const demoNotificationsAdapter: NotificationsPort = {
  descriptor: notificationsDescriptor,
  async list(): Promise<AppNotification[]> {
    await latency(160, 360);
    return demoNotifications.map((n) => ({ ...n }));
  },
};

/* --- Analytics ------------------------------------------------------------ */

const analyticsDescriptor: ProviderDescriptor = {
  id: 'analytics.noop',
  kind: 'analytics',
  name: 'No-op analytics',
  operator: 'Nisos (prototype)',
  status: 'demo',
  auth: { type: 'none' },
  capabilities: ['event.track'],
  note: 'Events are logged to the console only. Nothing leaves the device.',
};

export const demoAnalyticsAdapter: AnalyticsPort = {
  descriptor: analyticsDescriptor,
  track(event, props) {
    if (import.meta.env.DEV) console.debug('[analytics:noop]', event, props ?? {});
  },
};
