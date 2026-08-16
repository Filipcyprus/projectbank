/* ---------------------------------------------------------------------------
 * Application state.
 *
 * Domain data is always fetched through the integration layer (never imported
 * from the seed file directly), so swapping a demo adapter for a live one
 * changes nothing here. Only preferences, security settings and records the
 * citizen created on this device are persisted locally.
 * ------------------------------------------------------------------------- */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { use as usePort, registry } from '../integrations/registry';
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
import { NotConfiguredError } from '../integrations/types';
import {
  demoBills,
  demoBudgets,
  demoDevices,
  demoGoals,
  demoLoginHistory,
  demoPayees,
  demoWalletCards,
  type Budget,
  type DemoDevice,
  type LoginEvent,
  type SavingsGoal,
} from '../data/seed';
import { dictionaries, LOCALES, type LocaleCode, type StringKey } from '../i18n/strings';
import { money, CATEGORY_META } from '../lib/format';
import { notifyBrowser } from '../lib/notify';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export interface SecuritySettings {
  biometrics: boolean;
  pinSet: boolean;
  twoFactor: boolean;
  confirmEveryTransaction: boolean;
  securityAlerts: boolean;
  accountFrozen: boolean;
  cardFrozen: boolean;
  recoveryContact: boolean;
  emergencyAccess: boolean;
  /** Minutes of inactivity or backgrounding before the app re-locks. 0 = off. */
  autoLockMinutes: number;
  /** Consecutive wrong PIN entries since the last success. */
  pinFailStreak: number;
  /** ISO timestamp; PIN entry is refused until this passes. */
  pinLockedUntil: string | null;
  /** Browser push permission the citizen has granted, mirrored for the UI. */
  desktopNotifications: boolean;
}

export interface Preferences {
  locale: LocaleCode;
  theme: 'light' | 'dark' | 'system';
  /** Proves the layout is direction-agnostic; no shipped locale is RTL yet. */
  rtlPreview: boolean;
  hideBalances: boolean;
  reduceMotion: boolean;
  largeText: boolean;
}

export interface Toast {
  id: string;
  message: string;
  tone: 'default' | 'error';
}

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'adult' | 'child';
  status: 'pending' | 'accepted';
  addedAt: string;
}

/** An identity presentation the citizen actually released — the real record
 * behind "sharing history", not just a label on the Profile screen. */
export interface IdentityShareRecord {
  id: string;
  createdAt: string;
  expiresAt: string;
  audience: string;
  claims: string[];
  status: 'active' | 'expired' | 'revoked';
}

/** A citizen-facing log of moments this device released or requested data —
 * an identity share, a government submission, a bank consent attempt, a
 * document signature. Not a server-side audit trail (there is no server),
 * but every entry corresponds to a real action taken in this session. */
export interface DataAccessEvent {
  id: string;
  at: string;
  category: 'identity' | 'government' | 'banking' | 'documents';
  actor: string;
  action: string;
  detail?: string;
}

export interface AppState {
  booted: boolean;
  onboarded: boolean;
  locked: boolean;
  prefs: Preferences;
  security: SecuritySettings;
  user: { name: string; email: string; phone: string; tier: 'free' | 'premium' | 'business' };

  identity: IdentityClaims | null;
  accounts: Account[];
  transactions: Transaction[];
  services: GovService[];
  applications: GovApplication[];
  documents: VaultDocument[];
  notifications: AppNotification[];
  walletCards: WalletCard[];
  bills: Bill[];
  payees: Payee[];
  goals: SavingsGoal[];
  budgets: Budget[];
  devices: DemoDevice[];
  loginHistory: LoginEvent[];
  familyMembers: FamilyMember[];
  /** Highest threshold already notified per budget category, so a crossing only alerts once. */
  budgetAlerts: Record<string, 'warn' | 'over'>;
  identityShares: IdentityShareRecord[];
  dataAccessLog: DataAccessEvent[];

