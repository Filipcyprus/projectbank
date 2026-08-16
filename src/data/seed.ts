/* ---------------------------------------------------------------------------
 * DEMO DATA — every record here is invented for the prototype.
 *
 * Nothing in this file comes from a bank, a ministry or any real person. It is
 * only ever served through adapters whose status is `demo`, so it always
 * reaches the UI carrying a "Demo" badge.
 * ------------------------------------------------------------------------- */

import type {
  Account,
  AppNotification,
  Bill,
  GovApplication,
  GovService,
  IdentityClaims,
  Payee,
  Transaction,
  VaultDocument,
  WalletCard,
} from '../integrations/types';

/** Dates are generated relative to today so the prototype never looks stale. */
const now = new Date();
export const iso = (dayOffset: number, hour = 10, minute = 0): string => {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
const isoY = (yearOffset: number, month: number, day: number): string => {
  const d = new Date(now.getFullYear() + yearOffset, month - 1, day, 12);
  return d.toISOString();
};

export const demoIdentity: IdentityClaims = {
  fullName: 'Filip Andreou',
  givenName: 'Filip',
  familyName: 'Andreou',
  dateOfBirth: '1994-04-18',
  nationality: 'Cypriot',
  idNumber: '••••••42',
  digitalIdNumber: 'NIS-CY-4820-7731',
  issuedAt: isoY(-1, 3, 12),
  expiresAt: isoY(4, 3, 12),
  assuranceLevel: 'substantial',
  verified: true,
  photoInitials: 'FA',
};

export const demoAccounts: Account[] = [
  {
    id: 'acc_current',
    type: 'current',
    name: 'Everyday account',
    institution: 'Nisos (demo ledger)',
    institutionId: 'nisos',
    iban: 'CY•• •••• •••• •••• •••• 4471',
    balance: 3184.4,
    available: 3184.4,
    currency: 'EUR',
    source: 'demo',
    color: 'var(--c1)',
  },
  {
    id: 'acc_savings',
    type: 'savings',
    name: 'Savings pocket',
    institution: 'Nisos (demo ledger)',
    institutionId: 'nisos',
    balance: 940.0,
    currency: 'EUR',
    source: 'demo',
    color: 'var(--c3)',
  },
  {
    id: 'acc_card',
    type: 'card',
    name: 'Nisos card',
    institution: 'Nisos (demo ledger)',
    institutionId: 'nisos',
    maskedNumber: '•••• 8842',
    balance: -73.6,
    currency: 'EUR',
    source: 'demo',
    color: 'var(--c2)',
  },
  {
    id: 'acc_invest',
    type: 'investment',
    name: 'Index portfolio',
    institution: 'Nisos (demo ledger)',
    institutionId: 'nisos',
    balance: 200.0,
    currency: 'EUR',
    source: 'demo',
    color: 'var(--c4)',
  },
];

type TxSeed = [string, number, Transaction['category'], number, Transaction['method'], string?];

const txSeed: TxSeed[] = [
  ['Salary — Meridian Labs Ltd', 2100, 'income', 0, 'sepa', 'acc_current'],
  ['Alphamega Supermarket', -54.2, 'groceries', 0, 'card'],
  ['Netflix', -12.99, 'entertainment', -1, 'card'],
  ['Gloria Jean’s Coffees', -3.6, 'dining', -1, 'card'],
  ['EAC — electricity', -86.4, 'utilities', -2, 'direct-debit'],
  ['Cyta mobile', -21.0, 'utilities', -2, 'direct-debit'],
  ['Petrolina fuel', -48.15, 'transport', -3, 'card'],
  ['Road tax (Dept. of Road Transport)', -156.0, 'government', -4, 'sepa'],
  ['Public Nicosia', -31.95, 'shopping', -5, 'card'],
  ['Zorbas bakery', -6.4, 'dining', -5, 'card'],
  ['To savings pocket', -200, 'transfer', -6, 'internal'],
  ['Pharmacy Kyprianou', -14.3, 'health', -6, 'card'],
  ['Uber', -9.8, 'transport', -7, 'card'],
  ['Rent — Larnaca apartment', -720, 'housing', -8, 'sepa'],
  ['Water Board Larnaca', -28.7, 'utilities', -9, 'direct-debit'],
  ['Spotify', -10.99, 'entertainment', -10, 'card'],
  ['Andreas M. — split dinner', 24.0, 'transfer', -10, 'internal'],
  ['Lidl Larnaca', -47.85, 'groceries', -11, 'card'],
  ['GHS co-payment — Dr. Christodoulou', -6.0, 'health', -12, 'card'],
  ['Kiosk Faneromeni', -4.2, 'dining', -12, 'card'],
  ['Amazon.de', -63.4, 'shopping', -13, 'card'],
  ['Salary — Meridian Labs Ltd', 2100, 'income', -30, 'sepa'],
  ['Social insurance — self-employed top-up', -92.0, 'government', -15, 'sepa'],
  ['Alphamega Supermarket', -61.1, 'groceries', -16, 'card'],
  ['Cinema Rio', -16.0, 'entertainment', -17, 'card'],
  ['Bolt', -7.4, 'transport', -18, 'card'],
  ['Coffee Berry', -3.9, 'dining', -19, 'card'],
  ['Home insurance — Aegean Cover', -38.5, 'housing', -20, 'direct-debit'],
  ['Sklavenitis', -52.3, 'groceries', -21, 'card'],
  ['Booking.com', -128.0, 'shopping', -23, 'card'],
];

export const demoTransactions: Transaction[] = txSeed.map((t, i) => {
  const [merchant, amount, category, day, method, accountId] = t;
  return {
    id: `tx_${String(i).padStart(3, '0')}`,
    accountId: accountId ?? (method === 'card' ? 'acc_card' : 'acc_current'),
    merchant,
    amount,
    currency: 'EUR',
    date: iso(day, 9 + (i % 9), (i * 7) % 60),
    category,
    status: i === 1 ? 'pending' : 'settled',
    method,
    reference: `NIS${(920000 + i * 37).toString()}`,
    source: 'demo',
  };
});

export const demoPayees: Payee[] = [
  { id: 'p1', name: 'Andreas Michael', handle: '@andreasm', bank: 'Nisos', favourite: true, lastPaid: iso(-10) },
  { id: 'p2', name: 'Maria Georgiou', handle: '@mariag', bank: 'Nisos', favourite: true, lastPaid: iso(-24) },
  { id: 'p3', name: 'Elena Papadopoulou', handle: '@elenap', bank: 'External bank', lastPaid: iso(-41) },
  { id: 'p4', name: 'Kyriakos Stavrou', iban: 'CY•• •••• •••• •••• 1182', bank: 'External bank' },
  { id: 'p5', name: 'Larnaca Property Management', iban: 'CY•• •••• •••• •••• 7730', bank: 'External bank', lastPaid: iso(-8) },
];

export const demoBills: Bill[] = [
  {
    id: 'b1',
    name: 'Road tax 2026',
    issuer: 'Department of Road Transport',
    amount: 156.0,
    currency: 'EUR',
    dueDate: iso(46),
    status: 'due',
    category: 'government',
    serviceId: 'veh-road-tax',
    source: 'demo',
  },
  {
    id: 'b2',
    name: 'Electricity — August',
    issuer: 'Electricity Authority',
    amount: 86.4,
    currency: 'EUR',
    dueDate: iso(9),
    status: 'scheduled',
    autopay: true,
    category: 'utilities',
    source: 'demo',
  },
  {
    id: 'b3',
    name: 'Mobile plan',
    issuer: 'Telecom provider',
    amount: 21.0,
    currency: 'EUR',
    dueDate: iso(4),
    status: 'due',
    category: 'utilities',
    source: 'demo',
  },
  {
    id: 'b4',
    name: 'Home insurance',
    issuer: 'Aegean Cover',
    amount: 38.5,
    currency: 'EUR',
    dueDate: iso(19),
    status: 'scheduled',
    autopay: true,
    category: 'housing',
    source: 'demo',
  },
  {
    id: 'b5',
    name: 'Water bill — Q2',
    issuer: 'Water Board',
    amount: 28.7,
    currency: 'EUR',
    dueDate: iso(-3),
    status: 'overdue',
    category: 'utilities',
    source: 'demo',
  },
  {
    id: 'b6',
    name: 'Municipality refuse fee',
    issuer: 'Municipality',
    amount: 68.0,
    currency: 'EUR',
    dueDate: iso(-21),
    status: 'paid',
    category: 'government',
    source: 'demo',
  },
];

/* --- Government service catalogue ----------------------------------------
 * These entries describe *publicly known* Cyprus government services so the
 * directory is useful. None of them is wired to an API in this prototype:
 * every one carries `official-link` (we can only send you to the official
 * site) or `coming-soon` (adapter designed, agreement required).
 * ------------------------------------------------------------------------ */

export const govServices: GovService[] = [
  // Personal ---------------------------------------------------------------
  { id: 'per-civil-registry', category: 'personal', name: 'Civil registry record', department: 'Civil Registry and Migration Department', description: 'View your civil registry record, request corrections and check the status of registry applications.', status: 'coming-soon', website: 'https://www.moi.gov.cy/crmd', requiredDocuments: ['Identity document'], fee: 0, processingTime: 'Varies', keywords: ['civil', 'registry', 'record', 'population'] },
  { id: 'per-id-card', category: 'personal', name: 'Identity card issue or renewal', department: 'Civil Registry and Migration Department', description: 'Apply for a first identity card, renew an expiring card or replace a lost one. Biometric appointment required in person.', status: 'official-link', website: 'https://www.gov.cy', requiredDocuments: ['Birth certificate', 'Photograph', 'Previous ID (if renewal)'], fee: 30, processingTime: '10–20 working days', keywords: ['id', 'identity', 'card', 'renew', 'taftotita'] },
  { id: 'per-passport', category: 'personal', name: 'Passport application', department: 'Civil Registry and Migration Department', description: 'Apply for or renew a Cypriot passport and track the issuing status.', status: 'official-link', website: 'https://www.gov.cy', requiredDocuments: ['Identity card', 'Photograph', 'Previous passport'], fee: 70, processingTime: '10–15 working days', keywords: ['passport', 'travel', 'diavatirio'] },
  { id: 'per-birth-cert', category: 'personal', name: 'Birth certificate', department: 'Civil Registry and Migration Department', description: 'Request an official copy of a birth certificate for yourself or a dependent child.', status: 'coming-soon', website: 'https://www.gov.cy', requiredDocuments: ['Identity document', 'Parent details'], fee: 5, processingTime: '3–7 working days', keywords: ['birth', 'certificate', 'child', 'pistopoiitiko'] },
  { id: 'per-marriage-cert', category: 'personal', name: 'Marriage certificate', department: 'Municipalities / Civil Registry', description: 'Request a certified copy of a marriage certificate, or a certificate of no impediment.', status: 'coming-soon', website: 'https://www.gov.cy', requiredDocuments: ['Identity document', 'Marriage details'], fee: 5, processingTime: '3–7 working days', keywords: ['marriage', 'wedding', 'certificate', 'gamos'] },
  { id: 'per-residence', category: 'personal', name: 'Residence information and certificates', department: 'Civil Registry and Migration Department', description: 'Registration certificates for EU citizens (MEU1), residence permits and proof of permanent residence.', status: 'official-link', website: 'https://www.moi.gov.cy/crmd', requiredDocuments: ['Identity document', 'Proof of address', 'Employment or means evidence'], fee: 20, processingTime: '4–8 weeks', keywords: ['residence', 'permit', 'meu1', 'yellow slip', 'address'] },
  { id: 'per-criminal-record', category: 'personal', name: 'Criminal record certificate', department: 'Cyprus Police', description: 'Request a certificate of criminal record (clean record certificate) for employment or immigration purposes.', status: 'coming-soon', website: 'https://www.police.gov.cy', requiredDocuments: ['Identity document'], fee: 20, processingTime: '3–5 working days', keywords: ['criminal', 'record', 'police', 'clean', 'certificate'] },
  { id: 'per-name-change', category: 'personal', name: 'Change of name or surname', department: 'Civil Registry and Migration Department', description: 'Submit an application to change a registered name or surname in the civil registry.', status: 'coming-soon', website: 'https://www.gov.cy', requiredDocuments: ['Identity document', 'Supporting declaration'], fee: 15, processingTime: '4–8 weeks', keywords: ['name', 'surname', 'change'] },

  // Tax --------------------------------------------------------------------
  { id: 'tax-portal', category: 'tax', name: 'Tax portal account', department: 'Tax Department', description: 'Your taxpayer profile, registration details and linked tax identification number.', status: 'coming-soon', website: 'https://www.mof.gov.cy/tax', requiredDocuments: ['Tax identification number'], fee: 0, keywords: ['tax', 'portal', 'tic', 'taxisnet', 'account'] },
  { id: 'tax-return', category: 'tax', name: 'Personal income tax return', department: 'Tax Department', description: 'Prepare and submit the annual personal income tax return, with income and deduction summaries carried over.', status: 'coming-soon', website: 'https://www.mof.gov.cy/tax', requiredDocuments: ['Employer certificate', 'Receipts for deductions'], fee: 0, processingTime: 'Assessment within weeks', keywords: ['tax', 'return', 'income', 'ir1', 'declaration'] },
  { id: 'tax-payments', category: 'tax', name: 'Tax payments', department: 'Tax Department', description: 'Pay assessed income tax, temporary tax instalments and outstanding balances.', status: 'coming-soon', website: 'https://www.mof.gov.cy/tax', requiredDocuments: ['Assessment reference'], fee: 0, keywords: ['tax', 'pay', 'payment', 'instalment'] },
  { id: 'tax-certificate', category: 'tax', name: 'Tax clearance certificate', department: 'Tax Department', description: 'Request a tax residency or tax clearance certificate for banks, tenders and foreign authorities.', status: 'coming-soon', website: 'https://www.mof.gov.cy/tax', requiredDocuments: ['Taxpayer details'], fee: 0, processingTime: '5–10 working days', keywords: ['tax', 'certificate', 'clearance', 'residency'] },
  { id: 'tax-vat', category: 'tax', name: 'VAT registration and returns', department: 'Tax Department — VAT Service', description: 'Register for VAT, submit periodic VAT returns and view VAT liabilities.', status: 'coming-soon', website: 'https://www.mof.gov.cy/tax', requiredDocuments: ['Company registration', 'Turnover evidence'], fee: 0, keywords: ['vat', 'fpa', 'return', 'business tax'] },
  { id: 'tax-notifications', category: 'tax', name: 'Tax notifications', department: 'Tax Department', description: 'Assessments, reminders and correspondence from the Tax Department in one inbox.', status: 'coming-soon', requiredDocuments: [], fee: 0, keywords: ['tax', 'notice', 'assessment', 'letter'] },

  // Social insurance -------------------------------------------------------
  { id: 'soc-account', category: 'social', name: 'Social insurance account', department: 'Social Insurance Services', description: 'Your social insurance number, insurable earnings history and contribution status.', status: 'coming-soon', website: 'https://www.mlsi.gov.cy/sid', requiredDocuments: ['Social insurance number'], fee: 0, keywords: ['social', 'insurance', 'sid', 'contributions'] },
  { id: 'soc-contributions', category: 'social', name: 'Contribution statement', department: 'Social Insurance Services', description: 'Download a certified statement of contributions by year and employer.', status: 'coming-soon', website: 'https://www.mlsi.gov.cy/sid', requiredDocuments: ['Identity document'], fee: 0, processingTime: 'Immediate once integrated', keywords: ['contributions', 'statement', 'insurable', 'earnings'] },
  { id: 'soc-benefits', category: 'social', name: 'Benefits and allowances', department: 'Social Insurance Services', description: 'Unemployment, sickness, maternity, paternity and other benefit entitlements.', status: 'official-link', website: 'https://www.mlsi.gov.cy/sid', requiredDocuments: ['Identity document', 'Supporting evidence'], fee: 0, keywords: ['benefit', 'unemployment', 'sickness', 'maternity', 'allowance'] },
  { id: 'soc-applications', category: 'social', name: 'Benefit applications', department: 'Social Insurance Services', description: 'Start a benefit application, upload evidence and follow the decision.', status: 'coming-soon', requiredDocuments: ['Identity document', 'Employer statement'], fee: 0, keywords: ['apply', 'benefit', 'application'] },
  { id: 'soc-pension', category: 'social', name: 'Pension estimate', department: 'Social Insurance Services', description: 'Estimate the statutory pension based on recorded contributions.', status: 'coming-soon', requiredDocuments: [], fee: 0, keywords: ['pension', 'retirement', 'estimate'] },

  // Vehicles ---------------------------------------------------------------
  { id: 'veh-info', category: 'vehicles', name: 'Vehicle information', department: 'Department of Road Transport', description: 'Registered vehicles, registration marks, technical details and ownership record.', status: 'coming-soon', website: 'https://www.rtd.mcw.gov.cy', requiredDocuments: ['Registration number'], fee: 0, keywords: ['vehicle', 'car', 'registration', 'ownership'] },
  { id: 'veh-road-tax', category: 'vehicles', name: 'Road tax', department: 'Department of Road Transport', description: 'Check and pay annual road tax for each registered vehicle, with expiry reminders.', status: 'official-link', website: 'https://www.jccsmart.com', requiredDocuments: ['Registration number', 'Valid MOT', 'Valid insurance'], fee: 0, processingTime: 'Immediate', keywords: ['road tax', 'circulation', 'kykloforias', 'pay', 'car'] },
  { id: 'veh-licence', category: 'vehicles', name: 'Driving licence', department: 'Department of Road Transport', description: 'Renew a driving licence, replace a lost licence or view categories and endorsements.', status: 'official-link', website: 'https://www.rtd.mcw.gov.cy', requiredDocuments: ['Identity document', 'Medical certificate (over 70)', 'Photograph'], fee: 40, processingTime: '5–15 working days', keywords: ['driving', 'licence', 'license', 'adeia odigisis'] },
  { id: 'veh-mot', category: 'vehicles', name: 'MOT / roadworthiness test', department: 'Department of Road Transport', description: 'MOT expiry date, booking at approved centres and certificate history.', status: 'coming-soon', website: 'https://www.rtd.mcw.gov.cy', requiredDocuments: ['Registration certificate'], fee: 0, keywords: ['mot', 'roadworthiness', 'test', 'inspection'] },
  { id: 'veh-registration', category: 'vehicles', name: 'Vehicle registration and transfer', department: 'Department of Road Transport', description: 'Register an imported vehicle or transfer ownership after a sale.', status: 'coming-soon', website: 'https://www.rtd.mcw.gov.cy', requiredDocuments: ['Proof of ownership', 'Customs clearance', 'Insurance'], fee: 0, keywords: ['transfer', 'register', 'import', 'ownership', 'sale'] },
  { id: 'veh-traffic', category: 'vehicles', name: 'Traffic fines', department: 'Cyprus Police', description: 'View outstanding traffic fines and pay them before the deadline.', status: 'official-link', website: 'https://www.police.gov.cy', requiredDocuments: ['Fine reference'], fee: 0, keywords: ['fine', 'ticket', 'penalty', 'traffic', 'speeding'] },
  { id: 'veh-points', category: 'vehicles', name: 'Penalty points', department: 'Cyprus Police', description: 'Current penalty points on the driving record and when they expire.', status: 'coming-soon', requiredDocuments: [], fee: 0, keywords: ['points', 'penalty', 'driving record'] },

  // Health -----------------------------------------------------------------
  { id: 'hea-ghs', category: 'health', name: 'GHS (GESY) beneficiary status', department: 'Health Insurance Organisation', description: 'General Healthcare System registration status, contribution category and beneficiary number.', status: 'official-link', website: 'https://www.gesy.org.cy', requiredDocuments: ['Identity document'], fee: 0, keywords: ['ghs', 'gesy', 'health', 'beneficiary', 'insurance'] },
  { id: 'hea-gp', category: 'health', name: 'Personal doctor', department: 'Health Insurance Organisation', description: 'View or change your registered personal doctor and see visit history.', status: 'coming-soon', website: 'https://www.gesy.org.cy', requiredDocuments: ['Beneficiary number'], fee: 0, keywords: ['doctor', 'gp', 'personal doctor', 'gesy'] },
  { id: 'hea-prescriptions', category: 'health', name: 'Prescriptions and referrals', department: 'Health Insurance Organisation', description: 'Active prescriptions, referrals to specialists and pharmacy dispensing records.', status: 'coming-soon', requiredDocuments: [], fee: 0, keywords: ['prescription', 'referral', 'pharmacy', 'medicine'] },
  { id: 'hea-ehic', category: 'health', name: 'European Health Insurance Card', department: 'Health Insurance Organisation', description: 'Apply for or renew the EHIC for healthcare while travelling in the EU.', status: 'coming-soon', website: 'https://www.gesy.org.cy', requiredDocuments: ['Identity document', 'GHS registration'], fee: 0, processingTime: '5–10 working days', keywords: ['ehic', 'european', 'health card', 'travel'] },
  { id: 'hea-vaccination', category: 'health', name: 'Vaccination records', department: 'Ministry of Health', description: 'Official vaccination history and digital certificates.', status: 'coming-soon', website: 'https://www.moh.gov.cy', requiredDocuments: [], fee: 0, keywords: ['vaccine', 'vaccination', 'immunisation', 'certificate'] },

  // Business ---------------------------------------------------------------
  { id: 'bus-company-reg', category: 'business', name: 'Company registration', department: 'Registrar of Companies and Intellectual Property', description: 'Register a company, reserve a name and file changes to company officers.', status: 'official-link', website: 'https://www.companies.gov.cy', requiredDocuments: ['Name approval', 'Memorandum and articles', 'Director details'], fee: 165, processingTime: '5–10 working days', keywords: ['company', 'register', 'ltd', 'business', 'incorporation'] },
  { id: 'bus-annual-return', category: 'business', name: 'Annual return (HE32)', department: 'Registrar of Companies', description: 'File the annual return and keep the company in good standing.', status: 'coming-soon', website: 'https://www.companies.gov.cy', requiredDocuments: ['Financial statements'], fee: 20, keywords: ['annual return', 'he32', 'filing', 'company'] },
  { id: 'bus-licences', category: 'business', name: 'Business licences and permits', department: 'Municipalities / Ministries', description: 'Operating licences, food business permits and signage permissions.', status: 'coming-soon', requiredDocuments: ['Premises details', 'Health inspection'], fee: 0, keywords: ['licence', 'permit', 'operating', 'business'] },
  { id: 'bus-employer', category: 'business', name: 'Employer services', department: 'Social Insurance Services', description: 'Register as an employer, submit employee contribution schedules and manage payroll declarations.', status: 'coming-soon', website: 'https://www.mlsi.gov.cy/sid', requiredDocuments: ['Employer registration number'], fee: 0, keywords: ['employer', 'payroll', 'employees', 'contributions'] },
  { id: 'bus-tax', category: 'business', name: 'Corporate tax', department: 'Tax Department', description: 'Corporate income tax returns, temporary assessments and payments.', status: 'coming-soon', website: 'https://www.mof.gov.cy/tax', requiredDocuments: ['Audited accounts'], fee: 0, keywords: ['corporate', 'tax', 'company', 'return'] },
  { id: 'bus-forms', category: 'business', name: 'Government forms library', department: 'Multiple departments', description: 'Searchable library of official forms with guidance on where to submit each one.', status: 'official-link', website: 'https://www.gov.cy', requiredDocuments: [], fee: 0, keywords: ['forms', 'documents', 'download', 'application'] },

  // Other ------------------------------------------------------------------
  { id: 'oth-land-registry', category: 'other', name: 'Land registry and property', department: 'Department of Lands and Surveys', description: 'Property ownership records, title deeds and immovable property tax information.', status: 'official-link', website: 'https://www.dls.moi.gov.cy', requiredDocuments: ['Identity document', 'Property reference'], fee: 0, keywords: ['land', 'property', 'title', 'deed', 'registry'] },
  { id: 'oth-education', category: 'other', name: 'Education certificates', department: 'Ministry of Education', description: 'School leaving certificates, apostille requests and recognition of foreign qualifications.', status: 'coming-soon', website: 'https://www.moec.gov.cy', requiredDocuments: ['Identity document', 'Original certificate'], fee: 0, keywords: ['school', 'education', 'diploma', 'apostille', 'kysats'] },
  { id: 'oth-municipality', category: 'other', name: 'Municipality services', department: 'Local municipalities', description: 'Refuse fees, professional tax, building permits and local certificates.', status: 'coming-soon', requiredDocuments: ['Address'], fee: 0, keywords: ['municipality', 'local', 'refuse', 'building permit'] },
  { id: 'oth-appointments', category: 'other', name: 'Government appointments', department: 'Multiple departments', description: 'Book, reschedule and get reminders for in-person appointments at government offices.', status: 'coming-soon', requiredDocuments: [], fee: 0, keywords: ['appointment', 'booking', 'queue', 'visit'] },
  { id: 'oth-post', category: 'other', name: 'Government correspondence', department: 'Multiple departments', description: 'Secure digital delivery of official letters and decisions.', status: 'coming-soon', requiredDocuments: [], fee: 0, keywords: ['letter', 'post', 'correspondence', 'message'] },
];

export const demoApplications: GovApplication[] = [
  {
    id: 'app1',
    serviceId: 'per-criminal-record',
    serviceName: 'Criminal record certificate',
    department: 'Cyprus Police',
    state: 'approved',
    submittedAt: iso(-12),
    updatedAt: iso(-2),
    reference: 'DEMO-CRC-88213',
    timeline: [
      { label: 'Application submitted', at: iso(-12), done: true },
      { label: 'Documents checked', at: iso(-9), done: true },
      { label: 'Decision issued', at: iso(-2), done: true },
    ],
    source: 'demo',
  },
  {
    id: 'app2',
    serviceId: 'veh-licence',
    serviceName: 'Driving licence renewal',
    department: 'Department of Road Transport',
    state: 'action-required',
    submittedAt: iso(-6),
    updatedAt: iso(-1),
    reference: 'DEMO-DL-40917',
    timeline: [
      { label: 'Application submitted', at: iso(-6), done: true },
      { label: 'Photograph rejected — resubmit', at: iso(-1), done: true },
      { label: 'Decision', at: '', done: false },
    ],
    source: 'demo',
  },
  {
    id: 'app3',
    serviceId: 'soc-contributions',
    serviceName: 'Contribution statement',
    department: 'Social Insurance Services',
    state: 'in-review',
    submittedAt: iso(-3),
    updatedAt: iso(-3),
    reference: 'DEMO-SIS-12048',
    timeline: [
      { label: 'Request submitted', at: iso(-3), done: true },
      { label: 'Under review', at: iso(-3), done: true },
      { label: 'Statement issued', at: '', done: false },
    ],
    source: 'demo',
  },
];

export const demoDocuments: VaultDocument[] = [
  { id: 'd1', name: 'Identity card (scan)', category: 'government', issuer: 'Civil Registry', issuedAt: isoY(-4, 6, 2), expiresAt: isoY(6, 6, 2), verification: 'verified', fileType: 'pdf', sizeKb: 820, encryption: 'aes-256-gcm-envelope', source: 'demo' },
  { id: 'd2', name: 'Driving licence', category: 'vehicles', issuer: 'Department of Road Transport', issuedAt: isoY(-9, 2, 14), expiresAt: iso(58), verification: 'verified', fileType: 'pdf', sizeKb: 410, encryption: 'aes-256-gcm-envelope', source: 'demo' },
  { id: 'd3', name: 'Vehicle registration — KAB 1234', category: 'vehicles', issuer: 'Department of Road Transport', issuedAt: isoY(-3, 8, 30), verification: 'verified', fileType: 'pdf', sizeKb: 260, encryption: 'aes-256-gcm-envelope', source: 'demo' },
  { id: 'd4', name: 'Motor insurance certificate', category: 'insurance', issuer: 'Aegean Cover', issuedAt: iso(-280), expiresAt: iso(85), verification: 'verified', fileType: 'pdf', sizeKb: 190, encryption: 'aes-256-gcm-envelope', source: 'demo' },
  { id: 'd5', name: 'Employment contract', category: 'employment', issuer: 'Meridian Labs Ltd', issuedAt: isoY(-2, 1, 9), verification: 'unverified', fileType: 'pdf', sizeKb: 340, encryption: 'aes-256-gcm-envelope', source: 'demo' },
  { id: 'd6', name: 'University degree', category: 'education', issuer: 'University of Cyprus', issuedAt: isoY(-6, 7, 5), verification: 'verified', fileType: 'pdf', sizeKb: 1240, encryption: 'aes-256-gcm-envelope', source: 'demo' },
  { id: 'd7', name: 'Rental agreement', category: 'property', issuer: 'Larnaca Property Management', issuedAt: isoY(-1, 9, 1), expiresAt: iso(12), verification: 'unverified', fileType: 'pdf', sizeKb: 520, encryption: 'aes-256-gcm-envelope', source: 'demo' },
  { id: 'd8', name: 'Bank statement — Q2', category: 'banking', issuer: 'Nisos demo ledger', issuedAt: iso(-45), verification: 'verified', fileType: 'pdf', sizeKb: 160, encryption: 'aes-256-gcm-envelope', source: 'demo' },
  { id: 'd9', name: 'Health insurance card copy', category: 'insurance', issuer: 'Health Insurance Organisation', issuedAt: isoY(-5, 4, 22), verification: 'pending', fileType: 'image', sizeKb: 640, encryption: 'aes-256-gcm-envelope', source: 'demo' },
  { id: 'd10', name: 'Company registration certificate', category: 'business', issuer: 'Registrar of Companies', issuedAt: isoY(-2, 11, 3), verification: 'verified', fileType: 'pdf', sizeKb: 300, encryption: 'aes-256-gcm-envelope', source: 'demo' },
];

export const demoWalletCards: WalletCard[] = [
  { id: 'w1', kind: 'id', name: 'Digital ID', issuer: 'Nisos (demo credential)', primaryValue: 'NIS-CY-4820-7731', fields: [{ k: 'Holder', v: 'Filip Andreou' }, { k: 'Assurance', v: 'Substantial' }], expiresAt: isoY(4, 3, 12), verifiable: true, source: 'demo' },
  { id: 'w2', kind: 'licence', name: 'Driving licence', issuer: 'Department of Road Transport', primaryValue: 'B, AM', fields: [{ k: 'Categories', v: 'B, AM' }, { k: 'Issued', v: '14.02.2017' }], expiresAt: iso(58), verifiable: false, source: 'demo' },
  { id: 'w3', kind: 'vehicle', name: 'Vehicle — KAB 1234', issuer: 'Department of Road Transport', primaryValue: 'KAB 1234', fields: [{ k: 'Make', v: 'Toyota Yaris' }, { k: 'MOT', v: 'Valid' }], expiresAt: iso(46), verifiable: false, source: 'demo' },
  { id: 'w4', kind: 'insurance', name: 'Motor insurance', issuer: 'Aegean Cover', primaryValue: 'POL-77120', fields: [{ k: 'Cover', v: 'Comprehensive' }, { k: 'Vehicle', v: 'KAB 1234' }], expiresAt: iso(85), verifiable: false, source: 'demo' },
  { id: 'w5', kind: 'health', name: 'GHS beneficiary', issuer: 'Health Insurance Organisation', primaryValue: '•••• 4471', fields: [{ k: 'Personal doctor', v: 'Dr. A. Christodoulou' }], verifiable: false, source: 'demo' },
  { id: 'w6', kind: 'certificate', name: 'Criminal record certificate', issuer: 'Cyprus Police', primaryValue: 'DEMO-CRC-88213', fields: [{ k: 'Issued', v: 'This month' }], expiresAt: iso(88), verifiable: true, source: 'demo' },
  { id: 'w7', kind: 'payment', name: 'Nisos card', issuer: 'Nisos', primaryValue: '•••• 8842', fields: [{ k: 'Type', v: 'Virtual debit' }, { k: 'Status', v: 'Active' }], verifiable: false, source: 'demo' },
  { id: 'w8', kind: 'loyalty', name: 'Alphamega loyalty', issuer: 'Retail partner', primaryValue: '9012 4471 8830', fields: [{ k: 'Points', v: '1,240' }], verifiable: false, source: 'demo' },
  { id: 'w9', kind: 'ticket', name: 'Bus pass — Larnaca', issuer: 'Public transport operator', primaryValue: 'Monthly', fields: [{ k: 'Zone', v: 'Urban' }], expiresAt: iso(16), verifiable: false, source: 'demo' },
  { id: 'w10', kind: 'membership', name: 'Gym membership', issuer: 'Coastline Fitness', primaryValue: 'M-2281', fields: [{ k: 'Plan', v: 'Annual' }], expiresAt: iso(122), verifiable: false, source: 'demo' },
];

export const demoNotifications: AppNotification[] = [
  { id: 'n1', stream: 'government', title: 'Road tax expires in 46 days', body: 'Road tax for KAB 1234 is due on 30 September. You can pay it through the official portal.', at: iso(0, 8, 12), read: false, severity: 'warning', action: { label: 'Open road tax', route: '#/gov/service/veh-road-tax' }, source: 'demo' },
  { id: 'n2', stream: 'government', title: 'Application needs your attention', body: 'The photograph submitted with your driving licence renewal was rejected. Upload a new one.', at: iso(-1, 16, 40), read: false, severity: 'action', action: { label: 'View application', route: '#/gov/applications' }, source: 'demo' },
  { id: 'n3', stream: 'money', title: 'Payment completed', body: 'You paid €54.20 to Alphamega Supermarket.', at: iso(0, 18, 5), read: true, severity: 'success', source: 'demo' },
  { id: 'n4', stream: 'security', title: 'New device signed in', body: 'A sign-in from iPhone 15 Pro in Larnaca was approved with biometrics.', at: iso(-2, 21, 2), read: true, severity: 'info', action: { label: 'Review devices', route: '#/security/devices' }, source: 'demo' },
  { id: 'n5', stream: 'documents', title: 'Rental agreement expires soon', body: 'Your rental agreement expires in 12 days. Consider requesting a renewal.', at: iso(-3, 9, 0), read: false, severity: 'warning', action: { label: 'Open vault', route: '#/vault' }, source: 'demo' },
  { id: 'n6', stream: 'government', title: 'Criminal record certificate approved', body: 'Your certificate has been issued and added to your wallet.', at: iso(-2, 11, 30), read: true, severity: 'success', action: { label: 'Open wallet', route: '#/wallet' }, source: 'demo' },
  { id: 'n7', stream: 'money', title: 'Salary received', body: '€2,100.00 from Meridian Labs Ltd landed in your everyday account.', at: iso(0, 7, 30), read: true, severity: 'success', source: 'demo' },
  { id: 'n8', stream: 'money', title: 'Water bill is overdue', body: 'Your Q2 water bill of €28.70 was due 3 days ago.', at: iso(-3, 10, 15), read: false, severity: 'warning', action: { label: 'Pay bill', route: '#/money/bills' }, source: 'demo' },
  { id: 'n9', stream: 'security', title: 'Recovery contact not set', body: 'Add a recovery contact so you can regain access if you lose your device.', at: iso(-5, 14, 0), read: true, severity: 'action', action: { label: 'Security centre', route: '#/security' }, source: 'demo' },
  { id: 'n10', stream: 'documents', title: 'Document verified', body: 'Your university degree was matched against the issuing register.', at: iso(-7, 13, 20), read: true, severity: 'success', source: 'demo' },
];

export interface DemoDevice {
  id: string;
  name: string;
  platform: string;
  location: string;
  lastActive: string;
  current: boolean;
  trusted: boolean;
}

export const demoDevices: DemoDevice[] = [
  { id: 'dev1', name: 'iPhone 15 Pro', platform: 'iOS 18.2', location: 'Larnaca, CY', lastActive: iso(0, 8, 5), current: true, trusted: true },
  { id: 'dev2', name: 'MacBook Air', platform: 'macOS 15.2 · Safari', location: 'Larnaca, CY', lastActive: iso(-1, 19, 42), current: false, trusted: true },
  { id: 'dev3', name: 'iPad (9th gen)', platform: 'iPadOS 17.6', location: 'Nicosia, CY', lastActive: iso(-14, 12, 8), current: false, trusted: false },
];

export interface LoginEvent {
  id: string;
  at: string;
  method: 'biometric' | 'pin' | 'password' | '2fa';
  device: string;
  location: string;
  outcome: 'success' | 'failed' | 'blocked';
}

export const demoLoginHistory: LoginEvent[] = [
  { id: 'l1', at: iso(0, 8, 5), method: 'biometric', device: 'iPhone 15 Pro', location: 'Larnaca, CY', outcome: 'success' },
  { id: 'l2', at: iso(-1, 19, 42), method: '2fa', device: 'MacBook Air', location: 'Larnaca, CY', outcome: 'success' },
  { id: 'l3', at: iso(-2, 21, 2), method: 'biometric', device: 'iPhone 15 Pro', location: 'Larnaca, CY', outcome: 'success' },
  { id: 'l4', at: iso(-4, 2, 17), method: 'pin', device: 'Unknown browser', location: 'Frankfurt, DE', outcome: 'blocked' },
  { id: 'l5', at: iso(-6, 9, 51), method: 'pin', device: 'iPhone 15 Pro', location: 'Larnaca, CY', outcome: 'failed' },
  { id: 'l6', at: iso(-6, 9, 52), method: 'biometric', device: 'iPhone 15 Pro', location: 'Larnaca, CY', outcome: 'success' },
];

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  dueDate: string;
  emoji: string;
}

