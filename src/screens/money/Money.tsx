import React, { useMemo, useState } from 'react';
import { Icon, type IconName } from '../../components/Icon';
import { Badge, Card, Chip, ErrorState, ListRow, SectionHead, SkeletonList, StatusBadge, TopBar } from '../../components/ui';
import { BarMeter, Donut, LegendRow } from '../../components/charts';
import { navigate } from '../../lib/router';
import { CATEGORY_META, daysUntil, groupByDay, money, moneyParts, relativeDay } from '../../lib/format';
import { computeBudgetSpend, totalBalance, useApp } from '../../state/store';
import type { Account, TxCategory } from '../../integrations/types';
import { hasNisosSession } from '../../integrations/adapters/nisosLiveBankingAdapter';

const ACCOUNT_ICON: Record<Account['type'], IconName> = {
  current: 'money',
  savings: 'target',
  card: 'card',
  investment: 'trending-up',
  external: 'database',
};

export function Money() {
  const { state, t, intlLocale, refresh } = useApp();
  const { accounts, transactions, goals, bills, load } = state;
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');
  const budgets = useMemo(() => computeBudgetSpend(state.budgets, transactions), [state.budgets, transactions]);

  const total = totalBalance(accounts);
  const parts = moneyParts(total, intlLocale);

  const monthTx = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return transactions.filter((tx) => new Date(tx.date) >= start);
  }, [transactions]);

  const spent = monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const received = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);

  const byCategory = useMemo(() => {
    const map = new Map<TxCategory, number>();
    monthTx.filter((t) => t.amount < 0).forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + Math.abs(t.amount)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [monthTx]);

  const visible = transactions.filter((tx) => (filter === 'all' ? true : filter === 'in' ? tx.amount > 0 : tx.amount < 0));
  const grouped = groupByDay(visible.slice(0, 24));
  const dueBills = bills.filter((b) => b.status === 'due' || b.status === 'overdue');

  return (
    <>
      <TopBar
        title={t('money.title')}
        right={
          <button className="iconbtn" onClick={() => navigate('/money/analytics')} aria-label={t('money.analytics')} type="button">
            <Icon name="pie" size={18} />
          </button>
        }
      />
      <div className="page">
        <div className="center" style={{ padding: 'var(--s5) 0 var(--s6)' }}>
          <p className="t-sm muted">{t('home.totalBalance')}</p>
          <h2 style={{ font: '600 40px/1.05 var(--font)', letterSpacing: '-.03em', marginTop: 6 }} className="num">
            {state.prefs.hideBalances ? '••••••' : (
              <>
                {parts.main}
                <span style={{ opacity: 0.45 }}>{parts.cents}</span>
              </>
            )}
          </h2>
          <div className="row" style={{ justifyContent: 'center', gap: 8, marginTop: 10 }}>
            <Badge tone="ok" dot>
              {money(received, { locale: intlLocale })} in
            </Badge>
            <Badge dot>{money(spent, { locale: intlLocale })} out</Badge>
          </div>
        </div>

        <div className="actions-row">
          <button className="action" onClick={() => navigate('/pay/send')} type="button">
            <span className="ico">
              <Icon name="send" size={18} />
            </span>
            {t('common.send')}
          </button>
          <button className="action" onClick={() => navigate('/pay/request')} type="button">
            <span className="ico">
              <Icon name="arrow-down" size={18} />
            </span>
            {t('common.request')}
          </button>
          <button className="action" onClick={() => navigate('/pay/scan')} type="button">
            <span className="ico">
              <Icon name="scan" size={18} />
            </span>
            {t('common.scan')}
          </button>
        </div>

        {/* Accounts --------------------------------------------------------- */}
        <SectionHead title={t('money.accounts')} action={{ label: t('money.connectBank'), onClick: () => navigate('/money/connect') }} />
        {load.banking === 'loading' ? (
          <Card>
            <SkeletonList rows={4} />
          </Card>
        ) : load.banking === 'error' ? (
          <Card>
            <ErrorState message={state.errors.banking} onRetry={() => refresh('banking')} />
          </Card>
        ) : (
          <div className="list card-list">
            {accounts.map((a) => (
              <ListRow
                key={a.id}
                icon={ACCOUNT_ICON[a.type]}
                iconTone={a.type === 'savings' ? 'ok' : a.type === 'card' ? 'accent' : 'sea'}
                title={a.name}
                sub={
                  <span className="row" style={{ gap: 6 }}>
                    {a.maskedNumber ?? a.iban ?? a.institution}
                    <StatusBadge status={a.source} compact />
                    {a.mandatory && <Badge tone="accent">Required</Badge>}
                  </span>
                }
                end={state.prefs.hideBalances ? '••••' : money(a.balance, { locale: intlLocale })}
                chevron
                onClick={() => navigate(`/money/account/${a.id}`)}
              />
            ))}
            <ListRow
              icon="plus"
              title={t('money.connectBank')}
              sub="Open banking · requires a licensed provider"
              chevron
              onClick={() => navigate('/money/connect')}
            />
            {hasNisosSession() && (
              <ListRow
                icon="plus"
                title="Add your own account"
                sub="Real account on your Nisos backend, your own balance"
                chevron
                onClick={() => navigate('/money/add-account')}
              />
            )}
          </div>
        )}

        {/* Spending --------------------------------------------------------- */}
        <SectionHead title={t('money.analytics')} action={{ label: t('common.seeAll'), onClick: () => navigate('/money/analytics') }} />
        <Card>
          <div className="row" style={{ gap: 'var(--s5)' }}>
            <Donut
              size={116}
              thickness={16}
              slices={byCategory.map(([cat, v], i) => ({
                label: CATEGORY_META[cat].label,
                value: v,
                color: `var(--c${i + 1})`,
              }))}
              center={money(spent, { locale: intlLocale }).replace(/\.\d+$/, '')}
              caption={t('money.thisMonth')}
            />
            <div className="chart-legend" style={{ flex: 1 }}>
              {byCategory.map(([cat, v], i) => (
                <LegendRow
                  key={cat}
                  color={`var(--c${i + 1})`}
                  name={CATEGORY_META[cat].label}
                  value={money(v, { locale: intlLocale })}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Budgets ---------------------------------------------------------- */}
        <SectionHead title={t('money.budgets')} />
        <Card>
          <div className="grid" style={{ gap: 'var(--s4)' }}>
            {budgets.slice(0, 3).map((b) => {
              const left = b.limit - b.spent;
              return (
                <div key={b.category}>
                  <div className="row-between" style={{ marginBottom: 7 }}>
                    <span className="t-sm" style={{ fontWeight: 500 }}>
                      {CATEGORY_META[b.category as TxCategory]?.label ?? b.category}
                    </span>
                    <span className="t-sm muted num">
                      {money(b.spent, { locale: intlLocale })} / {money(b.limit, { locale: intlLocale })}
                    </span>
                  </div>
                  <BarMeter value={b.spent} max={b.limit} color={b.color} />
                  <div className="t-sm subtle" style={{ marginTop: 6 }}>
                    {left >= 0
                      ? `${money(left, { locale: intlLocale })} ${t('money.left')}`
                      : `${money(Math.abs(left), { locale: intlLocale })} ${t('money.over')}`}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Goals & bills ---------------------------------------------------- */}
        <div className="grid g2 mt4">
          <Card onClick={() => navigate('/money/goals')} pad="sm">
            <div className="row-between">
              <Icon name="target" size={19} style={{ color: 'var(--accent)' }} />
              <Icon name="chevron" size={16} className="chevron" />
            </div>
            <div className="t-sm muted" style={{ marginTop: 12 }}>
              {t('money.goals')}
            </div>
            <div style={{ font: '600 17px/1.2 var(--font)', marginTop: 2 }} className="num">
              {goals.length} active
            </div>
          </Card>
          <Card onClick={() => navigate('/money/bills')} pad="sm">
            <div className="row-between">
              <Icon name="receipt" size={19} style={{ color: 'var(--accent)' }} />
              <Icon name="chevron" size={16} className="chevron" />
            </div>
            <div className="t-sm muted" style={{ marginTop: 12 }}>
              {t('money.bills')}
            </div>
            <div style={{ font: '600 17px/1.2 var(--font)', marginTop: 2 }} className="num">
              {dueBills.length} due
            </div>
          </Card>
        </div>

        {/* Transactions ----------------------------------------------------- */}
        <SectionHead title={t('money.history')} />
        <div className="row" style={{ gap: 8, marginBottom: 'var(--s3)' }}>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            {t('common.all')}
          </Chip>
          <Chip active={filter === 'in'} onClick={() => setFilter('in')}>
            {t('money.received')}
          </Chip>
          <Chip active={filter === 'out'} onClick={() => setFilter('out')}>
            {t('money.spent')}
          </Chip>
        </div>

        {load.banking === 'loading' ? (
          <Card>
            <SkeletonList rows={6} />
          </Card>
        ) : (
          grouped.map((group) => (
            <div key={group.key}>
              <div className="day-head">{group.label}</div>
              <div className="list card-list">
                {group.rows.map((tx) => {
                  const meta = CATEGORY_META[tx.category];
                  return (
                    <ListRow
                      key={tx.id}
                      icon={meta.icon as IconName}
                      title={tx.merchant}
                      sub={`${meta.label}${tx.method ? ` · ${tx.method.toUpperCase()}` : ''}`}
                      end={money(tx.amount, { sign: tx.amount > 0, locale: intlLocale })}
                      tone={tx.amount > 0 ? 'positive' : undefined}
                      endSub={tx.status === 'pending' ? 'Pending' : relativeDay(tx.date, intlLocale)}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
