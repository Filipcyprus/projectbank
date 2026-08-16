import express from 'express';
import cors from 'cors';
import { v4 as uuid } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const app = express();
// Hosting providers (Railway, Render, Fly.io, etc.) assign the port via the
// PORT env var at runtime - 3001 stays the local-dev default.
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_DIR = join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

/* =========================================================================
 * Data Layer — File-based storage for demo
 * ========================================================================= */

function readDB(name) {
  const path = join(DB_DIR, `${name}.json`);
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch {
    return {};
  }
}

function writeDB(name, data) {
  fs.writeFileSync(join(DB_DIR, `${name}.json`), JSON.stringify(data, null, 2));
}

/* =========================================================================
 * Sessions (in-memory, with file persistence)
 * ========================================================================= */

const sessions = new Map();

function createSession(userId) {
  const sessionId = uuid();
  const session = {
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  };
  sessions.set(sessionId, session);
  return sessionId;
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (new Date() > new Date(session.expiresAt)) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

/* =========================================================================
 * Sign-in history — every citizen can see who signed in to their account
 * (Estonia-style "who accessed my data"). Failed attempts against a real
 * email are logged too, so a citizen can tell if someone tried their PIN.
 * ========================================================================= */

function summarizeUserAgent(uaRaw) {
  const ua = uaRaw || '';
  if (/iPhone|iPad/i.test(ua)) return 'iPhone/iPad · Browser';
  if (/Android/i.test(ua)) return 'Android · Browser';
  if (/Macintosh|Mac OS/i.test(ua)) return 'Mac · Browser';
  if (/Windows/i.test(ua)) return 'Windows · Browser';
  if (/Linux/i.test(ua)) return 'Linux · Browser';
  return 'Unknown device';
}

function recordLoginEvent(userId, outcome, method, req) {
  const history = readDB('login_history');
  const id = uuid();
  history[id] = {
    id,
    userId,
    at: new Date().toISOString(),
    outcome, // 'success' | 'failed'
    method, // 'pin' | 'registration'
    device: summarizeUserAgent(req.headers['user-agent']),
    // No geo-IP lookup in this prototype - the citizen sees the real
    // request IP rather than a fabricated city, honestly labelled as such.
    ip: req.ip || req.socket?.remoteAddress || 'unknown',
  };
  writeDB('login_history', history);
}

/* =========================================================================
 * Password policy - the same rules the client shows live while typing
 * (see src/lib/password.ts). Enforced here too because client-side
 * validation is a UX convenience, never the security boundary.
 * ========================================================================= */

const DEMO_PASSWORD = 'Cyprus#Nisos2026';

function passwordIssues(pw) {
  const issues = [];
  if (typeof pw !== 'string' || pw.length < 10) issues.push('at least 10 characters');
  if (!/[a-z]/.test(pw || '')) issues.push('a lowercase letter');
  if (!/[A-Z]/.test(pw || '')) issues.push('an uppercase letter');
  if (!/[0-9]/.test(pw || '')) issues.push('a number');
  if (!/[^A-Za-z0-9]/.test(pw || '')) issues.push('a symbol (e.g. ! @ # $ %)');
  return issues;
}

/* =========================================================================
 * Demo Users & Accounts
 * ========================================================================= */

function initDemoData() {
  // Create demo user if doesn't exist, or migrate it off the old 4-digit PIN
  // scheme from before real passwords were enforced.
  const users = readDB('users');
  if (!users.demo_user || !users.demo_user.passwordHash) {
    users.demo_user = {
      id: 'demo_user',
      email: 'citizen@nisos.cy',
      name: 'Filip Andreou',
      idNumber: 'ID123456789',
      passwordHash: bcrypt.hashSync(DEMO_PASSWORD, 10),
      identityVerified: true,
      assuranceLevel: 'substantial',
      createdAt: users.demo_user?.createdAt || new Date().toISOString(),
    };
    writeDB('users', users);
  }

  // Create demo bank accounts
  const accounts = readDB('accounts');
  if (Object.keys(accounts).length === 0) {
    accounts.acc_001 = {
      id: 'acc_001',
      userId: 'demo_user',
      type: 'current',
      name: 'Main Account',
      bank: 'Cyprus Bank',
      iban: 'CY94 0020 0128 0000 0019 2007 0000',
      balance: 15420.50,
      currency: 'EUR',
      status: 'active',
      // Every citizen is required to hold this account - it cannot be
      // removed (see DELETE /api/banking/accounts/:accountId).
      mandatory: true,
      createdAt: '2024-01-15',
    };
    accounts.acc_002 = {
      id: 'acc_002',
      userId: 'demo_user',
      type: 'savings',
      name: 'Holiday Fund',
      bank: 'Cyprus Bank',
      iban: 'CY94 0020 0128 0000 0019 2007 0001',
      balance: 3250.00,
      currency: 'EUR',
      status: 'active',
      createdAt: '2024-03-22',
    };
    accounts.acc_003 = {
      id: 'acc_003',
      userId: 'demo_user',
      type: 'business',
      name: 'Business Account',
      bank: 'Cyprus Business Bank',
      iban: 'CY94 0020 0128 0000 0019 2007 0002',
      balance: 8760.75,
      currency: 'EUR',
      status: 'active',
      createdAt: '2024-02-10',
    };
    writeDB('accounts', accounts);
  }

  // Create demo transactions
  const transactions = readDB('transactions');
  if (Object.keys(transactions).length === 0) {
    transactions.txn_001 = {
      id: 'txn_001',
      accountId: 'acc_001',
      type: 'debit',
      amount: 125.50,
      description: 'Supermarket Carrefour',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'groceries',
      status: 'completed',
    };
    transactions.txn_002 = {
      id: 'txn_002',
      accountId: 'acc_001',
      type: 'credit',
      amount: 3500.00,
      description: 'Salary - March',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'salary',
      status: 'completed',
    };
    transactions.txn_003 = {
      id: 'txn_003',
      accountId: 'acc_001',
      type: 'debit',
      amount: 45.00,
      description: 'Electricity Bill - March',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'utilities',
      status: 'completed',
    };
    writeDB('transactions', transactions);
  }
}

initDemoData();

/* =========================================================================
 * Authentication Routes
 * ========================================================================= */

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const users = readDB('users');

  // Find user by email
  const user = Object.values(users).find((u) => u.email === email);
  const validPassword = user?.passwordHash ? bcrypt.compareSync(password || '', user.passwordHash) : false;
  if (!user || !validPassword) {
    // A wrong password against a real email is exactly what a citizen needs
    // to see in their sign-in history - log it against that account even
    // though the attempt is rejected. An unknown email has no account to
    // attach the attempt to, so nothing is recorded.
    if (user) recordLoginEvent(user.id, 'failed', 'password', req);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  recordLoginEvent(user.id, 'success', 'password', req);
  const sessionId = createSession(user.id);
  res.json({
    sessionId,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      idNumber: user.idNumber,
    },
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, idNumber } = req.body;

  const fullName = (name || '').trim();
  // Mirrors CY Login's requirement of a full legal name, not a nickname or
  // single word - at least a given name and a family name.
  if (fullName.split(/\s+/).filter(Boolean).length < 2) {
    return res.status(400).json({ error: 'Enter your full name (first and last name)' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }
  const weakness = passwordIssues(password);
  if (weakness.length > 0) {
    return res.status(400).json({ error: `Password needs ${weakness.join(', ')}` });
  }

  const users = readDB('users');
  const existing = Object.values(users).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const id = `user_${uuid()}`;
  const user = {
    id,
    email,
    name: fullName,
    idNumber: idNumber?.trim() || `ID${Math.floor(100000000 + Math.random() * 899999999)}`,
    passwordHash: bcrypt.hashSync(password, 10),
    // A self-registered citizen hasn't been through any assurance flow yet -
    // honestly reflects that no verification has actually happened.
    identityVerified: false,
    assuranceLevel: 'low',
    createdAt: new Date().toISOString(),
  };
  users[id] = user;
  writeDB('users', users);

  // Every citizen is required by law to hold one Nisos account - created
  // automatically at registration, starting at zero, and not removable
  // (see DELETE /api/banking/accounts/:accountId). Anything added later
  // through "Add your own account" stays optional and removable.
  const accounts = readDB('accounts');
  const mainAccountId = `acc_${uuid()}`;
  accounts[mainAccountId] = {
    id: mainAccountId,
    userId: id,
    type: 'current',
    name: 'Main Account',
    bank: 'Nisos backend',
    iban: `CY00 MAIN ${mainAccountId.replace(/\D/g, '').slice(-16).padStart(16, '0')}`,
    balance: 0,
    currency: 'EUR',
    status: 'active',
    mandatory: true,
    createdAt: new Date().toISOString(),
  };
  writeDB('accounts', accounts);

  recordLoginEvent(id, 'success', 'registration', req);
  const sessionId = createSession(id);
  res.status(201).json({
    sessionId,
    user: { id: user.id, email: user.email, name: user.name, idNumber: user.idNumber },
  });
});

app.post('/api/auth/logout', (req, res) => {
  const { sessionId } = req.body;
  sessions.delete(sessionId);
  res.json({ ok: true });
});

app.get('/api/auth/session', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const session = getSession(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const users = readDB('users');
  const user = users[session.userId];

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      idNumber: user.idNumber,
      identityVerified: user.identityVerified,
      assuranceLevel: user.assuranceLevel,
    },
  });
});

