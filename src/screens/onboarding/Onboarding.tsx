import React, { useState } from 'react';
import { Icon, Logo } from '../../components/Icon';
import { PinEntry } from '../../components/auth';
import { Badge, Button, Card, Disclaimer, Field, ListRow, StatusBadge } from '../../components/ui';
import { navigate } from '../../lib/router';
import { useApp } from '../../state/store';
import { LOCALES } from '../../i18n/strings';

const TOTAL = 10;

/** Each step declares honestly whether it is simulated or needs a real integration. */
function StepBadge({ kind }: { kind: 'demo' | 'integration' }) {
  const { t } = useApp();
  return kind === 'demo' ? (
    <Badge tone="demo" dot>
      {t('onb.demoStep')}
    </Badge>
  ) : (
    <Badge tone="warn" dot>
      {t('onb.realStep')}
    </Badge>
  );
}

export function Onboarding() {
  const { state, dispatch, t, toast } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(state.user.name);
  const [email, setEmail] = useState(state.user.email);
  const [phone, setPhone] = useState('+357 99 12 34 41');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const next = () => setStep((s) => Math.min(TOTAL - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    dispatch({ type: 'user', patch: { name, email, phone } });
    dispatch({ type: 'security', patch: { pinSet: true } });
    dispatch({ type: 'onboarded', value: true });
    navigate('/home');
  };

  const validateAccount = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email address.';
    if (phone.replace(/\D/g, '').length < 8) e.phone = 'Enter a valid mobile number.';
    setErrors(e);
    if (Object.keys(e).length === 0) next();
  };

  return (
    <div className="app-frame">
      <div className="app-scroll scroll">
        <div style={{ paddingTop: 56 }}>
          {step > 0 && (
            <div className="row" style={{ padding: '0 var(--s5) var(--s4)', gap: 'var(--s3)' }}>
              <button className="iconbtn ghost" onClick={prev} aria-label={t('common.back')} type="button">
                <Icon name="chevron-left" />
              </button>
              <div className="steps" style={{ flex: 1, padding: 0 }}>
                {Array.from({ length: TOTAL }).map((_, i) => (
                  <i key={i} className={i <= step ? 'done' : ''} />
                ))}
              </div>
              <span className="t-sm subtle num">
                {step + 1}/{TOTAL}
              </span>
            </div>
          )}

          <div className="page fade-in" key={step}>
            {/* 1 — Welcome ------------------------------------------------- */}
            {step === 0 && (
              <div style={{ paddingTop: 'var(--s8)' }}>
                <Logo size={62} />
                <h1 className="serif" style={{ font: '400 40px/1.08 var(--font-display)', marginTop: 'var(--s6)' }}>
                  {t('brand.tagline')}
                </h1>
                <p className="muted mt4">{t('brand.promise')}</p>

                <div className="grid mt7" style={{ gap: 'var(--s3)' }}>
                  {[
                    ['id-card', 'A Digital ID you control, shared field by field'],
                    ['gov', 'Every government service in one searchable place'],
                    ['money', 'Balances, bills and payments beside them'],
                    ['lock', 'Documents encrypted on your own device'],
                  ].map(([icon, label]) => (
                    <div key={label} className="row" style={{ gap: 'var(--s3)' }}>
                      <span className="avatar-ico accent" style={{ width: 34, height: 34 }}>
                        <Icon name={icon as 'gov'} size={17} />
                      </span>
                      <span className="t-sm">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt7">
                  <Disclaimer icon="alert">
                    This is a prototype. No bank, payment provider or government department is connected — every screen
                    labels what is demo data and what would need a real integration.
                  </Disclaimer>
                </div>

                <Button block size="lg" className="mt6" onClick={next}>
                  {t('onb.getStarted')}
                </Button>
                <Button variant="quiet" block className="mt2" onClick={finish}>
                  {t('onb.alreadyHave')}
                </Button>
              </div>
            )}

            {/* 2 — Language ------------------------------------------------ */}
            {step === 1 && (
              <>
                <StepBadge kind="demo" />
                <h1 className="t-h1 mt3">{t('onb.chooseLanguage')}</h1>
                <p className="t-sm muted mt2">You can change this at any time in your profile.</p>
                <div className="list card-list mt5">
                  {LOCALES.map((l) => (
                    <ListRow
                      key={l.code}
                      icon="globe"
                      iconTone={state.prefs.locale === l.code ? 'accent' : 'default'}
                      title={l.native}
                      sub={l.name}
                      end={
                        state.prefs.locale === l.code ? (
                          <Icon name="check" size={18} style={{ color: 'var(--accent)' }} />
                        ) : undefined
                      }
                      onClick={() => dispatch({ type: 'prefs', patch: { locale: l.code } })}
                    />
                  ))}
                </div>
                <Button block className="mt6" onClick={next}>
                  {t('common.continue')}
                </Button>
              </>
            )}

            {/* 3 — Create account ------------------------------------------ */}
            {step === 2 && (
              <>
                <StepBadge kind="demo" />
                <h1 className="t-h1 mt3">{t('onb.createAccount')}</h1>
                <p className="t-sm muted mt2">Nothing is sent anywhere — the account lives on this device.</p>
                <div className="mt5">
                  <Field label="Full name" error={errors.name}>
                    <input className={`input${errors.name ? ' err' : ''}`} value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field label="Email" error={errors.email}>
                    <input className={`input${errors.email ? ' err' : ''}`} value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" />
                  </Field>
                  <Field label="Mobile number" error={errors.phone} hint="Cyprus and EU numbers.">
                    <input className={`input${errors.phone ? ' err' : ''}`} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
                  </Field>
                </div>
                <Button block className="mt4" onClick={validateAccount}>
                  {t('common.continue')}
                </Button>
              </>
            )}

            {/* 4 — Verify contact ------------------------------------------ */}
            {step === 3 && (
              <>
                <StepBadge kind="integration" />
                <h1 className="t-h1 mt3">{t('onb.verifyContact')}</h1>
                <p className="t-sm muted mt2">
                  A real build sends a one-time code by SMS and email. Here, any six digits are accepted.
                </p>
                <Card className="mt5">
                  <div className="row-between">
                    <span className="t-sm muted">Code sent to</span>
                    <span className="t-sm" style={{ fontWeight: 500 }}>
                      {phone}
                    </span>
                  </div>
                  <input
                    className="input mt4 center num"
                    style={{ fontSize: 24, letterSpacing: '.4em', fontWeight: 600 }}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="––––––"
                    inputMode="numeric"
                  />
                  <button className="btn quiet block mt3" onClick={() => setOtp('000000')} type="button">
                    Fill demo code
                  </button>
                </Card>
                <Button block className="mt5" disabled={otp.length < 6} onClick={next}>
                  {t('common.verify')}
                </Button>
              </>
            )}

            {/* 5 — Identity ------------------------------------------------ */}
            {step === 4 && (
              <>
                <StepBadge kind="integration" />
                <h1 className="t-h1 mt3">{t('onb.identity')}</h1>
                <p className="t-sm muted mt2">
                  Identity assurance can only be issued by an accredited provider. This step simulates the journey.
                </p>

                <Card className="mt5">
                  <ol className="timeline">
                    <li className="node done">
                      <div style={{ font: '500 14px/1.3 var(--font)' }}>Scan your identity document</div>
                      <div className="t-sm muted mt1">Chip read plus optical check</div>
                    </li>
                    <li className="node done">
                      <div style={{ font: '500 14px/1.3 var(--font)' }}>Liveness selfie</div>
                      <div className="t-sm muted mt1">Confirms the document belongs to you</div>
                    </li>
                    <li className="node active">
                      <div style={{ font: '500 14px/1.3 var(--font)' }}>Provider issues an assurance level</div>
                      <div className="t-sm muted mt1">Substantial or high, under eIDAS terms</div>
                    </li>
                  </ol>
                </Card>

                <Button
                  block
                  className="mt5"
                  loading={verifying}
                  icon="camera"
                  onClick={() => {
                    setVerifying(true);
                    window.setTimeout(() => {
                      setVerifying(false);
                      toast('Simulated verification complete.');
                      next();
                    }, 1600);
                  }}
                >
                  Run simulated verification
                </Button>
                <Button variant="quiet" block className="mt2" onClick={next}>
                  {t('common.skip')}
                </Button>
              </>
            )}

            {/* 6 — PIN ----------------------------------------------------- */}
            {step === 5 && (
              <>
                <StepBadge kind="demo" />
                <h1 className="t-h1 mt3">{confirming ? 'Confirm your PIN' : t('onb.pin')}</h1>
                <p className="t-sm muted mt2">
                  {confirming ? 'Enter the same four digits again.' : 'Four digits, used when biometrics are unavailable.'}
                </p>
                <div className="mt5">
                  <PinEntry
                    setup
                    prompt={confirming ? 'Repeat your PIN' : 'Choose a PIN'}
                    onDone={(_, entered) => {
                      if (!confirming) {
                        setPin(entered ?? null);
                        setConfirming(true);
                      } else if (entered === pin) {
                        toast('PIN set.');
                        next();
                      } else {
                        toast('PINs did not match. Start again.', 'error');
                        setPin(null);
                        setConfirming(false);
                      }
                    }}
                  />
                </div>
              </>
            )}

            {/* 7 — Biometrics ---------------------------------------------- */}
            {step === 6 && (
              <>
                <StepBadge kind="integration" />
                <h1 className="t-h1 mt3">{t('onb.biometrics')}</h1>
                <p className="t-sm muted mt2">
                  On a real device this registers a passkey in the secure element. Nisos never sees your biometric data.
                </p>
                <Card className="center mt5" style={{ paddingBlock: 'var(--s7)' }}>
                  <div className="bio-ring" style={{ margin: '0 auto var(--s5)' }}>
                    <Icon name="face" size={40} strokeWidth={1.4} />
                  </div>
                  <p className="t-sm muted" style={{ maxWidth: 260, margin: '0 auto' }}>
                    Face ID or fingerprint unlocks your Digital ID and confirms every payment.
                  </p>
                </Card>
                <Button
                  block
                  className="mt5"
                  onClick={() => {
                    dispatch({ type: 'security', patch: { biometrics: true } });
                    next();
                  }}
                >
                  Enable biometrics
                </Button>
                <Button
                  variant="quiet"
                  block
                  className="mt2"
                  onClick={() => {
                    dispatch({ type: 'security', patch: { biometrics: false } });
                    next();
                  }}
                >
                  Use PIN only
                </Button>
              </>
            )}

            {/* 8 — Digital ID ---------------------------------------------- */}
            {step === 7 && (
              <>
                <StepBadge kind="integration" />
                <h1 className="t-h1 mt3">{t('onb.digitalId')}</h1>
                <p className="t-sm muted mt2">
                  A prototype credential is created on this device so you can explore sharing and verification.
                </p>
                <div className="id-card mt5" style={{ minHeight: 150 }}>
                  <div className="row" style={{ gap: 'var(--s4)' }}>
                    <div className="photo" style={{ width: 58, height: 70 }}>
                      {name
                        .split(' ')
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <div className="t-xs" style={{ opacity: 0.7 }}>
                        Prototype credential
                      </div>
                      <div style={{ font: '600 17px/1.3 var(--font)', marginTop: 4 }}>{name}</div>
                      <div className="t-sm" style={{ opacity: 0.75, marginTop: 6 }}>
                        NIS-CY-••••-••••
                      </div>
                    </div>
                  </div>
                  <div className="id-holo" aria-hidden="true" />
                </div>
                <div className="row mt4" style={{ gap: 8 }}>
                  <StatusBadge status="demo" />
                  <Badge tone="warn">Not legally valid</Badge>
                </div>
                <Button block className="mt5" onClick={next}>
                  Add to my wallet
                </Button>
              </>
            )}

            {/* 9 — Connect bank -------------------------------------------- */}
            {step === 8 && (
              <>
                <StepBadge kind="integration" />
                <h1 className="t-h1 mt3">{t('onb.connectBank')}</h1>
                <p className="t-sm muted mt2">{t('money.connectBankHint')}</p>
                <div className="list card-list mt5">
                  <ListRow icon="database" title="Cyprus retail banks" sub="PSD2 account access" end={<StatusBadge status="coming-soon" compact />} />
                  <ListRow icon="globe" title="EU banks" sub="Via a regulated aggregator" end={<StatusBadge status="coming-soon" compact />} />
                  <ListRow icon="money" title="Nisos demo ledger" sub="Explore the app with sample data" end={<StatusBadge status="demo" compact />} />
                </div>
                <Button block className="mt5" onClick={next}>
                  Continue with demo ledger
                </Button>
                <Button variant="quiet" block className="mt2" onClick={next}>
                  {t('common.skip')}
                </Button>
              </>
            )}

            {/* 10 — Finish -------------------------------------------------- */}
            {step === 9 && (
              <div className="center" style={{ paddingTop: 'var(--s7)' }}>
                <div className="result-mark ok" style={{ margin: '0 auto var(--s6)' }}>
                  <Icon name="check" size={36} strokeWidth={2.2} />
                </div>
                <h1 className="t-h1">{t('onb.finish')}</h1>
                <p className="t-sm muted mt3" style={{ maxWidth: 300, margin: '12px auto 0' }}>
                  Your Digital ID, money and government services are in one place. Everything you see is demo data until
                  real integrations are connected.
                </p>

                <Card flat className="mt6" style={{ textAlign: 'start' }}>
                  <div className="grid" style={{ gap: 10 }}>
                    {[
                      ['Digital ID', 'demo'],
                      ['Government services', 'official-link'],
                      ['Bank accounts', 'demo'],
                      ['Payments', 'demo'],
                    ].map(([label, status]) => (
                      <div key={label} className="row-between">
                        <span className="t-sm">{label}</span>
                        <StatusBadge status={status as 'demo'} compact />
                      </div>
                    ))}
                  </div>
                </Card>

                <Button block size="lg" className="mt6" onClick={finish}>
                  Open Nisos
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