export const demoGoals: SavingsGoal[] = [
  { id: 'g1', name: 'Emergency fund', target: 3000, saved: 940, dueDate: iso(300), emoji: '🛟' },
  { id: 'g2', name: 'Car service', target: 600, saved: 420, dueDate: iso(70), emoji: '🚗' },
  { id: 'g3', name: 'Trip to Crete', target: 1200, saved: 260, dueDate: iso(180), emoji: '⛵' },
];

export interface Budget {
  category: string;
  limit: number;
  spent: number;
  color: string;
}

export const demoBudgets: Budget[] = [
  { category: 'groceries', limit: 400, spent: 215.45, color: 'var(--c1)' },
  { category: 'dining', limit: 150, spent: 118.1, color: 'var(--c2)' },
  { category: 'transport', limit: 200, spent: 65.35, color: 'var(--c3)' },
  { category: 'entertainment', limit: 80, spent: 39.98, color: 'var(--c4)' },
  { category: 'utilities', limit: 200, spent: 136.1, color: 'var(--c5)' },
];

/** Institutions the platform intends to support. None is connected here. */
export interface Institution {
  id: string;
  name: string;
  type: 'bank' | 'psp' | 'government' | 'identity';
  status: 'coming-soon' | 'official-api' | 'demo';
  note: string;
}

