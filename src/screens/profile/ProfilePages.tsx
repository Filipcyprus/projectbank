import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { DemoQr } from '../../components/auth';
import { Badge, Button, Card, Disclaimer, EmptyState, Field, ListRow, SectionHead, Segmented, Sheet, StatusBadge, Switch, TopBar } from '../../components/ui';
import { navigate } from '../../lib/router';
import { dateShort, initials, relativeDay, timeShort } from '../../lib/format';
import { useApp, type FamilyMember } from '../../state/store';
import { LOCALES } from '../../i18n/strings';
import { institutions } from '../../data/seed';
import { registry } from '../../integrations/registry';
import { isPrototypeMode } from '../../integrations/config';
import { buildSyncPayload, decodeSyncCode, encodeSyncCode, SyncCodeError } from '../../lib/sync';

export function PersonalInfo() {
  const { state, dispatch, t, intlLocale, toast } = useApp();
  return (
    <>
      <TopBar title={t('profile.personal')} onBack />
      <div className="page">
        <Field label="Full name">
          <input className="input" value={state.user.name} onChange={(e) => dispatch({ type: 'user', patch: { name: e.target.value } })} />
        </Field>
        <Field label="Email" hint="Changing this would require re-verification in production.">
          <input className="input" value={state.user.email} onChange={(e) => dispatch({ type: 'user', patch: { email: e.target.value } })} />
        </Field>
        <Field label="Mobile">
          <input className="input" value={state.user.phone} onChange={(e) => dispatch({ type: 'user', patch: { phone: e.target.value } })} />
        </Field>

        <SectionHead title="From your Digital ID" />
        <div className="list card-list">
          <ListRow icon="id-card" title="Date of birth" end={state.identity ? dateShort(state.identity.dateOfBirth, intlLocale) : '—'} />
          <ListRow icon="globe" title="Nationality" end={state.identity?.nationality ?? '—'} />
          <ListRow icon="shield" title="Assurance" end={state.identity?.assuranceLevel ?? '—'} />
          <ListRow icon="link" title="Source" end={<StatusBadge status="demo" compact />} />
        </div>

        <Button block className="mt5" onClick={() => toast('Saved on this device.')}>
          {t('common.save')}
        </Button>

        <div className="mt5">
          <Disclaimer icon="lock">
            Fields sourced from your Digital ID cannot be edited by hand — they come from the identity provider, which
            is what makes them trustworthy to a verifier.
          </Disclaimer>
        </div>
      </div>
    </>
  );
}

export function LanguageScreen() {
  const { state, dispatch, t } = useApp();
  return (
    <>
      <TopBar title={t('profile.language')} onBack />
      <div className="page">
        <div className="list card-list">
          {LOCALES.map((l) => (
            <ListRow
              key={l.code}
              icon="globe"
              iconTone={state.prefs.locale === l.code ? 'accent' : 'default'}
              title={l.native}
              sub={`${l.name} · ${l.dir.toUpperCase()}`}
              end={state.prefs.locale === l.code ? <Icon name="check" size={18} style={{ color: 'var(--accent)' }} /> : undefined}
              onClick={() => dispatch({ type: 'prefs', patch: { locale: l.code } })}
            />
          ))}
        </div>

        <SectionHead title="Layout direction" />
        <Card>
          <div className="row-between">
            <div style={{ flex: 1 }}>
              <div style={{ font: '500 15px/1.3 var(--font)' }}>Right-to-left preview</div>
              <p className="t-sm muted mt2">
                None of the three shipped languages is written right to left, but the whole interface is built with
                logical properties. Turn this on to mirror the layout and confirm an RTL locale would need no redesign.
              </p>
            </div>
          </div>
          <div className="row-between mt4">
            <span className="t-sm">Mirror layout</span>
            <Switch
              checked={state.prefs.rtlPreview}
              label="Right-to-left preview"
              onChange={(v) => dispatch({ type: 'prefs', patch: { rtlPreview: v } })}
            />
          </div>
        </Card>

        <div className="mt5">
          <Disclaimer>
            Greek and Turkish translations here cover the interface strings. A production release would need
            professional translation and legal review of every government term.
          </Disclaimer>
        </div>
      </div>
    </>
  );
}

