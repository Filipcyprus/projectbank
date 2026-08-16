import React, { useMemo, useState } from 'react';
import { Icon, type IconName } from '../../components/Icon';
import { Badge, Button, Card, Chip, Disclaimer, EmptyState, ErrorState, Field, ListRow, ResultState, SearchField, SectionHead, Sheet, SkeletonList, StatusBadge, Switch, TopBar } from '../../components/ui';
import { BiometricGate } from '../../components/auth';
import { dateShort, timeShort, daysUntil } from '../../lib/format';
import { useApp } from '../../state/store';
import { registry } from '../../integrations/registry';
import { sha256Hex } from '../../lib/hash';
import type { DocCategory, VaultDocument } from '../../integrations/types';

const CATEGORY_META: Record<DocCategory, { label: string; icon: IconName }> = {
  government: { label: 'Government', icon: 'gov' },
  banking: { label: 'Banking', icon: 'money' },
  insurance: { label: 'Insurance', icon: 'shield' },
  education: { label: 'Education', icon: 'star' },
  employment: { label: 'Employment', icon: 'briefcase' },
  vehicles: { label: 'Vehicles', icon: 'car' },
  property: { label: 'Property', icon: 'home' },
  business: { label: 'Business', icon: 'building' },
};

const VERIFY_TONE = {
  verified: 'ok',
  unverified: 'default',
  expired: 'danger',
  pending: 'warn',
  'needs-review': 'warn',
} as const;

function inferFileType(file: File): 'pdf' | 'image' | 'json-vc' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/json') return 'json-vc';
  return 'pdf';
}

/**
 * Runs after every upload. This is app-side simulation, not a real check —
 * a production build calls DocumentVerificationAdapter against the issuing
 * register (the department, the bank) instead of a weighted coin flip.
 */
function simulateVerification(): 'verified' | 'needs-review' {
  return Math.random() > 0.22 ? 'verified' : 'needs-review';
}

