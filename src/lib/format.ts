import type { TxCategory } from '../integrations/types';

/** Currency is EUR everywhere: Cyprus is in the euro area. */
export function money(value: number, opts: { sign?: boolean; locale?: string } = {}): string {
  const { sign = false, locale = 'en-CY' } = opts;
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(Math.abs(value));
  if (!sign) return value < 0 ? `-${formatted}` : formatted;
  return `${value < 0 ? '-' : '+'}${formatted}`;
}

/** Splits "€4,250.80" so the cents can be de-emphasised in large displays. */
export function moneyParts(value: number, locale = 'en-CY'): { main: string; cents: string } {
  const s = money(value, { locale });
  const idx = s.lastIndexOf('.');
  return idx === -1 ? { main: s, cents: '' } : { main: s.slice(0, idx), cents: s.slice(idx) };
}

export function compactMoney(value: number): string {
  return new Intl.NumberFormat('en-CY', {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function dateShort(iso: string, locale = 'en-GB'): string {
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function dateLong(iso: string, locale = 'en-GB'): string {
  return new Date(iso).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function timeShort(iso: string, locale = 'en-GB'): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function daysUntil(iso: string): number {
  const target = new Date(iso);
  const today = new Date();
  target.setHours(12, 0, 0, 0);
  today.setHours(12, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function relativeDay(iso: string, locale = 'en-GB'): string {
  const d = daysUntil(iso);
  if (d === 0) return 'Today';
  if (d === -1) return 'Yesterday';
  if (d === 1) return 'Tomorrow';
  if (d < 0 && d > -7) return new Date(iso).toLocaleDateString(locale, { weekday: 'long' });
  return dateShort(iso, locale);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export const CATEGORY_META: Record<TxCategory, { label: string; icon: string; color: string }> = {
  income: { label: 'Income', icon: 'trending-up', color: 'var(--c3)' },
  groceries: { label: 'Groceries', icon: 'basket', color: 'var(--c1)' },
  dining: { label: 'Eating out', icon: 'cup', color: 'var(--c2)' },
  transport: { label: 'Transport', icon: 'car', color: 'var(--c6)' },
  utilities: { label: 'Utilities', icon: 'bolt', color: 'var(--c5)' },
  government: { label: 'Government', icon: 'building', color: 'var(--c8)' },
  health: { label: 'Health', icon: 'heart', color: 'var(--c4)' },
  shopping: { label: 'Shopping', icon: 'bag', color: 'var(--c7)' },
  entertainment: { label: 'Entertainment', icon: 'play', color: 'var(--c4)' },
  housing: { label: 'Housing', icon: 'home', color: 'var(--c8)' },
  transfer: { label: 'Transfers', icon: 'swap', color: 'var(--c6)' },
  other: { label: 'Other', icon: 'dots', color: 'var(--c8)' },
};

/** Groups transactions into date buckets for the activity lists. */
export function groupByDay<T extends { date: string }>(rows: T[]): { key: string; label: string; rows: T[] }[] {
  const map = new Map<string, T[]>();
  rows.forEach((r) => {
    const key = r.date.slice(0, 10);
    const list = map.get(key);
    if (list) list.push(r);
    else map.set(key, [r]);
  });
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, list]) => ({ key, label: relativeDay(`${key}T12:00:00.000Z`), rows: list }));
}

export function greeting(date = new Date()): 'morning' | 'afternoon' | 'evening' {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
