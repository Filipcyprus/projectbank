import React, { useMemo, useState } from 'react';
import { Icon, Logo, type IconName } from '../components/Icon';
import { Badge, Button, Card, Field, SearchField, Sheet, StatusBadge, Switch } from '../components/ui';
import { Bars, Donut, LegendRow, ProgressRing } from '../components/charts';
import { navigate } from '../lib/router';
import { dateShort, money, relativeDay, timeShort } from '../lib/format';
import { useApp } from '../state/store';
import { registry } from '../integrations/registry';
import { isPrototypeMode, STATUS_LABEL } from '../integrations/config';
import { adminSecurityEvents, adminTickets, adminUsers, adminVerifications, institutions } from '../data/seed';
import type { GovService, IntegrationStatus } from '../integrations/types';

type Section =
  | 'overview'
  | 'users'
  | 'verification'
  | 'services'
  | 'banks'
  | 'transactions'
  | 'documents'
  | 'notifications'
  | 'security'
  | 'support';

const NAV: { id: Section; label: string; icon: IconName }[] = [
  { id: 'overview', label: 'Overview', icon: 'activity' },
  { id: 'users', label: 'Users', icon: 'users' },
  { id: 'verification', label: 'Identity verification', icon: 'id-card' },
  { id: 'services', label: 'Government services', icon: 'gov' },
  { id: 'banks', label: 'Banks and providers', icon: 'database' },
  { id: 'transactions', label: 'Transactions and payments', icon: 'money' },
  { id: 'documents', label: 'Documents', icon: 'folder' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'security', label: 'Security events', icon: 'shield' },
  { id: 'support', label: 'Support tickets', icon: 'help' },
];