app.get('/api/auth/login-history', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const session = getSession(sessionId);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const history = readDB('login_history');
  const mine = Object.values(history)
    .filter((h) => h.userId === session.userId)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 50);

  res.json({ history: mine });
});

/* =========================================================================
 * Banking Routes
 * ========================================================================= */

app.get('/api/banking/accounts', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const session = getSession(sessionId);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const accounts = readDB('accounts');
  const userAccounts = Object.values(accounts).filter((a) => a.userId === session.userId);
  res.json({ accounts: userAccounts });
});

app.get('/api/banking/accounts/:accountId/transactions', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const session = getSession(sessionId);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { accountId } = req.params;
  const transactions = readDB('transactions');
  const accountTransactions = Object.values(transactions)
    .filter((t) => t.accountId === accountId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({ transactions: accountTransactions });
});

app.post('/api/banking/accounts', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const session = getSession(sessionId);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { name, type, balance, iban } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Account name is required' });
  if (typeof balance !== 'number' || Number.isNaN(balance) || balance < 0) {
    return res.status(400).json({ error: 'Starting balance must be a number of 0 or more' });
  }

  const accounts = readDB('accounts');
  const id = `acc_${uuid()}`;
  const account = {
    id,
    userId: session.userId,
    type: ['current', 'savings', 'card', 'investment', 'business'].includes(type) ? type : 'current',
    name: name.trim(),
    bank: 'Nisos backend',
    iban: iban?.trim() || `CY00 SELF ${id.replace(/\D/g, '').slice(-16).padStart(16, '0')}`,
    balance,
    currency: 'EUR',
    status: 'active',
    // Self-added accounts are always optional - only the one Main Account
    // created at registration is mandatory.
    mandatory: false,
    createdAt: new Date().toISOString(),
  };
  accounts[id] = account;
  writeDB('accounts', accounts);

  res.status(201).json({ account });
});