  load: Record<'identity' | 'banking' | 'government' | 'documents' | 'notifications', LoadState>;
  errors: Partial<Record<'identity' | 'banking' | 'government' | 'documents' | 'notifications', string>>;
  toasts: Toast[];
}

type Action =
  | { type: 'boot' }
  | { type: 'load'; scope: keyof AppState['load']; state: LoadState; error?: string }
  | { type: 'identity'; claims: IdentityClaims; official: boolean }
  | { type: 'banking'; accounts: Account[]; transactions: Transaction[] }
  | { type: 'government'; services: GovService[]; applications: GovApplication[] }
  | { type: 'documents'; documents: VaultDocument[] }
  | { type: 'notifications'; notifications: AppNotification[] }
  | { type: 'prefs'; patch: Partial<Preferences> }
  | { type: 'security'; patch: Partial<SecuritySettings> }
  | { type: 'user'; patch: Partial<AppState['user']> }
  | { type: 'onboarded'; value: boolean }
  | { type: 'lock'; value: boolean }
  | { type: 'addTransaction'; tx: Transaction }
  | { type: 'addDocument'; doc: VaultDocument }
  | { type: 'updateDocument'; id: string; patch: Partial<VaultDocument> }
  | { type: 'removeDocument'; id: string }
  | { type: 'addPayee'; payee: Payee }
  | { type: 'addApplication'; app: GovApplication }
  | { type: 'addWalletCard'; card: WalletCard }
  | { type: 'payBill'; id: string }
  | { type: 'readNotification'; id: string }
  | { type: 'readAllNotifications' }
  | { type: 'revokeDevice'; id: string }
  | { type: 'trustDevice'; id: string }
  | { type: 'addFamilyMember'; member: FamilyMember }
  | { type: 'removeFamilyMember'; id: string }
  | { type: 'updateFamilyMember'; id: string; patch: Partial<FamilyMember> }
  | { type: 'addNotification'; notification: AppNotification }
  | { type: 'setBudgetAlert'; category: string; level: 'warn' | 'over' | null }
  | { type: 'addIdentityShare'; share: IdentityShareRecord }
  | { type: 'revokeIdentityShare'; id: string }
  | { type: 'addDataAccessEvent'; event: DataAccessEvent }
  | { type: 'goal'; id: string; amount: number }
  | { type: 'toast'; toast: Toast }
  | { type: 'dismissToast'; id: string }
  | { type: 'reset' };

const defaultPrefs: Preferences = {
  locale: 'en',
  theme: 'system',
  rtlPreview: false,
  hideBalances: false,
  reduceMotion: false,
  largeText: false,
};

const defaultSecurity: SecuritySettings = {
  biometrics: true,
  pinSet: true,
  twoFactor: true,
  confirmEveryTransaction: true,
  securityAlerts: true,
  accountFrozen: false,
  cardFrozen: false,
  recoveryContact: false,
  emergencyAccess: false,
  autoLockMinutes: 5,
  pinFailStreak: 0,
  pinLockedUntil: null,
  desktopNotifications: false,
};