export function AdminApp({ path }: { path: string }) {
  // The section comes from the URL so the console is deep-linkable and the
  // browser back button works.
  const requested = path.split('/')[2] as Section | undefined;
  const section: Section = requested && NAV.some((n) => n.id === requested) ? requested : 'overview';
  const { state, dispatch } = useApp();

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="brand">
          <Logo size={30} />
          <div>
            <div style={{ font: '600 15px/1.2 var(--font)' }}>Nisos</div>
            <div className="t-sm subtle">Operator console</div>
          </div>
        </div>
        {NAV.map((n) => (
          <button
            key={n.id}
            className="admin-nav"
            aria-current={section === n.id ? 'page' : undefined}
            onClick={() => navigate(`/admin/${n.id}`)}
            type="button"
          >
            <Icon name={n.icon} size={17} />
            {n.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="admin-nav" onClick={() => navigate('/home')} type="button">
          <Icon name="chevron-left" size={17} />
          Back to the app
        </button>
      </aside>

      <main className="admin-main">
        {section === 'overview' && <Overview />}
        {section === 'users' && <Users />}
        {section === 'verification' && <Verification />}
        {section === 'services' && (
          <Services
            services={state.services}
            onChange={(services) => dispatch({ type: 'government', services, applications: state.applications })}
          />
        )}
        {section === 'banks' && <Banks />}
        {section === 'transactions' && <Transactions />}
        {section === 'documents' && <Documents />}
        {section === 'notifications' && <NotificationsAdmin />}
        {section === 'security' && <SecurityEvents />}
        {section === 'support' && <Support />}
      </main>
    </div>
  );
}

function Head({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="admin-head">
      <div>
        <h1 className="t-h1">{title}</h1>
        {sub && <p className="t-sm muted mt2">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

function Kpi({ label, value, delta, tone }: { label: string; value: string; delta?: string; tone?: 'ok' | 'warn' }) {
  return (
    <Card pad="sm">
      <div className="t-sm muted">{label}</div>
      <div className="num" style={{ font: '600 26px/1.15 var(--font)', marginTop: 6 }}>
        {value}
      </div>
      {delta && (
        <div className="t-sm mt2" style={{ color: tone === 'warn' ? 'var(--warn-500)' : 'var(--ok-500)' }}>
          {delta}
        </div>
      )}
    </Card>
  );
}

/* --- Overview -------------------------------------------------------------- */

function Overview() {
  const { state } = useApp();
  const descriptors = registry.descriptors();
  const live = descriptors.filter((d) => d.status === 'official-api').length;

  return (
    <>
      <Head
        title="Overview"
        sub="Platform health for the operator. All figures below come from the prototype's demo data."
        right={<Badge tone={isPrototypeMode ? 'warn' : 'ok'} dot>{isPrototypeMode ? 'Prototype mode — no live integrations' : `${live} live integrations`}</Badge>}
      />

      <div className="kpi-grid">
        <Kpi label="Registered users" value={String(adminUsers.length)} delta="+2 this week" />
        <Kpi label="Verified identities" value={String(adminUsers.filter((u) => u.idVerification === 'verified').length)} delta="57% of base" />
        <Kpi label="Verification queue" value={String(adminVerifications.filter((v) => v.state !== 'approved' && v.state !== 'rejected').length)} delta="2 awaiting review" tone="warn" />
        <Kpi label="Open tickets" value={String(adminTickets.filter((t) => t.state !== 'resolved').length)} delta="1 high priority" tone="warn" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--s4)', marginTop: 'var(--s5)' }}>
        <Card>
          <h2 className="t-h3 mb4">Integration status</h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Port</th>
                  <th>Adapter</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {descriptors.map((d) => (
                  <tr key={d.id}>
                    <td style={{ textTransform: 'capitalize' }}>{d.kind}</td>
                    <td>{d.name}</td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="t-h3 mb4">Service directory coverage</h2>
          <div className="row" style={{ gap: 'var(--s6)', flexWrap: 'wrap' }}>
            <Donut
              size={150}
              slices={(['official-api', 'official-link', 'coming-soon', 'demo'] as IntegrationStatus[])
                .map((s, i) => ({
                  label: STATUS_LABEL[s],
                  value: state.services.filter((x) => x.status === s).length,
                  color: `var(--c${i + 1})`,
                }))
                .filter((s) => s.value > 0)}
              center={String(state.services.length)}
              caption="services"
            />
            <div className="chart-legend" style={{ flex: 1, minWidth: 180 }}>
              {(['official-api', 'official-link', 'coming-soon', 'demo'] as IntegrationStatus[]).map((s, i) => (
                <LegendRow
                  key={s}
                  color={`var(--c${i + 1})`}
                  name={STATUS_LABEL[s]}
                  value={String(state.services.filter((x) => x.status === s).length)}
                />
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="t-h3 mb4">Weekly activity (demo)</h2>
          <Bars
            data={[
              { label: 'W-5', value: 210 },
              { label: 'W-4', value: 340 },
              { label: 'W-3', value: 295 },
              { label: 'W-2', value: 420 },
              { label: 'W-1', value: 505 },
              { label: 'Now', value: 610 },
            ]}
            color="var(--c2)"
          />
        </Card>

        <Card>
          <h2 className="t-h3 mb4">Platform readiness</h2>
          <div className="row" style={{ gap: 'var(--s5)' }}>
            <ProgressRing value={38} size={104} thickness={10} color="var(--warn-500)" />
            <div>
              <p className="t-sm muted">
                Product design and architecture are complete; regulated capability is not. Readiness reflects licences,
                agreements and accreditations still outstanding.
              </p>
              <div className="grid mt4" style={{ gap: 8 }}>
                {[
                  ['Product and UX', 'ok'],
                  ['Integration layer', 'ok'],
                  ['Licences (EMI / PISP)', 'warn'],
                  ['Government agreements', 'warn'],
                  ['Identity accreditation', 'warn'],
                ].map(([k, tone]) => (
                  <div key={k} className="row-between">
                    <span className="t-sm">{k}</span>
                    <Badge tone={tone as 'ok' | 'warn'}>{tone === 'ok' ? 'Done' : 'Outstanding'}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

/* --- Users ----------------------------------------------------------------- */

function Users() {
  const [q, setQ] = useState('');
  const rows = adminUsers.filter(
    (u) => !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <Head title="Users" sub="Demo records. A production console would enforce role-based access and full audit logging." />
      <div style={{ maxWidth: 380, marginBottom: 'var(--s4)' }}>
        <SearchField value={q} onChange={setQ} placeholder="Search users" />
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>District</th>
              <th>Plan</th>
              <th>Identity</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.name}</td>
                <td className="muted">{u.email}</td>
                <td>{u.district}</td>
                <td style={{ textTransform: 'capitalize' }}>{u.tier}</td>
                <td>
                  <Badge tone={u.idVerification === 'verified' ? 'ok' : u.idVerification === 'pending' ? 'warn' : u.idVerification === 'failed' ? 'danger' : 'default'}>
                    {u.idVerification}
                  </Badge>
                </td>
                <td>
                  <Badge tone={u.status === 'active' ? 'ok' : u.status === 'pending' ? 'warn' : 'danger'}>{u.status}</Badge>
                </td>
                <td className="muted">{dateShort(u.joined)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* --- Verification ---------------------------------------------------------- */

function Verification() {
  return (
    <>
      <Head
        title="Identity verification"
        sub="Review queue. No real document or liveness checking is performed in this prototype."
        right={<Badge tone="warn" dot>Manual review only</Badge>}
      />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Case</th>
              <th>User</th>
              <th>Document</th>
              <th>Method</th>
              <th>Risk</th>
              <th>State</th>
              <th>Submitted</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {adminVerifications.map((v) => (
              <tr key={v.id}>
                <td className="num">{v.id}</td>
                <td style={{ fontWeight: 500 }}>{v.user}</td>
                <td>{v.documentType}</td>
                <td className="muted">{v.method}</td>
                <td>
                  <Badge tone={v.risk === 'low' ? 'ok' : v.risk === 'medium' ? 'warn' : 'danger'}>{v.risk}</Badge>
                </td>
                <td>
                  <Badge tone={v.state === 'approved' ? 'ok' : v.state === 'rejected' ? 'danger' : 'info'}>{v.state}</Badge>
                </td>
                <td className="muted">{relativeDay(v.submitted)}</td>
                <td>
                  {v.state === 'queued' || v.state === 'manual-review' ? (
                    <div className="row" style={{ gap: 6 }}>
                      <Button size="sm" variant="secondary">
                        Approve
                      </Button>
                      <Button size="sm" variant="outline">
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="subtle t-sm">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* --- Government services --------------------------------------------------- */

function Services({ services, onChange }: { services: GovService[]; onChange: (s: GovService[]) => void }) {
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<GovService | null>(null);
  const [draft, setDraft] = useState<{ status: IntegrationStatus; website: string; providerId: string }>({
    status: 'coming-soon',
    website: '',
    providerId: '',
  });

  const rows = useMemo(
    () =>
      services.filter(
        (s) => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.department.toLowerCase().includes(q.toLowerCase()),
      ),
    [services, q],
  );

  const save = () => {
    if (!editing) return;
    onChange(
      services.map((s) =>
        s.id === editing.id ? { ...s, status: draft.status, website: draft.website || undefined, providerId: draft.providerId || undefined } : s,
      ),
    );
    setEditing(null);
  };

  return (
    <>
      <Head
        title="Government services"
        sub="Configure the directory: which department a service belongs to, where it links, and what integration status the app is allowed to display."
        right={<Badge tone="info" dot>{services.length} services</Badge>}
      />

      <Card pad="sm" className="mb4">
        <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
          <Icon name="alert" size={17} style={{ color: 'var(--warn-500)', flex: 'none', marginTop: 2 }} />
          <p className="t-sm muted">
            Setting a service to <strong>Official API</strong> is a claim to citizens that a live, agreed integration
            exists. The app renders that badge verbatim, so it must only be set once the adapter is configured and the
            agreement is signed.
          </p>
        </div>
      </Card>

      <div style={{ maxWidth: 380, marginBottom: 'var(--s4)' }}>
        <SearchField value={q} onChange={setQ} placeholder="Search services" />
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Service</th>
              <th>Department</th>
              <th>Category</th>
              <th>Status</th>
              <th>Link</th>
              <th>Fee</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500 }}>{s.name}</td>
                <td className="muted">{s.department}</td>
                <td style={{ textTransform: 'capitalize' }}>{s.category}</td>
                <td>
                  <StatusBadge status={s.status} />
                </td>
                <td className="muted truncate" style={{ maxWidth: 220 }}>
                  {s.website ?? '—'}
                </td>
                <td className="num">{s.fee ? money(s.fee) : 'Free'}</td>
                <td>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditing(s);
                      setDraft({ status: s.status, website: s.website ?? '', providerId: s.providerId ?? '' });
                    }}
                  >
                    Configure
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing?.name}>
        {editing && (
          <>
            <Field label="Integration status">
              <select
                className="input"
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as IntegrationStatus }))}
              >
                {(['official-api', 'official-link', 'coming-soon', 'demo'] as IntegrationStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
            {draft.status === 'official-api' && (
              <div className="disclaimer mb4">
                <Icon name="alert" size={16} />
                <div>
                  This build has no gateway configured, so the app would still fall back to the demo adapter at runtime.
                  Configure <code>VITE_GOV_GATEWAY_URL</code> before claiming a live API.
                </div>
              </div>
            )}
            <Field label="Official website" hint="Shown to citizens when no API exists.">
              <input className="input" value={draft.website} onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))} />
            </Field>
            <Field label="Adapter / provider id" hint="Which registry adapter serves this service.">
              <input className="input" value={draft.providerId} onChange={(e) => setDraft((d) => ({ ...d, providerId: e.target.value }))} placeholder="government.gateway" />
            </Field>
            <Button block onClick={save}>
              Save configuration
            </Button>
          </>
        )}
      </Sheet>
    </>
  );
}

/* --- Banks ----------------------------------------------------------------- */

function Banks() {
  return (
    <>
      <Head title="Banks and providers" sub="Institutions the platform intends to support and the licences each connection depends on." />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Institution</th>
              <th>Type</th>
              <th>Status</th>
              <th>Requirement</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {institutions.map((i) => (
              <tr key={i.id}>
                <td style={{ fontWeight: 500 }}>{i.name}</td>
                <td style={{ textTransform: 'capitalize' }}>{i.type}</td>
                <td>
                  <StatusBadge status={i.status} />
                </td>
                <td className="muted">{i.note}</td>
                <td>
                  <Button size="sm" variant="secondary">
                    Configure
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card className="mt5">
        <h2 className="t-h3 mb3">Credential handling</h2>
        <p className="t-sm muted">
          Client secrets, mTLS certificates and refresh tokens live in the Nisos gateway, never in the app bundle. The
          console configures which adapter a connection uses; it never displays or stores a citizen's bank credentials,
          because Nisos never receives them.
        </p>
      </Card>
    </>
  );
}

/* --- Transactions ---------------------------------------------------------- */

function Transactions() {
  const { state } = useApp();
  const rows = state.transactions.slice(0, 24);
  const volume = rows.reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <>
      <Head title="Transactions and payments" sub="Ledger view. Every row here is a demo entry created on this device." />
      <div className="kpi-grid mb5">
        <Kpi label="Entries (demo)" value={String(state.transactions.length)} />
        <Kpi label="Volume (demo)" value={money(volume)} />
        <Kpi label="Failed payments" value="0" />
        <Kpi label="Disputes" value="0" />
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Counterparty</th>
              <th>Method</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Source</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="num muted">{t.reference}</td>
                <td style={{ fontWeight: 500 }}>{t.merchant}</td>
                <td className="muted">{t.method ?? '—'}</td>
                <td style={{ textTransform: 'capitalize' }}>{t.category}</td>
                <td className="num" style={{ color: t.amount > 0 ? 'var(--ok-500)' : undefined }}>
                  {money(t.amount, { sign: t.amount > 0 })}
                </td>
                <td>
                  <Badge tone={t.status === 'settled' ? 'ok' : t.status === 'pending' ? 'warn' : 'danger'}>{t.status}</Badge>
                </td>
                <td>
                  <StatusBadge status={t.source} compact />
                </td>
                <td className="muted">{dateShort(t.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* --- Documents ------------------------------------------------------------- */

function Documents() {
  const { state } = useApp();
  return (
    <>
      <Head
        title="Documents"
        sub="Metadata only. Document contents are encrypted with a device key, so the operator cannot read them — by design."
        right={<Badge tone="ok" dot>Zero-knowledge storage</Badge>}
      />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Issuer</th>
              <th>Verification</th>
              <th>Expires</th>
              <th>Size</th>
              <th>Encryption</th>
            </tr>
          </thead>
          <tbody>
            {state.documents.map((d) => (
              <tr key={d.id}>
                <td style={{ fontWeight: 500 }}>{d.name}</td>
                <td style={{ textTransform: 'capitalize' }}>{d.category}</td>
                <td className="muted">{d.issuer}</td>
                <td>
                  <Badge tone={d.verification === 'verified' ? 'ok' : d.verification === 'pending' || d.verification === 'needs-review' ? 'warn' : 'default'}>
                    {d.verification}
                  </Badge>
                </td>
                <td className="muted">{d.expiresAt ? dateShort(d.expiresAt) : '—'}</td>
                <td className="num">{d.sizeKb} KB</td>
                <td className="muted">{d.encryption}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* --- Notifications --------------------------------------------------------- */

function NotificationsAdmin() {
  const { state } = useApp();
  const [streams, setStreams] = useState({ government: true, money: true, security: true, documents: true });

  return (
    <>
      <Head title="Notifications" sub="Delivery configuration and the current feed. Push delivery needs a configured push service." />

      <Card className="mb5">
        <h2 className="t-h3 mb4">Streams</h2>
        <div className="grid" style={{ gap: 12, maxWidth: 460 }}>
          {(Object.keys(streams) as (keyof typeof streams)[]).map((k) => (
            <div key={k} className="row-between">
              <div>
                <div style={{ font: '500 14px/1.3 var(--font)', textTransform: 'capitalize' }}>{k}</div>
                <div className="t-sm muted mt1">
                  {k === 'government'
                    ? 'Requires a department feed or gateway subscription'
                    : k === 'security'
                      ? 'Always on for account-takeover alerts'
                      : 'Generated from platform events'}
                </div>
              </div>
              <Switch checked={streams[k]} label={k} onChange={(v) => setStreams((s) => ({ ...s, [k]: v }))} />
            </div>
          ))}
        </div>
      </Card>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Title</th>
              <th>Stream</th>
              <th>Severity</th>
              <th>Read</th>
              <th>Source</th>
              <th>Sent</th>
            </tr>
          </thead>
          <tbody>
            {state.notifications.map((n) => (
              <tr key={n.id}>
                <td style={{ fontWeight: 500 }}>{n.title}</td>
                <td style={{ textTransform: 'capitalize' }}>{n.stream}</td>
                <td>
                  <Badge tone={n.severity === 'success' ? 'ok' : n.severity === 'info' ? 'info' : 'warn'}>{n.severity}</Badge>
                </td>
                <td className="muted">{n.read ? 'Yes' : 'No'}</td>
                <td>
                  <StatusBadge status={n.source} compact />
                </td>
                <td className="muted">
                  {dateShort(n.at)} {timeShort(n.at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* --- Security -------------------------------------------------------------- */

function SecurityEvents() {
  return (
    <>
      <Head title="Security events" sub="Audit trail for the operator. In production these records are append-only and exportable." />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>When</th>
              <th>Type</th>
              <th>Actor</th>
              <th>Severity</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {adminSecurityEvents.map((e) => (
              <tr key={e.id}>
                <td className="muted">
                  {dateShort(e.at)} {timeShort(e.at)}
                </td>
                <td className="num">{e.type}</td>
                <td>{e.actor}</td>
                <td>
                  <Badge tone={e.severity === 'critical' ? 'danger' : e.severity === 'warning' ? 'warn' : 'info'}>{e.severity}</Badge>
                </td>
                <td className="muted">{e.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* --- Support --------------------------------------------------------------- */

function Support() {
  return (
    <>
      <Head title="Support tickets" sub="Demo queue for the operations team." />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Subject</th>
              <th>User</th>
              <th>Channel</th>
              <th>Priority</th>
              <th>State</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {adminTickets.map((t) => (
              <tr key={t.id}>
                <td className="num muted">{t.id}</td>
                <td style={{ fontWeight: 500 }}>{t.subject}</td>
                <td>{t.user}</td>
                <td className="muted">{t.channel}</td>
                <td>
                  <Badge tone={t.priority === 'high' ? 'danger' : t.priority === 'normal' ? 'info' : 'default'}>{t.priority}</Badge>
                </td>
                <td>
                  <Badge tone={t.state === 'resolved' ? 'ok' : t.state === 'open' ? 'warn' : 'info'}>{t.state}</Badge>
                </td>
                <td className="muted">{relativeDay(t.updated)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