export function PrivacyScreen() {
  const { t, toast } = useApp();
  return (
    <>
      <TopBar title={t('profile.privacy')} onBack />
      <div className="page">
        <SectionHead title="What Nisos holds" />
        <div className="list card-list">
          <ListRow icon="phone" title="On your device" sub="Documents, identity credential, preferences, PIN hash" end={<Badge tone="ok">Encrypted</Badge>} />
          <ListRow icon="database" title="On the server" sub="Account record and ciphertext blobs only" end={<Badge tone="ok">Zero-knowledge</Badge>} />
          <ListRow icon="activity" title="Analytics" sub="Event names only — no amounts, no identifiers" end={<StatusBadge status="demo" compact />} />
        </div>

        <SectionHead title="Your rights" />
        <div className="list card-list">
          <ListRow icon="download" title="Export my data" sub="Machine-readable copy of everything" chevron onClick={() => toast('Export is not implemented in the prototype.')} />
          <ListRow icon="eye" title="Sharing history" sub="Who received which identity claims" chevron onClick={() => toast('Sharing history is not implemented in the prototype.')} />
          <ListRow icon="trash" title="Delete my account" sub="Erases the account and all stored ciphertext" chevron onClick={() => toast('Deletion is not implemented in the prototype.')} />
        </div>

        <div className="mt5">
          <Disclaimer icon="shield">
            A real deployment operates under the GDPR and Cyprus data-protection law: a lawful basis is recorded for
            every category of processing, government data is only requested with explicit consent, and identity claims
            are shared field by field rather than as whole documents.
          </Disclaimer>
        </div>
      </div>
    </>
  );
}

export function ConnectionsScreen({ kind }: { kind: 'banks' | 'gov' }) {
  const { t } = useApp();
  const rows = institutions.filter((i) => (kind === 'banks' ? i.type === 'bank' || i.type === 'psp' : i.type === 'government' || i.type === 'identity'));
  const descriptors = registry.descriptors().filter((d) => (kind === 'banks' ? ['banking', 'payments'].includes(d.kind) : ['government', 'identity', 'documents'].includes(d.kind)));

  return (
    <>
      <TopBar title={kind === 'banks' ? t('profile.banks') : t('profile.govServices')} onBack />
      <div className="page">
        <SectionHead title="Active adapters" />
        <div className="list card-list">
          {descriptors.map((d) => (
            <ListRow
              key={d.id}
              icon={d.kind === 'banking' ? 'database' : d.kind === 'payments' ? 'money' : d.kind === 'identity' ? 'id-card' : 'gov'}
              title={d.name}
              sub={d.operator}
              end={<StatusBadge status={d.status} compact />}
            />
          ))}
        </div>

        <SectionHead title="Planned connections" />
        <div className="list card-list">
          {rows.map((r) => (
            <ListRow key={r.id} icon="link" title={r.name} sub={r.note} end={<Badge tone="warn">{t('status.coming-soon')}</Badge>} />
          ))}
        </div>

        {kind === 'banks' && (
          <Button block className="mt5" icon="plus" onClick={() => navigate('/money/connect')}>
            {t('money.connectBank')}
          </Button>
        )}

        <div className="mt5">
          <Disclaimer icon="info">
            {isPrototypeMode
              ? 'No integration is configured in this build, so every adapter above is running in demo mode.'
              : 'Adapters marked Official API are configured with live credentials.'}
          </Disclaimer>
        </div>
      </div>
    </>
  );
}