app.delete('/api/banking/accounts/:accountId', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const session = getSession(sessionId);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { accountId } = req.params;
  const accounts = readDB('accounts');
  const account = accounts[accountId];
  if (!account || account.userId !== session.userId) {
    return res.status(404).json({ error: 'Account not found' });
  }
  if (account.mandatory) {
    return res.status(403).json({ error: 'This account is required by law and cannot be removed.' });
  }

  delete accounts[accountId];
  writeDB('accounts', accounts);

  const transactions = readDB('transactions');
  Object.keys(transactions)
    .filter((txId) => transactions[txId].accountId === accountId)
    .forEach((txId) => delete transactions[txId]);
  writeDB('transactions', transactions);

  res.json({ ok: true });
});

app.post('/api/banking/transfer', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const session = getSession(sessionId);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { fromAccountId, toIban, amount, description } = req.body;
  const accounts = readDB('accounts');

  // Validate
  if (accounts[fromAccountId].userId !== session.userId) {
    return res.status(403).json({ error: 'Account not owned by user' });
  }

  if (accounts[fromAccountId].balance < amount) {
    return res.status(400).json({ error: 'Insufficient funds' });
  }

  // Deduct from source
  accounts[fromAccountId].balance -= amount;

  // Add to destination (in real app, would be external bank)
  // For demo, we'll just record it as completed
  const transactions = readDB('transactions');
  const txnId = uuid();
  transactions[txnId] = {
    id: txnId,
    accountId: fromAccountId,
    type: 'debit',
    amount,
    description: `Transfer to ${toIban}: ${description}`,
    date: new Date().toISOString(),
    category: 'transfer',
    status: 'completed',
  };

  writeDB('accounts', accounts);
  writeDB('transactions', transactions);

  res.json({
    transactionId: txnId,
    status: 'completed',
    amount,
  });
});

/* =========================================================================
 * Identity Routes
 * ========================================================================= */

app.post('/api/identity/share', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const session = getSession(sessionId);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { claims, audience } = req.body;
  const users = readDB('users');
  const user = users[session.userId];

  // Create a time-limited share code
  const shareId = uuid();
  const shares = readDB('identity_shares');
  shares[shareId] = {
    id: shareId,
    userId: session.userId,
    audience,
    claims,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
    status: 'active',
  };
  writeDB('identity_shares', shares);

  res.json({
    shareId,
    code: shareId.substring(0, 8).toUpperCase(),
    expiresIn: 300,
  });
});

app.get('/api/identity/profile', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const session = getSession(sessionId);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const users = readDB('users');
  const user = users[session.userId];

  res.json({
    name: user.name,
    idNumber: user.idNumber,
    verified: user.identityVerified,
    assuranceLevel: user.assuranceLevel,
    dateOfBirth: '1990-03-15',
    nationality: 'Cyprus',
    email: user.email,
  });
});

/* =========================================================================
 * Health Check
 * ========================================================================= */

app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

/* =========================================================================
 * Start Server
 * ========================================================================= */

app.listen(PORT, () => {
  console.log(`🚀 Nisos backend running on http://localhost:${PORT}`);
  console.log(`📋 Demo user: citizen@nisos.cy | PIN: 1234`);
});
