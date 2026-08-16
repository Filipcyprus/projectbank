import React, { useState } from 'react';
import { Button, Card, Disclaimer, Field, SectionHead, Sheet, TopBar } from '../../components/ui';
import { ProgressRing } from '../../components/charts';
import { daysUntil, money } from '../../lib/format';
import { useApp } from '../../state/store';

export function Goals() {
  const { state, dispatch, t, intlLocale, toast } = useApp();
  const [active, setActive] = useState<string | null>(null);
  const [amount, setAmount] = useState('50');

  const goal = state.goals.find((g) => g.id === active);

  return (
    <>
      <TopBar title={t('money.goals')} onBack />
      <div className="page">
        <SectionHead title="Your goals" />
        <div className="grid" style={{ gap: 'var(--s4)' }}>
          {state.goals.map((g) => {
            const pct = Math.min(100, (g.saved / g.target) * 100);
            const days = daysUntil(g.dueDate);
            return (
              <Card key={g.id}>
                <div className="row" style={{ gap: 'var(--s5)' }}>
                  <ProgressRing value={pct} size={78} thickness={7} color="var(--accent)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{g.emoji}</span>
                      <span style={{ font: '600 16px/1.2 var(--font)' }}>{g.name}</span>
                    </div>
                    <div className="t-sm muted mt2 num">
                      {money(g.saved, { locale: intlLocale })} of {money(g.target, { locale: intlLocale })}
                    </div>
                    <div className="t-sm subtle mt1">
                      {days > 0 ? `${days} days to go` : 'Target date passed'}
                    </div>
                  </div>
                </div>
                <div className="grid g2 mt4">
                  <Button variant="secondary" size="sm" onClick={() => setActive(g.id)}>
                    Add money
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast('Goal editing is not part of this prototype.')}>
                    Edit goal
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <Button
          variant="secondary"
          block
          icon="plus"
          className="mt5"
          onClick={() => toast('Creating new goals is not wired up in this prototype.')}
        >
          New savings goal
        </Button>

        <div className="mt5">
          <Disclaimer>
            Savings goals move money between demo pockets only. In production they would sit on a real deposit account
            held with a licensed institution, with interest terms shown before you commit.
          </Disclaimer>
        </div>
      </div>

      <Sheet open={!!goal} onClose={() => setActive(null)} title={goal ? `Add to ${goal.name}` : ''}>
        {goal && (
          <>
            <Field label={t('common.amount')}>
              <input
                className="input"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
              />
            </Field>
            <div className="row" style={{ gap: 8, marginBottom: 'var(--s5)' }}>
              {[20, 50, 100].map((v) => (
                <Button key={v} variant="secondary" size="sm" onClick={() => setAmount(String(v))}>
                  {money(v, { locale: intlLocale })}
                </Button>
              ))}
            </div>
            <Button
              block
              onClick={() => {
                const value = Number(amount);
                if (!value || value <= 0) {
                  toast('Enter an amount above zero.', 'error');
                  return;
                }
                dispatch({ type: 'goal', id: goal.id, amount: value });
                toast(`${money(value, { locale: intlLocale })} added to ${goal.name}`);
                setActive(null);
              }}
            >
              Move {money(Number(amount) || 0, { locale: intlLocale })}
            </Button>
          </>
        )}
      </Sheet>
    </>
  );
}