export const institutions: Institution[] = [
  { id: 'inst_bank_generic', name: 'Cyprus retail banks (PSD2 AISP)', type: 'bank', status: 'coming-soon', note: 'Requires a licensed TPP agreement and per-bank onboarding.' },
  { id: 'inst_bank_eu', name: 'EU banks via account aggregation', type: 'bank', status: 'coming-soon', note: 'Planned through a regulated aggregator once licensing is in place.' },
  { id: 'inst_psp', name: 'SEPA payment provider', type: 'psp', status: 'coming-soon', note: 'PISP licence or partner PSP required before any transfer is real.' },
  { id: 'inst_gov_gateway', name: 'Government service gateway', type: 'government', status: 'coming-soon', note: 'Each department needs its own data-sharing agreement.' },
  { id: 'inst_eid', name: 'National eID / eIDAS node', type: 'identity', status: 'coming-soon', note: 'Identity assurance can only come from an accredited provider.' },
];

/* --- Admin console demo data --------------------------------------------- */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'pending' | 'suspended';
  idVerification: 'verified' | 'pending' | 'failed' | 'none';
  joined: string;
  tier: 'free' | 'premium' | 'business';
  district: string;
}

export const adminUsers: AdminUser[] = [
  { id: 'u_1001', name: 'Filip Andreou', email: 'f.andreou@example.cy', status: 'active', idVerification: 'verified', joined: iso(-380), tier: 'premium', district: 'Larnaca' },
  { id: 'u_1002', name: 'Maria Georgiou', email: 'm.georgiou@example.cy', status: 'active', idVerification: 'verified', joined: iso(-210), tier: 'free', district: 'Nicosia' },
  { id: 'u_1003', name: 'Andreas Michael', email: 'a.michael@example.cy', status: 'active', idVerification: 'pending', joined: iso(-12), tier: 'free', district: 'Limassol' },
  { id: 'u_1004', name: 'Elena Papadopoulou', email: 'e.papa@example.cy', status: 'pending', idVerification: 'none', joined: iso(-2), tier: 'free', district: 'Paphos' },
  { id: 'u_1005', name: 'Coastline Fitness Ltd', email: 'ops@coastline.example', status: 'active', idVerification: 'verified', joined: iso(-95), tier: 'business', district: 'Larnaca' },
  { id: 'u_1006', name: 'Kyriakos Stavrou', email: 'k.stavrou@example.cy', status: 'suspended', idVerification: 'failed', joined: iso(-40), tier: 'free', district: 'Famagusta' },
  { id: 'u_1007', name: 'Sophia Ioannou', email: 's.ioannou@example.cy', status: 'active', idVerification: 'verified', joined: iso(-150), tier: 'premium', district: 'Limassol' },
];