export function SupportScreen() {
  const { t, toast } = useApp();
  return (
    <>
      <TopBar title={t('profile.support')} onBack />
      <div className="page">
        <div className="list card-list">
          <ListRow icon="help" iconTone="accent" title="Help centre" sub="Guides for every section" chevron onClick={() => toast('Help centre content is not part of the prototype.')} />
          <ListRow icon="mail" title="Message support" sub="Reply within one business day" chevron onClick={() => toast('Support messaging is not wired up.')} />
          <ListRow icon="phone" title="Call us" sub="Mon–Fri, 08:00–18:00 EET" chevron onClick={() => toast('Telephone support is not part of the prototype.')} />
          <ListRow icon="alert" iconTone="danger" title="Report fraud" sub="Freezes your account while we investigate" chevron onClick={() => navigate('/security')} />
        </div>

        <SectionHead title="Common questions" />
        <div className="grid" style={{ gap: 'var(--s3)' }}>
          {[
            ['Is my money real in this app?', 'No. This build has no banking licence and no payment provider connected. Balances and transfers are demo data.'],
            ['Can I use my Digital ID officially?', 'Not yet. Legally valid identity requires an accredited government identity provider to issue and sign the credential.'],
            ['Do you charge for government services?', 'Never. Statutory fees go to the department. Nisos would earn from premium features and merchant payments instead.'],
            ['Where are my documents stored?', 'Encrypted on your device. In production the server holds ciphertext only and cannot read them.'],
          ].map(([q, a]) => (
            <Card key={q} pad="sm">
              <div style={{ font: '500 14px/1.4 var(--font)' }}>{q}</div>
              <p className="t-sm muted mt2">{a}</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

export function TermsScreen() {
  const { t } = useApp();
  return (
    <>
      <TopBar title={t('profile.terms')} onBack />
      <div className="page">
        <div className="list card-list">
          <ListRow icon="doc" title="Terms of service" sub="Draft — prototype only" chevron />
          <ListRow icon="lock" title="Privacy policy" sub="Draft — prototype only" chevron />
          <ListRow icon="shield" title="Security statement" sub="Architecture and controls" chevron />
          <ListRow icon="info" title="Open-source licences" sub="React, and nothing else" chevron />
        </div>

        <SectionHead title="Status of this build" />
        <Card>
          <div className="grid" style={{ gap: 12 }}>
            {[
              ['Banking licence', 'None'],
              ['Payment institution licence', 'None'],
              ['Open banking (AISP/PISP)', 'Not held'],
              ['Government agreements', 'None'],
              ['Identity accreditation', 'None'],
            ].map(([k, v]) => (
              <div key={k} className="row-between">
                <span className="t-sm muted">{k}</span>
                <Badge tone="warn">{v}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt5">
          <Disclaimer icon="alert">
            Nisos is a design and architecture prototype. Nothing in it constitutes a regulated financial service, and
            no data is exchanged with any government body.
          </Disclaimer>
        </div>
      </div>
    </>
  );
}

export function PlanScreen() {
  const { state, dispatch, t, toast } = useApp();
  const plans = [
    {
      id: 'free' as const,
      name: 'Free',
      price: '€0',
      period: 'forever',
      points: [
        'Digital ID and selective sharing',
        'All government services in the directory',
        'Document vault (2 GB)',
        'Bills, reminders and notifications',
        'One connected bank account',
      ],
    },
    {
      id: 'premium' as const,
      name: 'Premium',
      price: '€4.99',
      period: 'per month',
      points: [
        'Everything in Free',
        'Unlimited connected accounts',
        'Advanced spending analytics and budgets',
        'Priority support and faster document verification',
        'Family sharing for up to 4 people',
      ],
    },
    {
      id: 'business' as const,
      name: 'Business',
      price: '€14.99',
      period: 'per month',
      points: [
        'Company profile and employer services',
        'Merchant QR payments with settlement reporting',
        'Multi-user access with roles',
        'Bulk document handling and audit export',
        'API access for accounting tools',
      ],
    },
  ];

  return (
    <>
      <TopBar title={t('profile.plan')} onBack />
      <div className="page">
        <div className="grid" style={{ gap: 'var(--s4)' }}>
          {plans.map((p) => {
            const current = state.user.tier === p.id;
            return (
              <Card key={p.id} style={current ? { borderColor: 'var(--accent)' } : undefined}>
                <div className="row-between">
                  <div>
                    <div className="t-h3">{p.name}</div>
                    <div className="row" style={{ gap: 6, marginTop: 6 }}>
                      <span className="num" style={{ font: '600 24px/1 var(--font)' }}>
                        {p.price}
                      </span>
                      <span className="t-sm muted">{p.period}</span>
                    </div>
                  </div>
                  {current && <Badge tone="accent">Current</Badge>}
                </div>
                <ul className="grid mt4" style={{ gap: 8 }}>
                  {p.points.map((pt) => (
                    <li key={pt} className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                      <Icon name="check" size={15} style={{ color: 'var(--ok-500)', flex: 'none', marginTop: 2 }} />
                      <span className="t-sm">{pt}</span>
                    </li>
                  ))}
                </ul>
                {!current && (
                  <Button
                    variant="secondary"
                    block
                    className="mt4"
                    onClick={() => {
                      dispatch({ type: 'user', patch: { tier: p.id } });
                      toast(`Switched to ${p.name} (prototype — no billing).`);
                    }}
                  >
                    Switch to {p.name}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt5">
          <Disclaimer icon="info">
            Government services stay free on every plan. Charging citizens for access to a legally free public service
            is not something Nisos will do — the business model rests on premium personal features, business accounts,
            merchant payments and institutional partnerships.
          </Disclaimer>
        </div>
      </div>
    </>
  );
}

const FAMILY_LIMIT = 4;

export function FamilyScreen() {
  const { state, dispatch, t, intlLocale, toast } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<FamilyMember['role']>('adult');
  const [remove, setRemove] = useState<FamilyMember | null>(null);

  const eligible = state.user.tier !== 'free';
  const members = state.familyMembers;
  const atLimit = members.length >= FAMILY_LIMIT;

  const invite = () => {
    const member: FamilyMember = {
      id: `fam_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim() || email.trim() || 'Family member',
      email: email.trim(),
      role,
      status: 'pending',
      addedAt: new Date().toISOString(),
    };
    dispatch({ type: 'addFamilyMember', member });
    toast(`Invite sent to ${member.name} (simulated — no email is sent).`);
    setName('');
    setEmail('');
    setRole('adult');
    setAddOpen(false);

    // Simulate the invite being accepted, the way a real deployment would
    // move a member from "pending" to "accepted" once they follow the link.
    window.setTimeout(
      () => dispatch({ type: 'updateFamilyMember', id: member.id, patch: { status: 'accepted' } }),
      3000 + Math.random() * 2000,
    );
  };

  if (!eligible) {
    return (
      <>
        <TopBar title="Family sharing" onBack />
        <div className="page">
          <EmptyState
            icon="users"
            title="A Premium feature"
            body="Share government reminders, a document vault and spending visibility with up to four people on your plan."
            action={{ label: 'View plans', onClick: () => navigate('/profile/plan') }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Family sharing" onBack />
      <div className="page">
        <p className="t-sm muted">
          Invite up to {FAMILY_LIMIT} people. Each gets their own Digital ID and PIN, plus visibility you choose into
          shared bills and documents.
        </p>

        <SectionHead title={`Members (${members.length}/${FAMILY_LIMIT})`} />
        {members.length === 0 ? (
          <EmptyState
            icon="users"
            title="Nobody added yet"
            body="Invite a family member by name and email."
            action={{ label: 'Add family member', onClick: () => setAddOpen(true) }}
          />
        ) : (
          <div className="list card-list">
            {members.map((m) => (
              <ListRow
                key={m.id}
                emoji={initials(m.name)}
                title={m.name}
                sub={`${m.email || 'No email on file'} · ${m.role === 'child' ? 'Child' : 'Adult'}`}
                end={
                  <Badge tone={m.status === 'accepted' ? 'ok' : 'warn'} dot>
                    {m.status === 'accepted' ? 'Active' : 'Invite pending'}
                  </Badge>
                }
                endSub={relativeDay(m.addedAt, intlLocale)}
                onClick={() => setRemove(m)}
              />
            ))}
          </div>
        )}

        {!atLimit && (
          <Button variant="secondary" block icon="plus" className="mt5" onClick={() => setAddOpen(true)}>
            Add family member
          </Button>
        )}

        <div className="mt5">
          <Disclaimer icon="info">
            Invitations here are simulated — no email is sent and acceptance happens automatically after a few seconds.
            A production build sends a real invite and each member consents individually to what they share back.
          </Disclaimer>
        </div>
      </div>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Add family member">
        <Field label="Name">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maria Andreou" />
        </Field>
        <Field label="Email" hint="Where the invite would be sent.">
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" placeholder="name@example.com" />
        </Field>
        <Field label="Role">
          <Segmented
            value={role}
            onChange={setRole}
            options={[
              { value: 'adult', label: 'Adult' },
              { value: 'child', label: 'Child' },
            ]}
          />
        </Field>
        <Button block className="mt3" disabled={!name.trim() && !email.trim()} onClick={invite}>
          Send invite
        </Button>
      </Sheet>

      <Sheet open={!!remove} onClose={() => setRemove(null)} title={remove?.name}>
        {remove && (
          <>
            <p className="t-sm muted mb5">
              {remove.name} will lose shared access immediately. Their own account and Digital ID are unaffected.
            </p>
            <Button
              variant="danger"
              block
              onClick={() => {
                dispatch({ type: 'removeFamilyMember', id: remove.id });
                toast(`${remove.name} removed from your family group.`);
                setRemove(null);
              }}
            >
              Remove from family
            </Button>
            <Button variant="quiet" block className="mt2" onClick={() => setRemove(null)}>
              {t('common.cancel')}
            </Button>
          </>
        )}
      </Sheet>
    </>
  );
}

export function SyncScreen() {
  const { state, dispatch, toast } = useApp();
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [code, setCode] = useState('');
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    setCode(encodeSyncCode(buildSyncPayload(state)));
    // Regenerate only when something worth carrying over actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.prefs, state.security, state.user, state.familyMembers]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast('Sync code copied.');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Could not access the clipboard.', 'error');
    }
  };

  const apply = () => {
    try {
      const payload = decodeSyncCode(importText);
      dispatch({ type: 'prefs', patch: payload.prefs });
      dispatch({ type: 'security', patch: payload.security });
      dispatch({ type: 'user', patch: payload.user });
      state.familyMembers.forEach((m) => dispatch({ type: 'removeFamilyMember', id: m.id }));
      payload.familyMembers.forEach((m) => dispatch({ type: 'addFamilyMember', member: m }));
      toast('Synced — this device now matches the code.');
      setImportText('');
      navigate('/profile');
    } catch (err) {
      toast(err instanceof SyncCodeError ? err.message : 'Could not read that code.', 'error');
    }
  };

  return (
    <>
      <TopBar title="Sync across devices" onBack />
      <div className="page">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'export', label: 'This device → other' },
            { value: 'import', label: 'Other device → this' },
          ]}
        />

        {tab === 'export' ? (
          <div className="mt5">
            <Card className="center" style={{ paddingBlock: 'var(--s6)' }}>
              <div className="qr-frame" style={{ width: 160, height: 160 }}>
                <DemoQr payload={code} />
              </div>
              <p className="t-sm muted mt4" style={{ maxWidth: 260 }}>
                Scan isn't wired to a camera here — copy the code below and paste it into Nisos on your other device
                instead.
              </p>
            </Card>

            <Field label="Sync code" className="mt4">
              <textarea
                className="input"
                readOnly
                value={code}
                rows={4}
                style={{ resize: 'none', fontFamily: 'monospace', fontSize: 12 }}
                onFocus={(e) => e.currentTarget.select()}
              />
            </Field>
            <Button block icon={copied ? 'check' : 'share'} onClick={copy}>
              {copied ? 'Copied' : 'Copy code'}
            </Button>

            <div className="mt5">
              <Disclaimer icon="info">
                This code carries your preferences, security toggles, profile and family list — never your PIN, and
                never a document or transaction. Generated {dateShort(new Date().toISOString())} ·{' '}
                {timeShort(new Date().toISOString())}.
              </Disclaimer>
            </div>
          </div>
        ) : (
          <div className="mt5">
            <Field label="Paste a sync code" hint="From the Export tab on your other device.">
              <textarea
                className="input"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={5}
                style={{ resize: 'none', fontFamily: 'monospace', fontSize: 12 }}
                placeholder="eyJ2IjoxLCJhdCI6..."
              />
            </Field>
            <Button block disabled={!importText.trim()} onClick={apply}>
              Apply to this device
            </Button>

            <div className="mt5">
              <Disclaimer icon="alert">
                Applying a code overwrites this device's preferences, security toggles, profile and family list with
                what's in the code. Local money, documents and application history stay untouched.
              </Disclaimer>
            </div>
          </div>
        )}

        <div className="mt5">
          <Disclaimer icon="info">
            This is a manual, one-time transfer because the prototype has no account server to sync through
            continuously. A production build replaces this screen entirely: sign in once, and every device stays in
            sync automatically the moment a setting changes.
          </Disclaimer>
        </div>
      </div>
    </>
  );
}
