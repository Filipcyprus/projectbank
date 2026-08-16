import React from 'react';
import { Icon, type IconName } from '../../components/Icon';
import { Badge, Card, DemoBanner, ErrorState, InstallAppBanner, ListRow, SectionHead, Skeleton, SkeletonList, StatusBadge } from '../../components/ui';
import { Sparkline } from '../../components/charts';
import { navigate } from '../../lib/router';
import { CATEGORY_META, daysUntil, greeting, initials, money, moneyParts, relativeDay } from '../../lib/format';
import { totalBalance, unreadCount, useApp } from '../../state/store';
import type { StringKey } from '../../i18n/strings';
import { registry } from '../../integrations/registry';

const QUICK: { icon: IconName; key: StringKey; route: string }[] = [
  { icon: 'send', key: 'action.sendMoney', route: '/pay/send' },
  { icon: 'money', key: 'action.pay', route: '/pay' },
  { icon: 'id-card', key: 'action.digitalId', route: '/id' },
  { icon: 'gov', key: 'action.govServices', route: '/gov' },
  { icon: 'doc', key: 'action.documents', route: '/vault' },
  { icon: 'receipt', key: 'action.bills', route: '/money/bills' },
];

export function Home() {
  const { state, t, intlLocale, refresh } = useApp();
  const { accounts, transactions, notifications, bills, documents, identity, load, prefs } = state;

  const total = totalBalance(accounts);
  const parts = moneyParts(total, intlLocale);
  const unread = unreadCount(notifications);
  const govUnread = notifications.filter((n) => n.stream === 'government' && !n.read).length;
  const firstName = state.user.name.split(' ')[0];

  const upcoming = bills
    .filter((b) => b.status !== 'paid' && daysUntil(b.dueDate) <= 60)
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate))
    .slice(0, 3);

  const expiring = documents
    .filter((d) => d.expiresAt && daysUntil(d.expiresAt) < 90)
    .sort((a, b) => daysUntil(a.expiresAt!) - daysUntil(b.expiresAt!))
    .slice(0, 2);

  const recent = transactions.slice(0, 4);

  // 8-week balance trend for the sparkline on the hero card.
  const trend = React.useMemo(() => {
    const weeks = Array.from({ length: 8 }, (_, i) => i);
    let running = total;
    const points = weeks.map(() => {
      const wk = running;
      running -= (Math.random() - 0.35) * 240;
      return Math.max(wk, 0);
    });
    return points.reverse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.length]);

  return (
    <div className="page">
      <header className="row-between" style={{ padding: '52px 0 var(--s5)' }}>
        <div>
          <p className="t-sm muted">{t(`home.greeting.${greeting()}` as StringKey)}</p>
          <h1 className="t-h1" style={{ marginTop: 2 }}>
            {firstName}
          </h1>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="iconbtn" onClick={() => navigate('/notifications')} aria-label={t('notif.title')} type="button">
            <Icon name="bell" size={19} />
            {unread > 0 && <span className="dot" />}
          </button>
          <button
            className="avatar-ico round accent"
            onClick={() => navigate('/profile')}
            aria-label={t('profile.title')}
            type="button"
            style={{ border: 0 }}
          >
            {initials(state.user.name)}
          </button>
        </div>
      </header>

      <div className="grid stagger" style={{ gap: 'var(--s4)' }}>
        <DemoBanner />
        <InstallAppBanner />

        {/* Digital ID status ------------------------------------------------ */}
        <Card pad="sm" onClick={() => navigate('/id')}>
          <div className="row">
            <span className="avatar-ico sea">
              <Icon name="id-card" size={20} />
            </span>
            <div className="body" style={{ flex: 1 }}>
              <div className="row" style={{ gap: 8 }}>
                <span style={{ font: '500 15px/1.2 var(--font)' }}>{t('home.digitalId')}</span>
                <StatusBadge status={registry.descriptorFor('identity').status} compact />
              </div>
              <div className="t-sm muted" style={{ marginTop: 3 }}>
                {load.identity === 'loading' ? (
                  <Skeleton h={12} w={120} />
                ) : identity?.verified ? (
                  <span className="row" style={{ gap: 5, color: 'var(--ok-500)' }}>
                    <Icon name="check-circle" size={14} /> {t('home.verified')} · {identity.digitalIdNumber}
                  </span>
                ) : (
                  t('home.notVerified')
                )}
              </div>
            </div>
            <Icon name="chevron" size={17} className="chevron" />
          </div>
        </Card>

        {/* Balance ---------------------------------------------------------- */}
        {load.banking === 'error' ? (
          <Card>
            <ErrorState message={state.errors.banking} onRetry={() => refresh('banking')} />
          </Card>
        ) : (
          <div className="hero-card">
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="label">{t('home.totalBalance')}</div>
                {load.banking === 'loading' ? (
                  <div style={{ marginTop: 10 }}>
                    <Skeleton h={34} w={190} style={{ background: 'rgba(255,255,255,.16)' }} />
                  </div>
                ) : (
                  <div className="amount">
                    {prefs.hideBalances ? '••••••' : (
                      <>
                        {parts.main}
                        <span className="cents">{parts.cents}</span>
                      </>
                    )}
                  </div>
                )}
                <div className="t-sm" style={{ opacity: 0.72, marginTop: 6 }}>
                  {accounts.length} {t('money.accounts').toLowerCase()} · EUR
                </div>
              </div>
              <div style={{ opacity: 0.8 }}>
                <Sparkline points={trend} color="var(--copper-300)" width={92} height={42} />
              </div>
            </div>

            <div className="actions-row" style={{ marginTop: 'var(--s5)' }}>
              <button className="action on-dark" onClick={() => navigate('/pay/send')} type="button">
                <span className="ico">
                  <Icon name="send" size={18} />
                </span>
                {t('common.send')}
              </button>
              <button className="action on-dark" onClick={() => navigate('/pay')} type="button">
                <span className="ico">
                  <Icon name="money" size={18} />
                </span>
                {t('common.pay')}
              </button>
              <button className="action on-dark" onClick={() => navigate('/pay/scan')} type="button">
                <span className="ico">
                  <Icon name="scan" size={18} />
                </span>
                {t('common.scan')}
              </button>
            </div>
          </div>
        )}

        {/* Government ------------------------------------------------------- */}
        <Card pad="sm" onClick={() => navigate('/gov')}>
          <div className="row">
            <span className="avatar-ico accent">
              <Icon name="gov" size={20} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ font: '500 15px/1.2 var(--font)' }}>{t('home.government')}</div>
              <div className="t-sm muted" style={{ marginTop: 3 }}>
                {govUnread > 0
                  ? `${govUnread} ${t('home.notificationsCount')}`
                  : `${state.services.length} services in the directory`}
              </div>
            </div>
            {govUnread > 0 && <Badge tone="accent">{govUnread}</Badge>}
            <Icon name="chevron" size={17} className="chevron" />
          </div>
        </Card>
      </div>

      {/* Upcoming ----------------------------------------------------------- */}
      <SectionHead title={t('home.upcoming')} action={{ label: t('common.seeAll'), onClick: () => navigate('/money/bills') }} />
      {upcoming.length === 0 ? (
        <Card flat pad="sm">
          <p className="t-sm muted">{t('home.noUpcoming')}</p>
        </Card>
      ) : (
        <div className="list card-list">
          {upcoming.map((b) => {
            const days = daysUntil(b.dueDate);
            return (
              <ListRow
                key={b.id}
                icon={b.category === 'government' ? 'gov' : 'receipt'}
                iconTone={days < 0 ? 'danger' : days < 7 ? 'warn' : 'default'}
                title={b.name}
                sub={
                  days < 0
                    ? `Overdue by ${Math.abs(days)} days · ${b.issuer}`
                    : `${t('common.due')} ${relativeDay(b.dueDate, intlLocale)} · ${b.issuer}`
                }
                end={money(b.amount, { locale: intlLocale })}
                endSub={b.autopay ? 'Autopay' : undefined}
                onClick={() => navigate('/money/bills')}
              />
            );
          })}
        </div>
      )}

      {/* Quick actions ------------------------------------------------------ */}
      <SectionHead title={t('home.quickActions')} />
      <div className="grid g3">
        {QUICK.map((q) => (
          <button key={q.route} className="action" onClick={() => navigate(q.route)} type="button">
            <span className="ico">
              <Icon name={q.icon} size={19} />
            </span>
            {t(q.key)}
          </button>
        ))}
      </div>

      {/* Documents ---------------------------------------------------------- */}
      {expiring.length > 0 && (
        <>
          <SectionHead title={t('home.importantDocs')} action={{ label: t('common.seeAll'), onClick: () => navigate('/vault') }} />
          <div className="list card-list">
            {expiring.map((d) => (
              <ListRow
                key={d.id}
                icon="doc"
                iconTone={daysUntil(d.expiresAt!) < 30 ? 'warn' : 'default'}
                title={d.name}
                sub={`${d.issuer} · ${t('common.expires')} in ${daysUntil(d.expiresAt!)} days`}
                end={<Icon name="chevron" size={16} className="chevron" />}
                onClick={() => navigate('/vault')}
              />
            ))}
          </div>
        </>
      )}

      {/* Recent activity ---------------------------------------------------- */}
      <SectionHead title={t('home.recentActivity')} action={{ label: t('common.seeAll'), onClick: () => navigate('/money') }} />
      {load.banking === 'loading' ? (
        <Card>
          <SkeletonList rows={4} />
        </Card>
      ) : recent.length === 0 ? (
        <Card flat pad="sm">
          <p className="t-sm muted">No activity yet.</p>
        </Card>
      ) : (
        <div className="list card-list">
          {recent.map((tx) => {
            const meta = CATEGORY_META[tx.category];
            return (
              <ListRow
                key={tx.id}
                icon={meta.icon as IconName}
                title={tx.merchant}
                sub={`${meta.label} · ${relativeDay(tx.date, intlLocale)}`}
                end={money(tx.amount, { sign: tx.amount > 0, locale: intlLocale })}
                tone={tx.amount > 0 ? 'positive' : undefined}
                endSub={tx.status === 'pending' ? 'Pending' : undefined}
                onClick={() => navigate('/money')}
              />
            );
          })}
        </div>
      )}

      <p className="t-sm subtle center" style={{ marginTop: 'var(--s7)', paddingInline: 'var(--s5)' }}>
        {t('brand.promise')}
      </p>
    </div>
  );
}
