import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Button, Card, Disclaimer, EmptyState, ListRow, ResultState, SectionHead, Sheet, StatusBadge, TopBar } from '../../components/ui';
import { navigate } from '../../lib/router';
import { money } from '../../lib/format';
import { useApp } from '../../state/store';
import { registry } from '../../integrations/registry';
import { STATUS_LABEL } from '../../integrations/config';
import type { GovApplication } from '../../integrations/types';

export function ServiceDetail({ id }: { id: string }) {
  const { state, dispatch, t, intlLocale, toast } = useApp();
  const service = state.services.find((s) => s.id === id);
  const [phase, setPhase] = useState<'idle' | 'submitting' | 'done' | 'blocked'>('idle');
  const [created, setCreated] = useState<GovApplication | null>(null);
  const [reason, setReason] = useState<string>();

  if (!service) {
    return (
      <>
        <TopBar title={t('gov.title')} onBack />
        <div className="page">
          <EmptyState title="Service not found" action={{ label: t('common.back'), onClick: () => navigate('/gov') }} />
        </div>
      </>
    );
  }

  const apply = async () => {
    setPhase('submitting');
    try {
      const app = await registry.ports.government.submitApplication(service.id);
      const local = { ...app, id: `app_local_${app.id}` };
      dispatch({ type: 'addApplication', app: local });
      dispatch({
        type: 'addDataAccessEvent',
        event: {
          id: `access_${local.id}`,
          at: local.submittedAt,
          category: 'government',
          actor: local.department,
          action: `Submitted ${local.serviceName}`,
          detail: `Reference ${local.reference}`,
        },
      });
      setCreated(local);
      setPhase('done');
    } catch (err) {
      setReason(err instanceof Error ? err.message : t('gov.noApi'));
      setPhase('blocked');
    }
  };

  // Cross-reference required documents against the citizen's vault.
  const haveDoc = (name: string) =>
    state.documents.some((d) => d.name.toLowerCase().includes(name.toLowerCase().split(' ')[0]));

  return (
    <>
      <TopBar title={t('gov.title')} onBack />
      <div className="page">
        <div className="row" style={{ gap: 8, marginBottom: 'var(--s3)' }}>
          <StatusBadge status={service.status} />
          {service.fee !== undefined && (
            <Badge tone={service.fee ? 'default' : 'ok'}>
              {service.fee ? money(service.fee, { locale: intlLocale }) : t('common.free')}
            </Badge>
          )}
        </div>
        <h1 className="t-h1">{service.name}</h1>
        <p className="t-sm muted mt2">{service.department}</p>
        <p className="mt4">{service.description}</p>

        <Card className="mt5" pad="sm">
          <div className="list">
            <ListRow icon="building" title={t('gov.department')} end={<span className="t-sm truncate" style={{ maxWidth: 150 }}>{service.department}</span>} />
            {service.processingTime && <ListRow icon="clock" title={t('gov.processingTime')} end={service.processingTime} />}
            <ListRow
              icon="link"
              title="Integration"
              end={<StatusBadge status={service.status} compact />}
              endSub={STATUS_LABEL[service.status]}
            />
          </div>
        </Card>

        {service.requiredDocuments.length > 0 && (
          <>
            <SectionHead title={t('gov.requiredDocs')} />
            <div className="list card-list">
              {service.requiredDocuments.map((doc) => {
                const have = haveDoc(doc);
                return (
                  <ListRow
                    key={doc}
                    icon={have ? 'check-circle' : 'doc'}
                    iconTone={have ? 'ok' : 'default'}
                    title={doc}
                    sub={have ? 'Found in your vault' : 'Not in your vault'}
                    end={
                      have ? (
                        <Badge tone="ok">Ready</Badge>
                      ) : (
                        <button className="btn quiet sm" onClick={() => navigate('/vault')} type="button">
                          {t('common.add')}
                        </button>
                      )
                    }
                  />
                );
              })}
            </div>
          </>
        )}

        <div className="grid mt6" style={{ gap: 10 }}>
          {service.status === 'coming-soon' || service.status === 'official-api' ? (
            <Button block icon="send" onClick={apply}>
              {t('gov.apply')}
            </Button>
          ) : null}
          {service.website && (
            <a className="btn secondary block" href={service.website} target="_blank" rel="noopener noreferrer">
              <Icon name="external" size={17} />
              {t('common.openOfficialSite')}
            </a>
          )}
          <Button variant="outline" block icon="bell" onClick={() => toast('Reminder set (prototype only).')}>
            Remind me about this
          </Button>
        </div>

        {service.fee ? (
          <div className="mt5">
            <Disclaimer icon="info">{t('gov.feeNotice')}</Disclaimer>
          </div>
        ) : null}

        <div className="mt4">
          <Disclaimer icon="shield">
            {service.status === 'official-api'
              ? 'A live integration is configured for this service.'
              : service.status === 'official-link'
                ? 'Nisos has no API for this service. The button above opens the official government website, where the service is delivered.'
                : 'The adapter for this service exists in the integration layer, but no data-sharing agreement is in place, so nothing is submitted to a department.'}
          </Disclaimer>
        </div>
      </div>

      <Sheet open={phase !== 'idle'} onClose={() => setPhase('idle')}>
        {phase === 'submitting' && (
          <div className="center" style={{ padding: 'var(--s7) 0' }}>
            <span className="spinner" style={{ width: 30, height: 30, margin: '0 auto', display: 'block' }} />
            <p className="t-sm muted mt4">Submitting application…</p>
          </div>
        )}
        {phase === 'done' && created && (
          <ResultState
            title="Application started"
            body={
              <>
                Reference <strong>{created.reference}</strong>. This is a simulated submission recorded on your device —
                no department has received anything.
              </>
            }
          >
            <div className="grid" style={{ width: '100%', marginTop: 'var(--s6)', gap: 10 }}>
              <Button block onClick={() => navigate('/gov/applications')}>
                Track application
              </Button>
              <Button variant="secondary" block onClick={() => setPhase('idle')}>
                {t('common.close')}
              </Button>
            </div>
          </ResultState>
        )}
        {phase === 'blocked' && (
          <ResultState tone="info" title="Continue on the official site" body={reason}>
            <div className="grid" style={{ width: '100%', marginTop: 'var(--s6)', gap: 10 }}>
              {service.website && (
                <a className="btn block" href={service.website} target="_blank" rel="noopener noreferrer">
                  <Icon name="external" size={17} />
                  {t('common.openOfficialSite')}
                </a>
              )}
              <Button variant="secondary" block onClick={() => setPhase('idle')}>
                {t('common.close')}
              </Button>
            </div>
          </ResultState>
        )}
      </Sheet>
    </>
  );
}
