import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Card, Disclaimer, Field, ListRow, SectionHead, TopBar } from '../../components/ui';
import { money } from '../../lib/format';
import { useApp } from '../../state/store';

/**
 * Cyprus personal income tax bands effective 1 January 2026 (the tax-free
 * threshold rose from €19,500 to €22,000 in the 2026 reform). Public,
 * statutory figures — nothing about the citizen. Verify against the Tax
 * Department before relying on this for a real return; rates change.
 * Sources: sovereigngroup.com/news/cyprus-brings-comprehensive-tax-reform-into-force,
 * rightax.com.cy/cyprus-individual-tax-rates-2026
 */
const BANDS_2026 = [
  { upTo: 22000, rate: 0 },
  { upTo: 32000, rate: 0.2 },
  { upTo: 42000, rate: 0.25 },
  { upTo: 72000, rate: 0.3 },
  { upTo: Infinity, rate: 0.35 },
];

function computeTax(income: number) {
  let tax = 0;
  let lower = 0;
  const breakdown: { from: number; to: number; rate: number; tax: number }[] = [];
  for (const b of BANDS_2026) {
    const upper = Math.min(income, b.upTo);
    const amountInBand = Math.max(0, upper - lower);
    if (amountInBand > 0) {
      const taxInBand = amountInBand * b.rate;
      breakdown.push({ from: lower, to: upper, rate: b.rate, tax: taxInBand });
      tax += taxInBand;
    }
    lower = b.upTo;
    if (income <= b.upTo) break;
  }
  return { tax, breakdown, net: income - tax, effectiveRate: income > 0 ? tax / income : 0 };
}

export function TaxEstimate() {
  const { state, intlLocale } = useApp();

  const suggestedAnnual = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - 60);
    const incomeTx = state.transactions.filter(
      (t) => t.category === 'income' && t.amount > 0 && new Date(t.date) >= since,
    );
    if (incomeTx.length === 0) return 0;
    const monthly = incomeTx.reduce((s, t) => s + t.amount, 0) / 2; // ~2 months window
    return Math.round((monthly * 12) / 100) * 100;
  }, [state.transactions]);

  const [income, setIncome] = useState(suggestedAnnual > 0 ? String(suggestedAnnual) : '');
  const parsed = Math.max(0, Number(income) || 0);
  const result = useMemo(() => computeTax(parsed), [parsed]);

  return (
    <>
      <TopBar title="Tax estimate" onBack />
      <div className="page">
        <Card flat pad="sm">
          <div className="row" style={{ gap: 'var(--s3)' }}>
            <span className="avatar-ico accent" style={{ width: 38, height: 38, flex: 'none' }}>
              <Icon name="calculator" size={19} />
            </span>
            <p className="t-sm muted">
              An illustrative estimate using Cyprus's public 2026 income tax bands — not a filing, and not personal
              advice.
            </p>
          </div>
        </Card>

        <Field label="Estimated annual gross income (€)" className="mt5" hint={suggestedAnnual > 0 ? 'Pre-filled from recent income transactions — edit freely.' : undefined}>
          <input
            className="input"
            inputMode="numeric"
            value={income}
            onChange={(e) => setIncome(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="e.g. 32000"
          />
        </Field>

        {parsed > 0 && (
          <>
            <div className="grid g2 mt5" style={{ gap: 10 }}>
              <Card pad="sm">
                <div className="t-sm muted">Estimated tax</div>
                <div style={{ font: '600 20px/1.3 var(--font)', marginTop: 4 }}>{money(result.tax, { locale: intlLocale })}</div>
              </Card>
              <Card pad="sm">
                <div className="t-sm muted">Estimated net</div>
                <div style={{ font: '600 20px/1.3 var(--font)', marginTop: 4 }}>{money(result.net, { locale: intlLocale })}</div>
              </Card>
            </div>

            <SectionHead title="Band breakdown" />
            <div className="list card-list">
              {result.breakdown.map((b, i) => (
                <ListRow
                  key={i}
                  icon="receipt"
                  title={b.to === Infinity ? `Over €${b.from.toLocaleString()}` : `€${b.from.toLocaleString()} – €${b.to.toLocaleString()}`}
                  sub={`${(b.rate * 100).toFixed(0)}% rate`}
                  end={money(b.tax, { locale: intlLocale })}
                />
              ))}
            </div>

            <Card flat pad="sm" className="mt4">
              <div className="row-between">
                <span className="t-sm muted">Effective rate</span>
                <span className="t-sm num" style={{ fontWeight: 600 }}>
                  {(result.effectiveRate * 100).toFixed(1)}%
                </span>
              </div>
            </Card>
          </>
        )}

        <div className="mt5">
          <Disclaimer icon="info">
            This estimate covers personal income tax only — General Healthcare System (GHS/GESY) contributions and
            Social Insurance are separate and not included. Deductions (life insurance, pension contributions, first
            €19,500 exemptions for some new residents, and others) can lower the real figure. Bands shown are the
            statutory rates effective 1 January 2026; nothing here is submitted to, or seen by, the Tax Department.
            For an actual return, use{' '}
            <a href="https://www.tax.gov.cy" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              tax.gov.cy
            </a>
            .
          </Disclaimer>
        </div>
      </div>
    </>
  );
}
