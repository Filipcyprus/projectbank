/* ---------------------------------------------------------------------------
 * Nisos integration layer — contracts
 *
 * The UI never talks to a government department, a bank or a payment scheme
 * directly. It talks to a *port* (the interfaces below). A port is fulfilled by
 * an *adapter*, and every adapter must declare, honestly, what it actually is:
 *
 *   official-api   a signed agreement + live credentials exist; real calls
 *   official-link  no API; we deep-link the citizen to the official website
 *   coming-soon    agreement in progress / adapter written but not enabled
 *   demo           simulated data for this prototype. Never leaves the device.
 *
 * `IntegrationStatus` is rendered next to every service in the product, so a
 * mislabelled adapter is a product bug, not a cosmetic one.
 * ------------------------------------------------------------------------- */

export type IntegrationStatus = 'official-api' | 'official-link' | 'coming-soon' | 'demo';

export type ProviderKind =
  | 'identity'
  | 'banking'
  | 'payments'
  | 'government'
  | 'documents'
  | 'notifications'
  | 'analytics';

/** How an adapter authenticates. Nisos never accepts or stores a bank password. */
export type AuthMethod =
  | { type: 'none' }
  | { type: 'demo' }
  | {
      type: 'oidc';
      issuer: string;
      clientId: string;
      redirectUri: string;
      scopes: string[];
      /** PKCE is mandatory for public clients. */
      pkce: true;
    }
  | {
      type: 'oauth2-authorization-code';
      authorizationUrl: string;
      tokenUrl: string;
      clientId: string;
      redirectUri: string;
      scopes: string[];
      pkce: true;
    }
  | {
      /** Server-to-server. Credentials live in the Nisos gateway, never on device. */
      type: 'gateway-mtls';
      gatewayUrl: string;
    };

export interface ProviderDescriptor {
  id: string;
  kind: ProviderKind;
  /** Display name of the counterparty (department, bank, PSP...). */
  name: string;
  /** Legal/organisational owner of the endpoint. */
  operator: string;
  status: IntegrationStatus;
  auth: AuthMethod;
  /** Capability strings the UI can feature-detect on, e.g. 'accounts.read'. */
  capabilities: string[];
  /** Public website the citizen can always fall back to. */
  website?: string;
  /** Populated only when status === 'official-api'. */
  apiBaseUrl?: string;
  /** Why the integration is not live yet — shown in the admin console. */
  note?: string;
  /** Data-protection basis recorded for the register of processing activities. */
  lawfulBasis?: string;
}

export class NotConfiguredError extends Error {
  constructor(public providerId: string) {
    super(
      `Integration "${providerId}" has no live configuration. ` +
        `Nisos will not simulate a real integration — connect credentials in the admin console.`,
    );
    this.name = 'NotConfiguredError';
  }
}