const initialState: AppState = {
  booted: false,
  onboarded: false,
  locked: false,
  prefs: defaultPrefs,
  security: defaultSecurity,
  user: { name: 'Filip Andreou', email: 'filip@example.cy', phone: '+357 99 •• •• 41', tier: 'premium' },
  identity: null,
  accounts: [],
  transactions: [],
  services: [],
  applications: [],
  documents: [],
  notifications: [],
  walletCards: demoWalletCards,
  bills: demoBills,
  payees: demoPayees,
  goals: demoGoals,
  budgets: demoBudgets,
  devices: demoDevices,
  loginHistory: demoLoginHistory,
  familyMembers: [],
  budgetAlerts: {},
  identityShares: [],
  dataAccessLog: [],
  load: { identity: 'idle', banking: 'idle', government: 'idle', documents: 'idle', notifications: 'idle' },
  errors: {},
  toasts: [],
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'boot':
      return { ...state, booted: true };
    case 'load':
      return {
        ...state,
        load: { ...state.load, [action.scope]: action.state },
        errors: { ...state.errors, [action.scope]: action.error },
      };
    case 'identity':
      // A real backend identity (official-api) is who actually signed in -
      // keep the greeting/profile name in step with it. Demo identity stays
      // separate so a customised demo profile name isn't clobbered.
      return {
        ...state,
        identity: action.claims,
        user: action.official ? { ...state.user, name: action.claims.fullName } : state.user,
      };
    case 'banking':
      return { ...state, accounts: action.accounts, transactions: action.transactions };
    case 'government':
      return { ...state, services: action.services, applications: action.applications };
    case 'documents':
      return { ...state, documents: action.documents };
    case 'notifications':
      return { ...state, notifications: action.notifications };
    case 'prefs':
      return { ...state, prefs: { ...state.prefs, ...action.patch } };
    case 'security':
      return { ...state, security: { ...state.security, ...action.patch } };
    case 'user':
      return { ...state, user: { ...state.user, ...action.patch } };
    case 'onboarded':
      return { ...state, onboarded: action.value };
    case 'lock':
      return { ...state, locked: action.value };
    case 'addTransaction': {
      const accounts = state.accounts.map((a) =>
        a.id === action.tx.accountId
          ? { ...a, balance: a.balance + action.tx.amount, available: (a.available ?? a.balance) + action.tx.amount }
          : a,
      );
      return { ...state, accounts, transactions: [action.tx, ...state.transactions] };
    }
    case 'addDocument':
      return { ...state, documents: [action.doc, ...state.documents] };
    case 'updateDocument':
      return {
        ...state,
        documents: state.documents.map((d) => (d.id === action.id ? { ...d, ...action.patch } : d)),
      };
    case 'removeDocument':
      return { ...state, documents: state.documents.filter((d) => d.id !== action.id) };
    case 'addPayee':
      return { ...state, payees: [action.payee, ...state.payees] };
    case 'addApplication':
      return { ...state, applications: [action.app, ...state.applications] };
    case 'addWalletCard':
      return { ...state, walletCards: [action.card, ...state.walletCards] };
    case 'payBill':
      return {
        ...state,
        bills: state.bills.map((b) => (b.id === action.id ? { ...b, status: 'paid' } : b)),
      };
    case 'readNotification':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)),
      };
    case 'readAllNotifications':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    case 'revokeDevice':
      return { ...state, devices: state.devices.filter((d) => d.id !== action.id) };
    case 'trustDevice':
      return { ...state, devices: state.devices.map((d) => (d.id === action.id ? { ...d, trusted: true } : d)) };
    case 'addFamilyMember':
      return { ...state, familyMembers: [...state.familyMembers, action.member] };
    case 'removeFamilyMember':
      return { ...state, familyMembers: state.familyMembers.filter((m) => m.id !== action.id) };
    case 'updateFamilyMember':
      return {
        ...state,
        familyMembers: state.familyMembers.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)),
      };
    case 'addNotification':
      return { ...state, notifications: [action.notification, ...state.notifications] };
    case 'setBudgetAlert': {
      const next = { ...state.budgetAlerts };
      if (action.level === null) delete next[action.category];
      else next[action.category] = action.level;
      return { ...state, budgetAlerts: next };
    }
    case 'addIdentityShare':
      return { ...state, identityShares: [action.share, ...state.identityShares] };
    case 'revokeIdentityShare':
      return {
        ...state,
        identityShares: state.identityShares.map((s) => (s.id === action.id ? { ...s, status: 'revoked' } : s)),
      };
    case 'addDataAccessEvent':
      return { ...state, dataAccessLog: [action.event, ...state.dataAccessLog] };
    case 'goal':
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.id ? { ...g, saved: g.saved + action.amount } : g)),
      };
    case 'toast':
      return { ...state, toasts: [...state.toasts, action.toast] };
    case 'dismissToast':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case 'reset':
      return { ...initialState, booted: true };
    default:
      return state;
  }
}

