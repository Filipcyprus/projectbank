import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Card, Chip, EmptyState, ListRow, SearchField, StatusBadge, TopBar } from '../../components/ui';
import { navigate } from '../../lib/router';
import { useApp } from '../../state/store';
import { CATEGORIES } from './Government';
import type { GovCategory as Cat, IntegrationStatus } from '../../integrations/types';

export function GovCategory({ category }: { category: string }) {
  const { state, t } = useApp();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<IntegrationStatus | 'all'>('all');

  const meta = CATEGORIES.find((c) => c.id === category);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.services
      .filter((s) => s.category === (category as Cat))
      .filter((s) => (statusFilter === 'all' ? true : s.status === statusFilter))
      .filter(
        (s) =>
          !needle ||
          s.name.toLowerCase().includes(needle) ||
          s.keywords.some((k) => k.includes(needle)) ||
          s.department.toLowerCase().includes(needle),
      );
  }, [state.services, category, q, statusFilter]);

  return (
    <>
      <TopBar title={meta ? t(meta.key) : t('gov.allServices')} onBack />
      <div className="page">
        <SearchField value={q} onChange={setQ} placeholder={t('gov.searchPlaceholder')} />

        <div className="row wrap" style={{ gap: 8, marginTop: 'var(--s4)' }}>
          <Chip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
            {t('common.all')}
          </Chip>
          <Chip active={statusFilter === 'official-link'} onClick={() => setStatusFilter('official-link')}>
            {t('status.official-link')}
          </Chip>
          <Chip active={statusFilter === 'coming-soon'} onClick={() => setStatusFilter('coming-soon')}>
            {t('status.coming-soon')}
          </Chip>
        </div>

        {category === 'tax' && !q && (
          <Card pad="sm" className="mt5" onClick={() => navigate('/gov/tax-estimate')}>
            <div className="row">
              <span className="avatar-ico accent">
                <Icon name="calculator" size={19} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ font: '500 15px/1.2 var(--font)' }}>Tax estimate calculator</div>
                <div className="t-sm muted mt1">Illustrative — using the public 2026 income tax bands</div>
              </div>
              <Icon name="chevron" size={17} className="chevron" />
            </div>
          </Card>
        )}

        <div className="mt5">
          {rows.length === 0 ? (
            <EmptyState icon="search" title={t('gov.noResults')} body="Try clearing the filters." />
          ) : (
            <div className="list card-list">
              {rows.map((s) => (
                <ListRow
                  key={s.id}
                  icon={meta?.icon ?? 'gov'}
                  title={s.name}
                  sub={s.department}
                  end={<StatusBadge status={s.status} compact />}
                  endSub={s.fee ? `€${s.fee}` : t('common.free')}
                  onClick={() => navigate(`/gov/service/${s.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
