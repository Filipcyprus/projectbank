import React, { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';
import { BiometricGate, DemoQr } from '../../components/auth';
import { Badge, Button, Card, CheckBox, Disclaimer, Field, SectionHead, StatusBadge, TopBar } from '../../components/ui';
import { back } from '../../lib/router';
import { useApp } from '../../state/store';
import { registry } from '../../integrations/registry';
import { assertSharingAllowed } from '../../lib/guard';
import type { IdentityPresentation } from '../../integrations/types';

/** Selective disclosure: the citizen releases claims, not documents. */
const CLAIMS: { id: string; label: string; detail: string; sensitive?: boolean }[] = [
  { id: 'name', label: 'Full name', detail: 'Filip Andreou' },
  { id: 'over18', label: 'Over 18', detail: 'Proves age without revealing your birth date' },
  { id: 'identityVerified', label: 'Identity verified', detail: 'A yes/no assurance statement' },
  { id: 'dateOfBirth', label: 'Date of birth', detail: 'Exact date', sensitive: true },
  { id: 'nationality', label: 'Nationality', detail: 'Cypriot' },
  { id: 'idNumber', label: 'Civil registry number', detail: 'Rarely needed — think before sharing', sensitive: true },
  { id: 'address', label: 'Address', detail: 'Town and country only', sensitive: true },
];

const PRESETS: { label: string; claims: string[] }[] = [
  { label: 'Age check', claims: ['over18'] },
  { label: 'Hotel check-in', claims: ['name', 'over18', 'identityVerified'] },
  { label: 'Bank onboarding', claims: ['name', 'dateOfBirth', 'nationality', 'identityVerified'] },
];

export function ShareIdentity() {
  const { state, dispatch, t, toast } = useApp();
  const [selected, setSelected] = useState<string[]>(['name', 'over18', 'identityVerified']);
  const [audience, setAudience] = useState('Coastline Fitness — membership desk');
  const [gate, setGate] = useState(false);
  const [presentation, setPresentation] = useState<IdentityPresentation | null>(null);
  const [creating, setCreating] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);

  useEffect(() => {
    if (!presentation) return;
    setSecondsLeft(300);
    const id = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [presentation]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const create = async () => {
    setGate(false);
    setCreating(true);
    try {
      assertSharingAllowed(state.security);
      const vp = await registry.ports.identity.createPresentation(selected, audience);
      setPresentation(vp);
      dispatch({
        type: 'addIdentityShare',
        share: {
          id: vp.id,
          createdAt: vp.createdAt,
          expiresAt: vp.expiresAt,
          audience: vp.audience,
          claims: selected.map((id) => CLAIMS.find((c) => c.id === id)?.label ?? id),
          status: 'active',
        },
      });
      dispatch({
        type: 'addDataAccessEvent',
        event: {
          id: `access_${vp.id}`,
          at: vp.createdAt,
          category: 'identity',
          actor: audience,
          action: `Released ${selected.length} field${selected.length === 1 ? '' : 's'} of your Digital ID`,
          detail: selected.map((id) => CLAIMS.find((c) => c.id === id)?.label ?? id).join(', '),
        },
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create the share code.', 'error');
    }
    setCreating(false);
  };

  if (presentation) {
    return (
      <>
        <TopBar title={t('id.presentationReady')} onBack={() => setPresentation(null)} />
        <div className="page">
          <div className="center">
            <div className="qr-frame">
              <DemoQr payload={presentation.id} />
            </div>
            <div className="row" style={{ justifyContent: 'center', gap: 8, marginTop: 'var(--s5)' }}>
              <Badge tone={secondsLeft < 60 ? 'warn' : 'info'}>
                <Icon name="clock" size={12} /> {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
              </Badge>
              <StatusBadge status={registry.descriptorFor('identity').status} />
            </div>
          </div>

          <SectionHead title="Exactly what is shared" />
          <Card pad="sm">
            <div className="grid" style={{ gap: 12 }}>
              {Object.entries(presentation.claims).map(([k, v]) => {
                const meta = CLAIMS.find((c) => c.id === k);
                return (
                  <div key={k} className="row">
                    <Icon name="check" size={16} style={{ color: 'var(--ok-500)', flex: 'none' }} />
                    <span className="t-sm" style={{ flex: 1 }}>
                      {meta?.label ?? k}
                    </span>
                    <span className="t-sm muted truncate" style={{ maxWidth: 130 }}>
                      {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card flat pad="sm" className="mt4">
            <div className="row-between">
              <span className="t-sm muted">Shared with</span>
              <span className="t-sm truncate" style={{ maxWidth: 190, textAlign: 'end' }}>
                {presentation.audience}
              </span>
            </div>
          </Card>

          <div className="grid mt5" style={{ gap: 10 }}>
            <Button
              variant="danger"
              block
              icon="x"
              onClick={() => {
                dispatch({ type: 'revokeIdentityShare', id: presentation.id });
                setPresentation(null);
                toast('Share code revoked.');
              }}
            >
              Revoke this code
            </Button>
            <Button variant="secondary" block onClick={() => back()}>
              {t('common.done')}
            </Button>
          </div>

          <div className="mt5">
            <Disclaimer icon="shield">
              Nothing beyond the fields listed above is released, and the code stops working after five minutes. The
              verifier never receives a copy of your identity document.
            </Disclaimer>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title={t('id.shareSelected')} onBack />
      <div className="page">
        <p className="t-sm muted">{t('id.shareHint')}</p>

        <SectionHead title="Common presets" />
        <div className="row wrap" style={{ gap: 8 }}>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className="chip"
              aria-pressed={p.claims.length === selected.length && p.claims.every((c) => selected.includes(c))}
              onClick={() => setSelected(p.claims)}
              type="button"
            >
              {p.label}
            </button>
          ))}
        </div>

        <SectionHead title="Information" />
        <div className="list card-list">
          {CLAIMS.map((c) => (
            <div key={c.id} className="list-row">
              <CheckBox checked={selected.includes(c.id)} onChange={() => toggle(c.id)} label={c.label} />
              <div className="body">
                <div className="title">
                  {c.label}
                  {c.sensitive && (
                    <span className="badge warn" style={{ marginInlineStart: 8 }}>
                      Sensitive
                    </span>
                  )}
                </div>
                <div className="sub">{c.detail}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt5">
          <Field label="Who are you sharing with?" hint="Recorded so you can see later who received what.">
            <input className="input" value={audience} onChange={(e) => setAudience(e.target.value)} />
          </Field>
        </div>

        <Card flat pad="sm">
          <div className="row">
            <Icon name="eye-off" size={17} style={{ color: 'var(--ok-500)', flex: 'none' }} />
            <span className="t-sm muted">
              {CLAIMS.length - selected.length} of {CLAIMS.length} fields stay private.
            </span>
          </div>
        </Card>

        {state.security.accountFrozen ? (
          <Disclaimer icon="alert">
            Identity sharing is suspended while your account is frozen. Unfreeze it in Security first.
          </Disclaimer>
        ) : (
          <Button
            block
            className="mt5"
            icon="lock"
            loading={creating}
            disabled={selected.length === 0}
            onClick={() => setGate(true)}
          >
            Create share code
          </Button>
        )}

        <div className="mt5">
          <Disclaimer icon="shield">{t('id.disclaimer')}</Disclaimer>
        </div>
      </div>

      <BiometricGate
        open={gate}
        title={t('pay.confirmBiometric')}
        reason={`Release ${selected.length} field${selected.length === 1 ? '' : 's'} to ${audience}`}
        onSuccess={create}
        onCancel={() => setGate(false)}
      />
    </>
  );
}
