import React, { useMemo, useState } from 'react';
import { Card, SectionHead, Segmented, TopBar } from '../../components/ui';
import { BarMeter, Bars, Donut, LegendRow } from '../../components/charts';
import { CATEGORY_META, money } from '../../lib/format';
import { computeBudgetSpend, useApp } from '../../state/store';
import type { TxCategory } from '../../integrations/types';

type Range = '30' | '90' | '365';

export function Analytics() {
  const { state, t, intlLocale } = useApp();
  const [range, setRange] = useState<Range>('30');

  const rows = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - Number(range));
    return state.transactions.filter((tx) => new Date(tx.date) >= start);
  }, [state.transactions, range]);

  const budgets = useMemo(() => computeBudgetSpend(state.budgets, state.transactions), [state.budgets, state.transactions]);

  const spent = rows.filter((r) => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);
  const received = rows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);

  const categories = useMemo(() => {
    const map = new Map<TxCategory, number>();
    rows.filter((r) => r.amount < 0).forEach((r) => map.set(r.category, (map.get(r.category) ?? 0) + Math.abs(r.amount)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const merchants = useMemo(() => {
    const map = new Map<string, number>();
    rows.filter((r) => r.amount < 0).forEach((r) => map.set(r.merchant, (map.get(r.merchant) ?? 0) + Math.abs(r.amount)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [rows]);

  // Weekly spend buckets, oldest first.
  const weekly = useMemo(() => {
    const buckets = Array.from({ length: 6 }, () => 0);
    const now = Date.now();
    rows
      .filter((r) => r.amount < 0)
      .forEach((r) => {
        const weeksAgo = Math.floor((now - new Date(r.date).getTime()) / (7 * 86_400_000));
        if (weeksAgo < 6) buckets[5 - weeksAgo] += Math.abs(r.amount);
      });
    return buckets.map((v, i) => ({ label: i === 5 ? 'Now' : `W-${5 - i}`, value: Math.round(v) }));
  }, [rows]);

  const net = received - spent;

  return (
    <>
      <TopBar title={t('money.analytics')} onBack />
      <div className="page">
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: '30', label: '30 days' },
            { value: '90', label: '90 days' },
            { value: '365', label: '12 months' },
          ]}
        />

        <div className="grid g2 mt5">
          <div className="stat-tile">
            <div className="k">{t('money.spent')}</div>
            <div className="v">{money(spent, { locale: intlLocale })}</div>
          </div>
          <div className="stat-tile">
            <div className="k">{t('money.received')}</div>
            <div className="v pos">{money(received, { locale: intlLocale })}</div>
          </div>
        </div>
        <Card flat pad="sm" className="mt3">
          <div className="row-between">
            <span className="t-sm muted">Net</span>
            <span className="num" style={{ fontWeight: 600, color: net >= 0 ? 'var(--ok-500)' : 'var(--danger-500)' }}>
              {money(net, { sign: true, locale: intlLocale })}
            </span>
          </div>
        </Card>

        <SectionHead title="Spending over time" />
        <Card>
          <Bars data={weekly} color="var(--c1)" formatValue={(v) => money(v, { locale: intlLocale })} />
        </Card>

        <SectionHead title="By category" />
        <Card>
          <div className="center" style={{ marginBottom: 'var(--s5)' }}>
            <Donut
              slices={categories.slice(0, 6).map(([cat, v], i) => ({
                label: CATEGORY_META[cat].label,
                value: v,
                color: `var(--c${(i % 8) + 1})`,
              }))}
              center={money(spent, { locale: intlLocale }).replace(/\.\d+$/, '')}
              caption="total out"
            />
          </div>
          <div className="chart-legend">
            {categories.slice(0, 6).map(([cat, v], i) => (
              <LegendRow
                key={cat}
                color={`var(--c${(i % 8) + 1})`}
                name={CATEGORY_META[cat].label}
                value={money(v, { locale: intlLocale })}
              />
            ))}
          </div>
        </Card>

        <SectionHead title="Top merchants" />
        <Card>
          <div className="grid" style={{ gap: 'var(--s4)' }}>
            {merchants.map(([name, v], i) => (
              <div key={name}>
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <span className="t-sm truncate" style={{ fontWeight: 500 }}>
                    {name}
                  </span>
                  <span className="t-sm num muted">{money(v, { locale: intlLocale })}</span>
                </div>
                <BarMeter value={v} max={merchants[0][1]} color={`var(--c${(i % 8) + 1})`} />
              </div>
            ))}
          </div>
        </Card>

        <SectionHead title={t('money.budgets')} />
        <Card>
          <div className="grid" style={{ gap: 'var(--s4)' }}>
            {budgets.map((b) => (
              <div key={b.category}>
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <span className="t-sm" style={{ fontWeight: 500 }}>
                    {CATEGORY_META[b.category as TxCategory]?.label ?? b.category}
                  </span>
                  <span className="t-sm num muted">
                    {money(b.spent, { locale: intlLocale })} / {money(b.limit, { locale: intlLocale })}
                  </span>
                </div>
                <BarMeter value={b.spent} max={b.limit} color={b.color} />
              </div>
            ))}
          </div>
        </Card>

        <p className="t-sm subtle mt5">
          Analytics are computed on this device from the demo ledger. No spending data is sent anywhere.
        </p>
      </div>
    </>
  );
}