export interface VerificationCase {
  id: string;
  user: string;
  submitted: string;
  documentType: string;
  method: string;
  risk: 'low' | 'medium' | 'high';
  state: 'queued' | 'manual-review' | 'approved' | 'rejected';
}

export const adminVerifications: VerificationCase[] = [
  { id: 'v_501', user: 'Andreas Michael', submitted: iso(-1), documentType: 'Identity card', method: 'Document + liveness (demo)', risk: 'low', state: 'queued' },
  { id: 'v_502', user: 'Elena Papadopoulou', submitted: iso(-2), documentType: 'Residence permit', method: 'Document + liveness (demo)', risk: 'medium', state: 'manual-review' },
  { id: 'v_503', user: 'Kyriakos Stavrou', submitted: iso(-6), documentType: 'Passport', method: 'Document + liveness (demo)', risk: 'high', state: 'rejected' },
  { id: 'v_504', user: 'Sophia Ioannou', submitted: iso(-9), documentType: 'Identity card', method: 'Document + liveness (demo)', risk: 'low', state: 'approved' },
];

export interface SupportTicket {
  id: string;
  subject: string;
  user: string;
  channel: 'in-app' | 'email' | 'phone';
  priority: 'low' | 'normal' | 'high';
  state: 'open' | 'pending' | 'resolved';
  updated: string;
}