/* --- Persistence ----------------------------------------------------------
 * Only preferences, security settings and locally created records. Nothing
 * that would be sensitive in a real deployment is written here; in production
 * this slice lives in the platform keystore, not in localStorage.
 * ------------------------------------------------------------------------ */

const STORAGE_KEY = 'nisos.state.v1';

interface Persisted {
  onboarded: boolean;
  prefs: Preferences;
  security: SecuritySettings;
  user: AppState['user'];
  localTransactions: Transaction[];
  localDocuments: VaultDocument[];
  localPayees: Payee[];
  localApplications: GovApplication[];
  paidBills: string[];
  readNotifications: string[];
  familyMembers: FamilyMember[];
  budgetAlerts: Record<string, 'warn' | 'over'>;
  /** Ids of notifications created locally (budget alerts) — merged back in on load. */
  localNotifications: AppNotification[];
  identityShares: IdentityShareRecord[];
  dataAccessLog: DataAccessEvent[];
  /** Signature metadata keyed by document id, applied over whichever document
   * list loads next — works whether the doc came from the demo seed or an
   * upload, since only the signature itself is ever citizen-created. */
  documentSignatures: Record<string, NonNullable<VaultDocument['signature']>>;
  devices: DemoDevice[];
}

function loadPersisted(): Partial<Persisted> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Persisted) : {};
  } catch {
    return {};
  }
}

function savePersisted(state: AppState) {
  const payload: Persisted = {
    onboarded: state.onboarded,
    prefs: state.prefs,
    security: state.security,
    user: state.user,
    localTransactions: state.transactions.filter((t) => t.id.startsWith('tx_local')),
    localDocuments: state.documents.filter((d) => d.id.startsWith('doc_local')),
    localPayees: state.payees.filter((p) => p.id.startsWith('p_local')),
    localApplications: state.applications.filter((a) => a.id.startsWith('app_local')),
    paidBills: state.bills.filter((b) => b.status === 'paid').map((b) => b.id),
    readNotifications: state.notifications.filter((n) => n.read).map((n) => n.id),
    familyMembers: state.familyMembers,
    budgetAlerts: state.budgetAlerts,
    localNotifications: state.notifications.filter((n) => n.id.startsWith('notif_local')),
    identityShares: state.identityShares,
    dataAccessLog: state.dataAccessLog,
    documentSignatures: Object.fromEntries(
      state.documents.filter((d) => d.signature).map((d) => [d.id, d.signature!]),
    ),
    devices: state.devices,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* storage full or blocked — preferences simply will not persist */
  }
}

/* --- Context -------------------------------------------------------------- */