export class IntegrationError extends Error {
  constructor(
    message: string,
    public code:
      | 'network'
      | 'auth_expired'
      | 'consent_revoked'
      | 'rate_limited'
      | 'upstream_unavailable'
      | 'insufficient_funds'
      | 'rejected',
    public retryable = false,
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}

/* --- Domain models -------------------------------------------------------- */

export type Currency = 'EUR';

export interface Money {
  amount: number; // minor-unit safe: stored in cents by the ledger, euros in UI models
  currency: Currency;
}

export type AccountType = 'current' | 'savings' | 'card' | 'investment' | 'external';

export interface Account {
  id: string;
  type: AccountType;
  name: string;
  institution: string;
  institutionId: string;
  iban?: string;
  maskedNumber?: string;
  balance: number;
  available?: number;
  currency: Currency;
  /** Where this balance came from — drives the badge on every account row. */
  source: IntegrationStatus;
  connectedAt?: string;
  /** PSD2 consents expire (usually 90 days) and must be re-authorised. */
  consentExpiresAt?: string;
  color?: string;
  /** True for the one account every citizen is required by law to hold — cannot be removed. */
  mandatory?: boolean;
}

export type TxCategory =
  | 'income'
  | 'groceries'
  | 'dining'
  | 'transport'
  | 'utilities'
  | 'government'
  | 'health'
  | 'shopping'
  | 'entertainment'
  | 'housing'
  | 'transfer'
  | 'other';

export interface Transaction {
  id: string;
  accountId: string;
  merchant: string;
  description?: string;
  amount: number; // negative = money out
  currency: Currency;
  date: string; // ISO
  category: TxCategory;
  status: 'settled' | 'pending' | 'failed';
  method?: 'card' | 'sepa' | 'qr' | 'direct-debit' | 'internal';
  reference?: string;
  source: IntegrationStatus;
}

export interface Payee {
  id: string;
  name: string;
  handle?: string; // phone / Nisos tag
  iban?: string;
  bank?: string;
  favourite?: boolean;
  lastPaid?: string;
}

export interface Bill {
  id: string;
  name: string;
  issuer: string;
  amount: number;
  currency: Currency;
  dueDate: string;
  status: 'due' | 'scheduled' | 'paid' | 'overdue';
  autopay?: boolean;
  category: TxCategory;
  serviceId?: string;
  source: IntegrationStatus;
}

export type GovCategory =
  | 'personal'
  | 'tax'
  | 'social'
  | 'vehicles'
  | 'health'
  | 'business'
  | 'other';

export interface GovService {
  id: string;
  category: GovCategory;
  name: string;
  department: string;
  description: string;
  status: IntegrationStatus;
  /** Official public entry point. Always present so the citizen is never stuck. */
  website?: string;
  requiredDocuments: string[];
  /** Statutory fee in EUR, 0 for free services. Nisos never charges on top. */
  fee?: number;
  processingTime?: string;
  keywords: string[];
  providerId?: string;
}

export type ApplicationState =
  | 'draft'
  | 'submitted'
  | 'in-review'
  | 'action-required'
  | 'approved'
  | 'rejected';

export interface GovApplication {
  id: string;
  serviceId: string;
  serviceName: string;
  department: string;
  state: ApplicationState;
  submittedAt: string;
  updatedAt: string;
  reference: string;
  timeline: { label: string; at: string; done: boolean }[];
  source: IntegrationStatus;
}

export type DocCategory =
  | 'government'
  | 'banking'
  | 'insurance'
  | 'education'
  | 'employment'
  | 'vehicles'
  | 'property'
  | 'business';

/**
 * A signature applied on this device. This is a hash + timestamp binding,
 * not a qualified electronic signature (QES) under eIDAS — it proves the
 * document record wasn't altered on this device after signing, not the
 * signer's legal identity to a third party. See docs/INTEGRATIONS.md.
 */
export interface DocumentSignature {
  signedAt: string;
  signerName: string;
  method: 'pin' | 'biometric';
  /** SHA-256 of the document's metadata record, hex-encoded. */
  hash: string;
}

export interface VaultDocument {
  id: string;
  name: string;
  category: DocCategory;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
  verification: 'verified' | 'unverified' | 'expired' | 'pending' | 'needs-review';
  fileType: 'pdf' | 'image' | 'json-vc';
  sizeKb: number;
  /** Client-side envelope metadata. Bytes are encrypted before leaving the device. */
  encryption: 'aes-256-gcm-envelope';
  source: IntegrationStatus;
  signature?: DocumentSignature;
}

export type WalletCardKind =
  | 'id'
  | 'licence'
  | 'vehicle'
  | 'insurance'
  | 'certificate'
  | 'health'
  | 'membership'
  | 'ticket'
  | 'loyalty'
  | 'payment';

export interface WalletCard {
  id: string;
  kind: WalletCardKind;
  name: string;
  issuer: string;
  primaryValue?: string;
  fields: { k: string; v: string }[];
  expiresAt?: string;
  verifiable: boolean;
  source: IntegrationStatus;
}

export type NotificationStream = 'government' | 'money' | 'security' | 'documents';

export interface AppNotification {
  id: string;
  stream: NotificationStream;
  title: string;
  body: string;
  at: string;
  read: boolean;
  severity: 'info' | 'action' | 'warning' | 'success';
  action?: { label: string; route: string };
  source: IntegrationStatus;
}

export interface IdentityClaims {
  fullName: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
  idNumber: string; // civil registry number
  digitalIdNumber: string;
  issuedAt: string;
  expiresAt: string;
  assuranceLevel: 'low' | 'substantial' | 'high';
  verified: boolean;
  photoInitials: string;
}

/** A selective-disclosure presentation: only the ticked claims are released. */
export interface IdentityPresentation {
  id: string;
  createdAt: string;
  expiresAt: string;
  claims: Record<string, string | boolean>;
  audience: string;
  source: IntegrationStatus;
}

/* --- Ports ---------------------------------------------------------------- */

export interface IdentityPort {
  descriptor: ProviderDescriptor;
  getClaims(): Promise<IdentityClaims>;
  /** Runs the assurance flow. Real adapters redirect to an OIDC authorize URL. */
  verify(level: 'substantial' | 'high'): Promise<{ ok: boolean; assurance: string }>;
  createPresentation(selected: string[], audience: string): Promise<IdentityPresentation>;
}

export interface BankingPort {
  descriptor: ProviderDescriptor;
  listAccounts(): Promise<Account[]>;
  listTransactions(accountId?: string): Promise<Transaction[]>;
  /** Starts the PSD2 consent journey. Returns the URL the citizen must approve. */
  beginConsent(institutionId: string): Promise<{ authorizationUrl: string; state: string }>;
}

export interface PaymentsPort {
  descriptor: ProviderDescriptor;
  quote(input: { amount: number; payee: string; kind: 'sepa' | 'qr' | 'internal' }): Promise<{
    fee: number;
    total: number;
    arrival: string;
  }>;
  execute(input: {
    amount: number;
    payeeId?: string;
    payeeName: string;
    kind: 'sepa' | 'qr' | 'internal' | 'bill';
    reference?: string;
    accountId: string;
  }): Promise<Transaction>;
  resolveQr(payload: string): Promise<{ merchant: string; merchantId: string; amount?: number; reference?: string }>;
}

export interface GovernmentPort {
  descriptor: ProviderDescriptor;
  listServices(): Promise<GovService[]>;
  listApplications(): Promise<GovApplication[]>;
  submitApplication(serviceId: string): Promise<GovApplication>;
}

export interface DocumentsPort {
  descriptor: ProviderDescriptor;
  list(): Promise<VaultDocument[]>;
  upload(input: { name: string; category: DocCategory; sizeKb: number; fileType: VaultDocument['fileType'] }): Promise<VaultDocument>;
  remove(id: string): Promise<void>;
}

export interface NotificationsPort {
  descriptor: ProviderDescriptor;
  list(): Promise<AppNotification[]>;
}

export interface AnalyticsPort {
  descriptor: ProviderDescriptor;
  /** Privacy-preserving: event names only, no identifiers, no amounts. */
  track(event: string, props?: Record<string, string | number | boolean>): void;
}

export interface PortMap {
  identity: IdentityPort;
  banking: BankingPort;
  payments: PaymentsPort;
  government: GovernmentPort;
  documents: DocumentsPort;
  notifications: NotificationsPort;
  analytics: AnalyticsPort;
}