export const adminTickets: SupportTicket[] = [
  { id: 't_9001', subject: 'Cannot complete identity verification', user: 'Elena Papadopoulou', channel: 'in-app', priority: 'high', state: 'open', updated: iso(0, 9, 20) },
  { id: 't_9002', subject: 'Road tax link opens the wrong page', user: 'Maria Georgiou', channel: 'in-app', priority: 'normal', state: 'pending', updated: iso(-1, 15, 5) },
  { id: 't_9003', subject: 'Request to delete account data', user: 'Kyriakos Stavrou', channel: 'email', priority: 'high', state: 'open', updated: iso(-2, 11, 45) },
  { id: 't_9004', subject: 'Greek translation of tax section', user: 'Andreas Michael', channel: 'in-app', priority: 'low', state: 'resolved', updated: iso(-8, 10, 0) },
];

export interface SecurityEvent {
  id: string;
  at: string;
  type: string;
  actor: string;
  severity: 'info' | 'warning' | 'critical';
  detail: string;
}

export const adminSecurityEvents: SecurityEvent[] = [
  { id: 's_1', at: iso(-4, 2, 17), type: 'blocked_signin', actor: 'u_1001', severity: 'warning', detail: 'Sign-in from unrecognised device blocked (geo anomaly: Frankfurt, DE).' },
  { id: 's_2', at: iso(-2, 21, 2), type: 'device_added', actor: 'u_1001', severity: 'info', detail: 'New trusted device registered after biometric step-up.' },
  { id: 's_3', at: iso(-3, 4, 40), type: 'rate_limit', actor: 'anonymous', severity: 'warning', detail: 'Repeated PIN attempts from a single IP; throttled for 15 minutes.' },
  { id: 's_4', at: iso(-9, 13, 12), type: 'consent_revoked', actor: 'u_1007', severity: 'info', detail: 'Data-sharing consent revoked for a merchant verification request.' },
  { id: 's_5', at: iso(-11, 6, 55), type: 'key_rotation', actor: 'system', severity: 'info', detail: 'Document-vault envelope keys rotated on schedule.' },
];