export function Vault() {
  const { state, dispatch, t, intlLocale, toast, refresh } = useApp();
  const [cat, setCat] = useState<DocCategory | 'all'>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<VaultDocument | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCat, setUploadCat] = useState<DocCategory>('government');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<VaultDocument | null>(null);
  const [reminders, setReminders] = useState(true);
  const [signGate, setSignGate] = useState(false);
  const [signing, setSigning] = useState(false);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.documents
      .filter((d) => (cat === 'all' ? true : d.category === cat))
      .filter((d) => !needle || d.name.toLowerCase().includes(needle) || d.issuer.toLowerCase().includes(needle));
  }, [state.documents, cat, q]);

  const expiring = state.documents
    .filter((d) => d.expiresAt && daysUntil(d.expiresAt) < 60)
    .sort((a, b) => daysUntil(a.expiresAt!) - daysUntil(b.expiresAt!));

  const upload = async () => {
    setUploading(true);
    try {
      const doc = await registry.ports.documents.upload({
        name: uploadName || file?.name || 'Untitled document',
        category: uploadCat,
        // Only ever the file's own metadata — its bytes never leave this
        // function, let alone get persisted. See the disclaimer below.
        sizeKb: file ? Math.max(1, Math.round(file.size / 1024)) : 240 + Math.floor(Math.random() * 800),
        fileType: file ? inferFileType(file) : 'pdf',
      });
      const local = { ...doc, id: `doc_local_${doc.id}` };
      dispatch({ type: 'addDocument', doc: local });
      setUploaded(local);
      setUploadName('');
      setFile(null);

      // Verification runs after the fact, like a real issuer check would.
      window.setTimeout(
        () => {
          dispatch({ type: 'updateDocument', id: local.id, patch: { verification: simulateVerification() } });
        },
        2200 + Math.random() * 1600,
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    }
    setUploading(false);
  };

  const sign = async (method: 'pin' | 'biometric') => {
    if (!open) return;
    if (!window.isSecureContext || !crypto.subtle) {
      toast('Signing needs a secure (HTTPS) connection — this one is not.', 'error');
      return;
    }
    setSigning(true);
    try {
      const signedAt = new Date().toISOString();
      const hash = await sha256Hex(JSON.stringify({ id: open.id, name: open.name, issuer: open.issuer, issuedAt: open.issuedAt, signedAt }));
      const signature = { signedAt, signerName: state.user.name, method, hash };
      dispatch({ type: 'updateDocument', id: open.id, patch: { signature } });
      setOpen({ ...open, signature });
      dispatch({
        type: 'addDataAccessEvent',
        event: {
          id: `access_${Date.now()}`,
          at: signedAt,
          category: 'documents',
          actor: 'You',
          action: `Signed ${open.name}`,
          detail: `Hash ${hash.slice(0, 12)}…`,
        },
      });
      toast('Document signed on this device.');
    } catch {
      toast('Could not compute the signature.', 'error');
    }
    setSigning(false);
  };

  return (
    <>
      <TopBar
        title={t('vault.title')}
        onBack
        right={
          <button className="iconbtn" onClick={() => setUploadOpen(true)} aria-label={t('vault.upload')} type="button">
            <Icon name="upload" size={18} />
          </button>
        }
      />
      <div className="page">
        <SearchField value={q} onChange={setQ} placeholder="Search documents" />

        <div className="row wrap" style={{ gap: 8, marginTop: 'var(--s4)' }}>
          <Chip active={cat === 'all'} onClick={() => setCat('all')}>
            {t('common.all')}
          </Chip>
          {(Object.keys(CATEGORY_META) as DocCategory[]).map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
              {CATEGORY_META[c].label}
            </Chip>
          ))}
        </div>

        {expiring.length > 0 && cat === 'all' && !q && (
          <Card flat pad="sm" className="mt5">
            <div className="row-between">
              <div className="row">
                <span className="avatar-ico warn">
                  <Icon name="clock" size={19} />
                </span>
                <div>
                  <div style={{ font: '500 14px/1.3 var(--font)' }}>{t('vault.expiryReminders')}</div>
                  <div className="t-sm muted mt1">
                    {expiring.length} document{expiring.length > 1 ? 's' : ''} expiring within 60 days
                  </div>
                </div>
              </div>
              <Switch checked={reminders} onChange={setReminders} label={t('vault.expiryReminders')} />
            </div>
          </Card>
        )}

        <div className="mt5">
          {state.load.documents === 'loading' ? (
            <Card>
              <SkeletonList rows={5} />
            </Card>
          ) : state.load.documents === 'error' ? (
            <Card>
              <ErrorState message={state.errors.documents} onRetry={() => refresh('documents')} />
            </Card>
          ) : rows.length === 0 ? (
            <EmptyState
              icon="folder"
              title={t('vault.empty')}
              body="Upload a document to keep it encrypted and to hand when a service asks for it."
              action={{ label: t('vault.upload'), onClick: () => setUploadOpen(true) }}
            />
          ) : (
            <div className="list card-list">
              {rows.map((d) => {
                const days = d.expiresAt ? daysUntil(d.expiresAt) : null;
                return (
                  <ListRow
                    key={d.id}
                    icon={CATEGORY_META[d.category].icon}
                    iconTone={days !== null && days < 30 ? 'warn' : d.verification === 'verified' ? 'ok' : 'default'}
                    title={d.name}
                    sub={`${d.issuer} · ${dateShort(d.issuedAt, intlLocale)}`}
                    end={
                      <Badge tone={VERIFY_TONE[d.verification]}>
                        {d.verification}
                      </Badge>
                    }
                    endSub={days !== null ? (days < 0 ? 'Expired' : `${days}d left`) : undefined}
                    onClick={() => setOpen(d)}
                  />
                );
              })}
            </div>
          )}
        </div>

        <Button variant="secondary" block icon="upload" className="mt5" onClick={() => setUploadOpen(true)}>
          {t('vault.upload')}
        </Button>

        <div className="mt5">
          <Disclaimer icon="lock">
            {t('vault.encrypted')} In production, files are sealed with a device key before upload and the server only
            ever holds ciphertext — Nisos staff cannot read your documents.
          </Disclaimer>
        </div>
      </div>

      {/* Document detail ---------------------------------------------------- */}
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name}>
        {open && (
          <>
            <Card flat pad="sm" className="mb4">
              <div className="row" style={{ gap: 'var(--s4)' }}>
                <span className="avatar-ico accent" style={{ width: 46, height: 46 }}>
                  <Icon name="doc" size={22} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ font: '500 15px/1.3 var(--font)' }}>
                    {open.name}
                  </div>
                  <div className="t-sm muted mt1">
                    {open.fileType.toUpperCase()} · {open.sizeKb} KB
                  </div>
                </div>
              </div>
            </Card>

            <div className="list card-list mb4">
              <ListRow icon="building" title={t('vault.issuer')} end={open.issuer} />
              <ListRow icon="calendar" title={t('vault.issued')} end={dateShort(open.issuedAt, intlLocale)} />
              {open.expiresAt && (
                <ListRow
                  icon="clock"
                  title={t('common.expires')}
                  end={dateShort(open.expiresAt, intlLocale)}
                  endSub={`${daysUntil(open.expiresAt)} days`}
                />
              )}
              <ListRow
                icon="shield"
                title={t('vault.verification')}
                end={<Badge tone={VERIFY_TONE[open.verification]}>{open.verification}</Badge>}
              />
              <ListRow icon="lock" title="Encryption" end="AES-256-GCM" endSub="Envelope, device key" />
              <ListRow icon="link" title="Source" end={<StatusBadge status={open.source} compact />} />
            </div>

            {open.signature ? (
              <Card flat pad="sm" className="mb4">
                <div className="row" style={{ gap: 'var(--s3)' }}>
                  <span className="avatar-ico ok" style={{ width: 38, height: 38, flex: 'none' }}>
                    <Icon name="check-circle" size={18} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '500 14px/1.3 var(--font)' }}>Signed on this device</div>
                    <div className="t-sm muted mt1">
                      {open.signature.signerName} · {dateShort(open.signature.signedAt, intlLocale)}{' '}
                      {timeShort(open.signature.signedAt, intlLocale)} · {open.signature.method}
                    </div>
                    <div className="t-xs subtle mt1" style={{ fontFamily: 'monospace', textTransform: 'none', letterSpacing: 0 }}>
                      sha256:{open.signature.hash.slice(0, 20)}…
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            <div className="grid g2" style={{ gap: 10 }}>
              <Button variant="secondary" size="sm" icon="eye" onClick={() => toast('Document preview is not part of the prototype.')}>
                {t('common.view')}
              </Button>
              <Button variant="secondary" size="sm" icon="share" onClick={() => toast('Sharing needs a recipient service.')}>
                {t('common.share')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon="shield"
                onClick={() => toast('Verification requires the issuing register to be connected.')}
              >
                {t('common.verify')}
              </Button>
              <Button
                variant={open.signature ? 'outline' : 'secondary'}
                size="sm"
                icon="pen"
                disabled={!!open.signature}
                loading={signing}
                onClick={() => setSignGate(true)}
              >
                {open.signature ? 'Signed' : 'Sign'}
              </Button>
            </div>

            <div className="mt4">
              <Disclaimer icon="info">
                Signing binds a SHA-256 hash of this record to the moment you confirmed with {state.security.biometrics ? 'biometrics or ' : ''}
                your PIN — proof the record wasn't altered on this device afterwards. It is not a qualified electronic
                signature (eIDAS QES): it isn't backed by an accredited trust service, so it isn't legally binding on
                its own.
              </Disclaimer>
            </div>

            <Button
              variant="danger"
              block
              className="mt4"
              icon="trash"
              onClick={async () => {
                await registry.ports.documents.remove(open.id);
                dispatch({ type: 'removeDocument', id: open.id });
                setOpen(null);
                toast('Document deleted.');
              }}
            >
              Delete document
            </Button>
          </>
        )}
      </Sheet>

      {/* Upload ------------------------------------------------------------- */}
      <Sheet
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setUploaded(null);
          setFile(null);
        }}
        title={uploaded ? undefined : t('vault.upload')}
      >
        {uploaded ? (
          <ResultState title="Document stored" body={`${uploaded.name} was encrypted on this device and added to your vault. Verification is running now.`}>
            <div className="row" style={{ justifyContent: 'center', marginTop: 'var(--s4)' }}>
              <Badge tone="warn" dot>
                Verifying…
              </Badge>
            </div>
            <div className="grid" style={{ width: '100%', marginTop: 'var(--s6)', gap: 10 }}>
              <Button
                block
                onClick={() => {
                  setUploaded(null);
                  setUploadOpen(false);
                }}
              >
                {t('common.done')}
              </Button>
            </div>
          </ResultState>
        ) : (
          <>
            <label className="dropzone" htmlFor="vault-file-input">
              <input
                id="vault-file-input"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.json"
                style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setFile(f);
                  if (!uploadName) setUploadName(f.name.replace(/\.[^.]+$/, ''));
                }}
              />
              {file ? (
                <>
                  <Icon name={inferFileType(file) === 'image' ? 'camera' : 'doc'} size={26} style={{ color: 'var(--accent)' }} />
                  <p className="t-sm mt3" style={{ fontWeight: 500 }}>
                    {file.name}
                  </p>
                  <p className="t-xs subtle mt1" style={{ textTransform: 'none', letterSpacing: 0 }}>
                    {Math.max(1, Math.round(file.size / 1024))} KB · tap to choose a different file
                  </p>
                </>
              ) : (
                <>
                  <Icon name="upload" size={26} style={{ color: 'var(--text-subtle)' }} />
                  <p className="t-sm muted mt3">Tap to choose a file</p>
                  <p className="t-xs subtle mt1" style={{ textTransform: 'none', letterSpacing: 0 }}>
                    PDF, image or JSON — nothing leaves this device unencrypted
                  </p>
                </>
              )}
            </label>
            <Field label="Document name" className="mt4">
              <input
                className="input"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="e.g. Tenancy agreement 2026"
              />
            </Field>
            <Field label="Category">
              <select className="input" value={uploadCat} onChange={(e) => setUploadCat(e.target.value as DocCategory)}>
                {(Object.keys(CATEGORY_META) as DocCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_META[c].label}
                  </option>
                ))}
              </select>
            </Field>
            <Button block loading={uploading} icon="lock" onClick={upload}>
              Encrypt and store
            </Button>
            <div className="mt4">
              <Disclaimer icon="lock">
                Only the file's name, size and type are recorded here — the bytes never leave this function, let alone
                get uploaded anywhere. A production build seals them with a device key before they touch the network.
              </Disclaimer>
            </div>
          </>
        )}
      </Sheet>

      <BiometricGate
        open={signGate}
        title="Confirm to sign"
        reason={open ? `Sign ${open.name} on this device` : undefined}
        confirmLabel="Sign"
        onSuccess={() => {
          setSignGate(false);
          sign(state.security.biometrics ? 'biometric' : 'pin');
        }}
        onCancel={() => setSignGate(false)}
      />
    </>
  );
}
