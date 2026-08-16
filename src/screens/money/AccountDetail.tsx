import React from 'react';
import { Icon, type IconName } from '../../components/Icon';
import { Badge, Button, Card, Disclaimer, EmptyState, ListRow, SectionHead, StatusBadge, Switch, TopBar } from '../../components/ui';
import { Sparkline } from '../../components/charts';
import { navigate } from '../../lib/router';
import { CATEGORY_META, groupByDay, money, relativeDay } from '../../lib/format';
import { useApp } from '../../state/store';
import { hasNisosSession, removeNisosAccount } from '../../integrations/adapters/nisosLiveBankingAdapter';

export function AccountDetail({ id }: { id: string }) {
  const { state, dispatch, t, intlLocale, toast, refresh } = useApp();
  const [removing, setRemoving] = React.useState(false);
  const account = state.accounts.find((a) => a.id === id);
  const rows = state.transactions.filter((tx) => tx.accountId === id);

  if (!account) {
    return (
      <>
        <TopBar title={t('money.accounts')} onBack />
        <div className="page">
          <EmptyState title="Account not found" body="This account is no longer available." action={{ label: t('common.back'), onClick: () => navigate('/money') }} />
        </div>
      </>
    );
  }

  const trend = rows
    .slice(0, 12)
    .map((tx) => tx.amount)
    .reverse()
    .reduce<number[]>((acc, amt) => [...acc, (acc[acc.length - 1] ?? account.balance - 400) + amt], []);

  const isCard = account.type === 'card';

  return (
    <>
      <TopBar title={account.name} onBack />
      <div className="page">
        <Card className="center" style={{ paddingBlock: 'var(--s6)' }}>
          <p className="t-sm muted">{account.institution}</p>
          <h2 className="num" style={{ font: '600 34px/1.1 var(--font)', letterSpacing: '-.03em', marginTop: 6 }}>
            {money(account.balance, { locale: intlLocale })}
          </h2>
          {account.available !== undefined && account.available !== account.balance && (
            <p className="t-sm muted mt2">
              {t('home.available')} {money(account.available, { locale: intlLocale })}
            </p>
          )}
          <div className="row" style={{ justifyContent: 'center', marginTop: 12, gap: 8 }}>
            <StatusBadge status={account.source} />
            {account.mandatory && <Badge tone="accent">Required by law</Badge>}
          </div>
          {trend.length > 3 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--s5)' }}>
              <Sparkline points={trend} width={260} height={54} color="var(--c1)" />
            </div>
          )}
        </Card>

        <div className="grid g3 mt4">
          <Button variant="secondary" icon="send" onClick={() => navigate('/pay/send')}>
            {t('common.send')}
          </Button>
          <Button variant="secondary" icon="arrow-down" onClick={() => navigate('/pay/request')}>
            {t('common.request')}
          </Button>
          <Button variant="secondary" icon="receipt" onClick={() => navigate('/money/bills')}>
            {t('common.pay')}
          </Button>
        </div>

        <SectionHead title="Details" />
        <div className="list card-list">
          {account.iban && <ListRow icon="database" title="IBAN" sub="Masked in the prototype" end={account.iban} />}
          {account.maskedNumber && <ListRow icon="card" title="Card number" end={account.maskedNumber} />}
          <ListRow icon="globe" title="Currency" end={account.currency} />
          <ListRow icon="link" title="Source" end={<StatusBadge status={account.source} compact />} />
          {isCard && (
            <div className="list-row">
              <span className="avatar-ico warn">
                <Icon name="snowflake" size={19} />
              </span>
              <div className="body">
                <div className="title">{t('sec.freezeCard')}</div>
                <div className="sub">Instantly blocks new card payments</div>
              </div>
              <Switch
                checked={state.security.cardFrozen}
                label={t('sec.freezeCard')}
                onChange={(v) => {
                  dispatch({ type: 'security', patch: { cardFrozen: v } });
                  toast(v ? 'Card frozen' : 'Card unfrozen');
                }}
              />
            </div>
          )}
        </div>

        <SectionHead title={t('money.history')} />
        {rows.length === 0 ? (
          <EmptyState icon="activity" title="No activity yet" body="Transactions on this account will appear here." />
        ) : (
          groupByDay(rows.slice(0, 20)).map((group) => (
            <div key={group.key}>
              <div className="day-head">{group.label}</div>
              <div className="list card-list">
                {group.rows.map((tx) => (
                  <ListRow
                    key={tx.id}
                    icon={CATEGORY_META[tx.category].icon as IconName}
                    title={tx.merchant}
                    sub={`${CATEGORY_META[tx.category].label} · ${relativeDay(tx.date, intlLocale)}`}
                    end={money(tx.amount, { sign: tx.amount > 0, locale: intlLocale })}
                    tone={tx.amount > 0 ? 'positive' : undefined}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        {hasNisosSession() && account.source === 'official-api' && (
          account.mandatory ? (
            <Card flat pad="sm" className="mt5">
              <div className="row" style={{ gap: 'var(--s4)' }}>
                <Icon name="shield" size={18} style={{ color: 'var(--text-muted)', flex: 'none' }} />
                <p className="t-sm muted">
                  Every citizen is required to hold this account, so it can't be removed. It stays even if the balance
                  is zero.
                </p>
              </div>
            </Card>
          ) : (
            <Button
              variant="danger"
              block
              className="mt5"
              icon="trash"
              loading={removing}
              onClick={async () => {
                setRemoving(true);
                try {
                  await removeNisosAccount(account.id);
                  await refresh('banking');
                  toast(`${account.name} removed.`);
                  navigate('/money');
                } catch (err) {
                  toast(err instanceof Error ? err.message : 'Could not remove this account.', 'error');
                  setRemoving(false);
                }
              }}
            >
              Remove this account
            </Button>
          )
        )}

        <div className="mt5">
          <Disclaimer>
            This account lives in the prototype ledger. Connecting a real bank account requires a licensed open-banking
            provider and the citizen's explicit consent, renewed at least every 90 days.
          </Disclaimer>
        </div>
      </div>
    </>
  );
}