interface Ctx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  t: (key: StringKey, fallback?: string) => string;
  locale: LocaleCode;
  intlLocale: string;
  dir: 'ltr' | 'rtl';
  toast: (message: string, tone?: 'default' | 'error') => void;
  refresh: (scope?: keyof AppState['load']) => Promise<void>;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const persisted = useRef(loadPersisted()).current;
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    onboarded: persisted.onboarded ?? false,
    prefs: { ...defaultPrefs, ...(persisted.prefs ?? {}) },
    security: { ...defaultSecurity, ...(persisted.security ?? {}) },
    user: { ...initialState.user, ...(persisted.user ?? {}) },
    familyMembers: persisted.familyMembers ?? [],
    budgetAlerts: persisted.budgetAlerts ?? {},
    identityShares: persisted.identityShares ?? [],
    dataAccessLog: persisted.dataAccessLog ?? [],
    devices: persisted.devices ?? demoDevices,
  });

  const analytics = usePort('analytics');

  const loadScope = useCallback(
    async (scope: keyof AppState['load']) => {
      dispatch({ type: 'load', scope, state: 'loading' });
      try {
        if (scope === 'identity') {
          const claims = await registry.ports.identity.getClaims();
          dispatch({ type: 'identity', claims, official: registry.descriptorFor('identity').status === 'official-api' });
        } else if (scope === 'banking') {
          const [accounts, transactions] = await Promise.all([
            registry.ports.banking.listAccounts(),
            registry.ports.banking.listTransactions(),
          ]);
          const local = persisted.localTransactions ?? [];
          dispatch({ type: 'banking', accounts, transactions: [...local, ...transactions] });
        } else if (scope === 'government') {
          const [services, applications] = await Promise.all([
            registry.ports.government.listServices(),
            registry.ports.government.listApplications(),
          ]);
          dispatch({
            type: 'government',
            services,
            applications: [...(persisted.localApplications ?? []), ...applications],
          });
        } else if (scope === 'documents') {
          const documents = await registry.ports.documents.list();
          const signatures = persisted.documentSignatures ?? {};
          const merged = [...(persisted.localDocuments ?? []), ...documents].map((d) =>
            signatures[d.id] ? { ...d, signature: signatures[d.id] } : d,
          );
          dispatch({ type: 'documents', documents: merged });
        } else if (scope === 'notifications') {
          const notifications = await registry.ports.notifications.list();
          const read = new Set(persisted.readNotifications ?? []);
          const local = persisted.localNotifications ?? [];
          dispatch({
            type: 'notifications',
            notifications: [...local, ...notifications].map((n) => (read.has(n.id) ? { ...n, read: true } : n)),
          });
        }
        dispatch({ type: 'load', scope, state: 'ready' });
      } catch (err) {
        const message =
          err instanceof NotConfiguredError
            ? 'This integration is not configured yet.'
            : err instanceof Error
              ? err.message
              : 'Unknown error';
        dispatch({ type: 'load', scope, state: 'error', error: message });
      }
    },
    [persisted],
  );

  const refresh = useCallback(
    async (scope?: keyof AppState['load']) => {
      const scopes: (keyof AppState['load'])[] = scope
        ? [scope]
        : ['identity', 'banking', 'government', 'documents', 'notifications'];
      await Promise.all(scopes.map(loadScope));
    },
    [loadScope],
  );

  // Initial load through the integration layer.
  useEffect(() => {
    void (async () => {
      await refresh();
      dispatch({ type: 'boot' });
      // Restore locally created records that adapters cannot know about.
      (persisted.localPayees ?? []).forEach((payee) => dispatch({ type: 'addPayee', payee }));
      (persisted.paidBills ?? []).forEach((id) => dispatch({ type: 'payBill', id }));
      analytics.track('app_open');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on change (cheap: the payload is tiny).
  useEffect(() => {
    if (state.booted) savePersisted(state);
  }, [state]);

  // Theme + direction are applied at the document root.
  useEffect(() => {
    const { theme, rtlPreview, locale, largeText } = state.prefs;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = resolved;
    };
    apply();
    media.addEventListener('change', apply);
    const localeDef = LOCALES.find((l) => l.code === locale)!;
    document.documentElement.lang = locale;
    document.documentElement.dir = rtlPreview ? 'rtl' : localeDef.dir;
    document.documentElement.style.fontSize = largeText ? '17px' : '';
    return () => media.removeEventListener('change', apply);
  }, [state.prefs]);

  // Budget alerts: recompute spend from real transactions and notify once
  // per newly-crossed threshold. The first run after data loads only
  // establishes the baseline — nobody should get alerted just for opening
  // the app on a month that already started.
  const budgetsBaselined = useRef(false);
  useEffect(() => {
    if (state.load.banking !== 'ready') return;
    const withSpend = computeBudgetSpend(state.budgets, state.transactions);
    const rank = (l: 'warn' | 'over' | null) => (l === 'over' ? 2 : l === 'warn' ? 1 : 0);

    for (const b of withSpend) {
      const ratio = b.limit > 0 ? b.spent / b.limit : 0;
      const level: 'warn' | 'over' | null = ratio >= 1 ? 'over' : ratio >= 0.9 ? 'warn' : null;
      const current = state.budgetAlerts[b.category] ?? null;

      if (!budgetsBaselined.current) {
        if (level !== current) dispatch({ type: 'setBudgetAlert', category: b.category, level });
        continue;
      }

      if (rank(level) > rank(current)) {
        const label = CATEGORY_META[b.category as keyof typeof CATEGORY_META]?.label ?? b.category;
        const title = level === 'over' ? `${label} budget exceeded` : `${label} budget nearly reached`;
        const body = `${money(b.spent)} of your ${money(b.limit)} ${label} budget this month.`;
        dispatch({
          type: 'addNotification',
          notification: {
            id: `notif_local_budget_${b.category}_${Date.now()}`,
            stream: 'money',
            title,
            body,
            at: new Date().toISOString(),
            read: false,
            severity: level === 'over' ? 'warning' : 'action',
            action: { label: 'View budget', route: '/money/analytics' },
            source: 'demo',
          },
        });
        dispatch({ type: 'setBudgetAlert', category: b.category, level });
        toast(title, level === 'over' ? 'error' : 'default');
      } else if (rank(level) < rank(current)) {
        // Spend dropped back under the line — clear it so a future crossing
        // (next month, or after paying it down) can alert again.
        dispatch({ type: 'setBudgetAlert', category: b.category, level: null });
      }
    }
    budgetsBaselined.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.transactions, state.load.banking]);

  // Desktop notifications: fire a real OS notification for any AppNotification
  // that's new since the last render, but only while the tab is hidden (a
  // visible tab already shows the in-app toast/badge, so a second OS popup
  // would just be noise) and only once the citizen has opted in. The initial
  // batch load never fires — only notifications that appear afterwards.
  const seenNotificationIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    const ids = new Set(state.notifications.map((n) => n.id));
    if (seenNotificationIds.current === null) {
      seenNotificationIds.current = ids;
      return;
    }
    if (state.security.desktopNotifications) {
      for (const n of state.notifications) {
        if (!seenNotificationIds.current.has(n.id) && document.hidden) {
          notifyBrowser(n.title, n.body, n.action?.route);
        }
      }
    }
    seenNotificationIds.current = ids;
  }, [state.notifications, state.security.desktopNotifications]);

  // Auto-lock: re-arm a timer on any interaction, and re-lock while the app
  // was backgrounded past the threshold. Real backgrounding is what a phone
  // actually does when the citizen switches apps — the inactivity timer is
  // the desktop-browser equivalent of "walked away".
  useEffect(() => {
    const mins = state.security.autoLockMinutes;
    if (!state.booted || !state.onboarded || state.locked || mins <= 0) return;
    let timer: number;
    const lock = () => dispatch({ type: 'lock', value: true });
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(lock, mins * 60_000);
    };
    let hiddenAt: number | null = null;
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
      } else if (hiddenAt !== null) {
        if (Date.now() - hiddenAt >= mins * 60_000) lock();
        else reset();
        hiddenAt = null;
      }
    };
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart', 'wheel'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    document.addEventListener('visibilitychange', onVisibility);
    reset();
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [state.booted, state.onboarded, state.locked, state.security.autoLockMinutes]);

  const t = useCallback(
    (key: StringKey, fallback?: string) => {
      const dict = dictionaries[state.prefs.locale];
      return dict[key] ?? dictionaries.en[key] ?? fallback ?? key;
    },
    [state.prefs.locale],
  );

  const toast = useCallback((message: string, tone: 'default' | 'error' = 'default') => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    dispatch({ type: 'toast', toast: { id, message, tone } });
    setTimeout(() => dispatch({ type: 'dismissToast', id }), 3200);
  }, []);

  // A non-secure origin (plain HTTP, not localhost) can't offer WebAuthn,
  // service workers or an install prompt — say so once, rather than let
  // those features silently fail.
  useEffect(() => {
    if (state.booted && !window.isSecureContext) {
      toast('This origin is not secure (no HTTPS) — install, biometrics and offline support are unavailable here.', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.booted]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      dispatch,
      t,
      locale: state.prefs.locale,
      intlLocale: LOCALES.find((l) => l.code === state.prefs.locale)?.intl ?? 'en-GB',
      dir: state.prefs.rtlPreview ? 'rtl' : 'ltr',
      toast,
      refresh,
    }),
    [state, t, toast, refresh],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

/* --- PIN attempt lockout ---------------------------------------------------
 * Held in SecuritySettings (persisted) so a lockout survives a reload rather
 * than being reset by simply closing the sheet and reopening it — the actual
 * attack this defends against.
 * ------------------------------------------------------------------------- */

const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCK_MS = 60_000;

export function usePinLockout() {
  const { state, dispatch } = useApp();
  const until = state.security.pinLockedUntil ? new Date(state.security.pinLockedUntil).getTime() : 0;
  const [, force] = useState(0);

  // Re-render once the lockout expires so the keypad reappears on its own.
  useEffect(() => {
    if (!until) return;
    const ms = until - Date.now();
    if (ms <= 0) return;
    const id = window.setTimeout(() => force((n) => n + 1), ms + 50);
    return () => window.clearTimeout(id);
  }, [until]);

  const locked = until > Date.now();
  const remainingSeconds = locked ? Math.ceil((until - Date.now()) / 1000) : 0;

  const registerFail = useCallback(() => {
    const streak = state.security.pinFailStreak + 1;
    if (streak >= PIN_MAX_ATTEMPTS) {
      dispatch({
        type: 'security',
        patch: { pinFailStreak: 0, pinLockedUntil: new Date(Date.now() + PIN_LOCK_MS).toISOString() },
      });
    } else {
      dispatch({ type: 'security', patch: { pinFailStreak: streak } });
    }
    return streak;
  }, [state.security.pinFailStreak, dispatch]);

  const registerSuccess = useCallback(() => {
    if (state.security.pinFailStreak || state.security.pinLockedUntil) {
      dispatch({ type: 'security', patch: { pinFailStreak: 0, pinLockedUntil: null } });
    }
  }, [state.security.pinFailStreak, state.security.pinLockedUntil, dispatch]);

  return {
    locked,
    remainingSeconds,
    attemptsLeft: Math.max(0, PIN_MAX_ATTEMPTS - state.security.pinFailStreak),
    registerFail,
    registerSuccess,
  };
}

/**
 * Recomputes each budget's "spent" figure from this month's transactions in
 * that category, rather than trusting a static seed value — so a payment
 * made through Send/Bills/Scan actually moves the bar and can trip an alert.
 */
export function computeBudgetSpend(budgets: Budget[], transactions: Transaction[]): Budget[] {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const byCategory = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.amount >= 0 || tx.status === 'failed') continue;
    const d = new Date(tx.date);
    if (`${d.getFullYear()}-${d.getMonth()}` !== monthKey) continue;
    byCategory.set(tx.category, (byCategory.get(tx.category) ?? 0) + Math.abs(tx.amount));
  }
  return budgets.map((b) => ({ ...b, spent: byCategory.get(b.category) ?? 0 }));
}

/* --- Derived selectors ---------------------------------------------------- */

export function totalBalance(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + a.balance, 0);
}

export function unreadCount(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

export function securityScore(s: SecuritySettings): number {
  const weights: [keyof SecuritySettings, number][] = [
    ['biometrics', 20],
    ['pinSet', 20],
    ['twoFactor', 20],
    ['confirmEveryTransaction', 15],
    ['securityAlerts', 10],
    ['recoveryContact', 10],
    ['emergencyAccess', 5],
  ];
  return weights.reduce((sum, [k, w]) => sum + (s[k] ? w : 0), 0);
}
