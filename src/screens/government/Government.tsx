import React, { useMemo, useState } from 'react';
import { Icon, type IconName } from '../../components/Icon';
import { Badge, Card, Disclaimer, EmptyState, ErrorState, ListRow, SearchField, SectionHead, SkeletonList, StatusBadge, TopBar } from '../../components/ui';
import { navigate } from '../../lib/router';
import { useApp } from '../../state/store';
import type { GovCategory as Cat } from '../../integrations/types';
import type { StringKey } from '../../i18n/strings';

export const CATEGORIES: { id: Cat; icon: IconName; key: StringKey; tone: string }[] = [
  { id: 'personal', icon: 'id-card', key: 'gov.cat.personal', tone: 'var(--c1)' },
  { id: 'tax', icon: 'receipt', key: 'gov.cat.tax', tone: 'var(--c2)' },
  { id: 'social', icon: 'users', key: 'gov.cat.social', tone: 'var(--c3)' },
  { id: 'vehicles', icon: 'car', key: 'gov.cat.vehicles', tone: 'var(--c6)' },
  { id: 'health', icon: 'heart', key: 'gov.cat.health', tone: 'var(--c4)' },
  { id: 'business', icon: 'briefcase', key: 'gov.cat.business', tone: 'var(--c5)' },
  { id: 'other', icon: 'grid', key: 'gov.cat.other', tone: 'var(--c8)' },
];

export function Government() {
  const { state, t, refresh } = useApp();
  const [q, setQ] = useState('');
  const { services, applications, notifications, load } = state;

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return services
      .filter(
        (s) =>
          s.name.toLowerCase().includes(needle) ||
          s.department.toLowerCase().includes(needle) ||
          s.description.toLowerCase().includes(needle) ||
          s.keywords.some((k) => k.includes(needle)),
      )
      .slice(0, 12);
  }, [q, services]);

  const govNotifications = notifications.filter((n) => n.stream === 'government' && !n.read);
  const openApplications = applications.filter((a) => a.state !== 'approved' && a.state !== 'rejected');

  const countFor = (cat: Cat) => services.filter((s) => s.category === cat).length;

  return (
    <>
      <TopBar
        title={t('gov.title')}
        right={
          <button className="iconbtn" onClick={() => navigate('/notifications')} aria-label={t('notif.title')} type="button">
            <Icon name="bell" size={18} />
            {govNotifications.length > 0 && <span className="dot" />}
          </button>
        }
      />
      <div className="page">
        <SearchField value={q} onChange={setQ} placeholder={t('gov.searchPlaceholder')} />

        {q ? (
          <div className="mt5">
            {results.length === 0 ? (
              <EmptyState icon="search" title={t('gov.noResults')} body="Try a different term, or browse by category." />
            ) : (
              <div className="list card-list">
                {results.map((s) => (
                  <ListRow
                    key={s.id}
                    icon={CATEGORIES.find((c) => c.id === s.category)?.icon ?? 'gov'}
                    title={s.name}
                    sub={s.department}
                    end={<StatusBadge status={s.status} compact />}
                    onClick={() => navigate(`/gov/service/${s.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {load.government === 'error' ? (
              <Card className="mt5">
                <ErrorState message={state.errors.government} onRetry={() => refresh('government')} />
              </Card>
            ) : load.government === 'loading' ? (
              <Card className="mt5">
                <SkeletonList rows={5} />
              </Card>
            ) : (
              <>
                {govNotifications.length > 0 && (
                  <Card
                    className="mt5"
                    pad="sm"
                    onClick={() => navigate('/notifications')}
                  >
                    <div className="row">
                      <span className="avatar-ico warn">
                        <Icon name="bell" size={19} />
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ font: '500 15px/1.2 var(--font)' }}>
                          {govNotifications.length} {t('home.notificationsCount')}
                        </div>
                        <div className="t-sm muted truncate mt1">{govNotifications[0].title}</div>
                      </div>
                      <Icon name="chevron" size={17} className="chevron" />
                    </div>
                  </Card>
                )}

                <SectionHead title={t('gov.categories')} />
                <div className="grid g2">
                  {CATEGORIES.map((c) => (
                    <Card key={c.id} pad="sm" onClick={() => navigate(`/gov/category/${c.id}`)}>
                      <span
                        className="avatar-ico"
                        style={{ background: `color-mix(in srgb, ${c.tone} 16%, transparent)`, color: c.tone }}
                      >
                        <Icon name={c.icon} size={20} />
                      </span>
                      <div style={{ font: '500 15px/1.25 var(--font)', marginTop: 12 }}>{t(c.key)}</div>
                      <div className="t-sm subtle mt1">{countFor(c.id)} services</div>
                    </Card>
                  ))}
                </div>

                <SectionHead
                  title={t('gov.myApplications')}
                  action={{ label: t('common.seeAll'), onClick: () => navigate('/gov/applications') }}
                />
                {applications.length === 0 ? (
                  <Card flat pad="sm">
                    <p className="t-sm muted">You have no applications yet.</p>
                  </Card>
                ) : (
                  <div className="list card-list">
                    {(openApplications.length ? openApplications : applications).slice(0, 3).map((a) => (
                      <ListRow
                        key={a.id}
                        icon="doc"
                        iconTone={a.state === 'action-required' ? 'warn' : a.state === 'approved' ? 'ok' : 'sea'}
                        title={a.serviceName}
                        sub={`${a.department} · ${a.reference}`}
                        end={
                          <Badge tone={a.state === 'action-required' ? 'warn' : a.state === 'approved' ? 'ok' : 'info'}>
                            {a.state.replace('-', ' ')}
                          </Badge>
                        }
                        onClick={() => navigate('/gov/applications')}
                      />
                    ))}
                  </div>
                )}

                <SectionHead title="Frequently used" />
                <div className="list card-list">
                  {['veh-road-tax', 'tax-return', 'hea-ghs', 'per-id-card', 'soc-contributions']
                    .map((id) => services.find((s) => s.id === id))
                    .filter(Boolean)
                    .map((s) => (
                      <ListRow
                        key={s!.id}
                        icon={CATEGORIES.find((c) => c.id === s!.category)?.icon ?? 'gov'}
                        title={s!.name}
                        sub={s!.department}
                        end={<StatusBadge status={s!.status} compact />}
                        onClick={() => navigate(`/gov/service/${s!.id}`)}
                      />
                    ))}
                </div>

                <div className="mt5">
                  <Disclaimer>
                    Every service carries a badge. <strong>Official API</strong> appears only where a live integration
                    is configured — nothing in this build qualifies. <strong>Official website</strong> means Nisos hands
                    you to the government's own site; <strong>Coming soon</strong> means the adapter exists but the
                    agreement does not yet.
                  </Disclaimer>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
