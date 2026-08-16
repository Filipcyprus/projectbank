import React, { useState } from 'react';
import { Badge, Card, Disclaimer, EmptyState, ListRow, Sheet, StatusBadge, TopBar, Button } from '../../components/ui';
import { navigate } from '../../lib/router';
import { dateShort, relativeDay } from '../../lib/format';
import { useApp } from '../../state/store';
import type { ApplicationState, GovApplication } from '../../integrations/types';

const TONE: Record<ApplicationState, 'default' | 'ok' | 'warn' | 'danger' | 'info'> = {
  draft: 'default',
  submitted: 'info',
  'in-review': 'info',
  'action-required': 'warn',
  approved: 'ok',
  rejected: 'danger',
};

export function Applications() {
  const { state, t, intlLocale } = useApp();
  const [open, setOpen] = useState<GovApplication | null>(null);

  return (
    <>
      <TopBar title={t('gov.myApplications')} onBack />
      <div className="page">
        {state.applications.length === 0 ? (
          <EmptyState
            icon="doc"
            title="No applications yet"
            body="When you start a government application it appears here with its progress."
            action={{ label: t('gov.allServices'), onClick: () => navigate('/gov') }}
          />
        ) : (
          <div className="list card-list">
            {state.applications.map((a) => (
              <ListRow
                key={a.id}
                icon="doc"
                iconTone={a.state === 'action-required' ? 'warn' : a.state === 'approved' ? 'ok' : 'sea'}
                title={a.serviceName}
                sub={`${a.department} · ${relativeDay(a.updatedAt, intlLocale)}`}
                end={<Badge tone={TONE[a.state]}>{a.state.replace('-', ' ')}</Badge>}
                onClick={() => setOpen(a)}
              />
            ))}
          </div>
        )}

        <div className="mt5">
          <Disclaimer>
            Application tracking is simulated. Real status updates require a department integration; until then Nisos
            can only remind you to check the official portal.
          </Disclaimer>
        </div>
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.serviceName}>
        {open && (
          <>
            <div className="row" style={{ gap: 8, marginBottom: 'var(--s5)' }}>
              <Badge tone={TONE[open.state]}>{open.state.replace('-', ' ')}</Badge>
              <StatusBadge status={open.source} />
            </div>
            <Card flat pad="sm" className="mb5">
              <div className="row-between">
                <span className="t-sm muted">Reference</span>
                <span className="t-sm num" style={{ fontWeight: 600 }}>
                  {open.reference}
                </span>
              </div>
              <div className="row-between mt3">
                <span className="t-sm muted">Department</span>
                <span className="t-sm truncate" style={{ maxWidth: 190, textAlign: 'end' }}>
                  {open.department}
                </span>
              </div>
              <div className="row-between mt3">
                <span className="t-sm muted">Submitted</span>
                <span className="t-sm">{dateShort(open.submittedAt, intlLocale)}</span>
              </div>
            </Card>

            <ol className="timeline">
              {open.timeline.map((node, i) => (
                <li key={i} className={`node${node.done ? ' done' : i === open.timeline.findIndex((n) => !n.done) ? ' active' : ''}`}>
                  <div style={{ font: '500 14px/1.3 var(--font)' }}>{node.label}</div>
                  <div className="t-sm muted mt1">{node.at ? dateShort(node.at, intlLocale) : 'Pending'}</div>
                </li>
              ))}
            </ol>

            {open.state === 'action-required' && (
              <Button block className="mt4" icon="upload" onClick={() => navigate('/vault')}>
                Upload the requested document
              </Button>
            )}
            <Button variant="secondary" block className="mt3" onClick={() => navigate(`/gov/service/${open.serviceId}`)}>
              View service details
            </Button>
          </>
        )}
      </Sheet>
    </>
  );
}
