import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Button, Card, Disclaimer, ListRow, SectionHead, Segmented, Sheet, StatusBadge, Switch, TopBar } from '../../components/ui';
import { navigate } from '../../lib/router';
import { initials } from '../../lib/format';
import { securityScore, useApp } from '../../state/store';
import { LOCALES } from '../../i18n/strings';

export function Profile() {
  const { state, dispatch, t, toast } = useApp();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const score = securityScore(state.security);
  const locale = LOCALES.find((l) => l.code === state.prefs.locale)!;

  return (
    <>
      <TopBar title={t('profile.title')} />
      <div className="page">
        <Card className="center" style={{ paddingBlock: 'var(--s6)' }}>
          <span
            className="avatar-ico round accent"
            style={{ width: 68, height: 68, margin: '0 auto', font: '600 22px/1 var(--font)' }}
          >
            {initials(state.user.name)}
          </span>
          <h2 className="t-h2 mt4">{state.user.name}</h2>
          <p className="t-sm muted mt1">{state.user.email}</p>
          <div className="row" style={{ justifyContent: 'center', gap: 8, marginTop: 'var(--s4)' }}>
            <Badge tone="ok" dot>
              {t('home.verified')}
            </Badge>
            <Badge tone="accent">{state.user.tier === 'premium' ? 'Premium' : state.user.tier === 'business' ? 'Business' : 'Free'}</Badge>
            <StatusBadge status="demo" compact />
          </div>
        </Card>

        <SectionHead title="Account" />
        <div className="list card-list">
          <ListRow icon="user" iconTone="sea" title={t('profile.personal')} sub={state.user.phone} chevron onClick={() => navigate('/profile/personal')} />
          <ListRow icon="id-card" iconTone="accent" title={t('profile.identity')} sub="Digital ID and sharing history" chevron onClick={() => navigate('/id')} />
          <ListRow
            icon="shield"
            iconTone={score >= 85 ? 'ok' : 'warn'}
            title={t('profile.security')}
            sub={`${t('sec.score')}: ${score}%`}
            chevron
            onClick={() => navigate('/security')}
          />
          <ListRow icon="star" title={t('profile.plan')} sub="Free, Premium and Business" chevron onClick={() => navigate('/profile/plan')} />
          <ListRow
            icon="users"
            iconTone={state.user.tier === 'free' ? 'default' : 'accent'}
            title="Family sharing"
            sub={
              state.user.tier === 'free'
                ? 'Premium feature — share with up to 4 people'
                : `${state.familyMembers.length} of 4 member${state.familyMembers.length === 1 ? '' : 's'}`
            }
            chevron
            onClick={() => navigate('/profile/family')}
          />
        </div>

        <SectionHead title="Connections" />
        <div className="list card-list">
          <ListRow
            icon="database"
            title={t('profile.banks')}
            sub="Open banking consents"
            end={<StatusBadge status="coming-soon" compact />}
            onClick={() => navigate('/profile/banks')}
          />
          <ListRow
            icon="gov"
            title={t('profile.govServices')}
            sub="Departments linked to your account"
            end={<StatusBadge status="coming-soon" compact />}
            onClick={() => navigate('/profile/gov')}
          />
          <ListRow icon="folder" title={t('profile.documents')} sub={`${state.documents.length} stored`} chevron onClick={() => navigate('/vault')} />
          <ListRow
            icon="bell"
            title={t('profile.notifications')}
            sub="Government, money, security, documents"
            chevron
            onClick={() => navigate('/notifications')}
          />
        </div>

        <SectionHead title={t('profile.appearance')} />
        <Card>
          <Segmented
            value={state.prefs.theme}
            onChange={(v) => dispatch({ type: 'prefs', patch: { theme: v } })}
            options={[
              { value: 'light', label: t('theme.light') },
              { value: 'dark', label: t('theme.dark') },
              { value: 'system', label: t('theme.system') },
            ]}
          />
          <div className="list" style={{ marginTop: 'var(--s4)' }}>
            <div className="list-row" style={{ paddingInline: 0 }}>
              <div className="body">
                <div className="title">Hide balances</div>
                <div className="sub">Mask amounts on shared screens</div>
              </div>
              <Switch
                checked={state.prefs.hideBalances}
                label="Hide balances"
                onChange={(v) => dispatch({ type: 'prefs', patch: { hideBalances: v } })}
              />
            </div>
            <div className="list-row" style={{ paddingInline: 0 }}>
              <div className="body">
                <div className="title">Larger text</div>
                <div className="sub">Increases the base type size</div>
              </div>
              <Switch
                checked={state.prefs.largeText}
                label="Larger text"
                onChange={(v) => dispatch({ type: 'prefs', patch: { largeText: v } })}
              />
            </div>
          </div>
        </Card>

        <SectionHead title="Preferences" />
        <div className="list card-list">
          <ListRow icon="globe" title={t('profile.language')} sub={locale.native} chevron onClick={() => navigate('/profile/language')} />
          <ListRow icon="refresh" title="Sync across devices" sub="Carry your settings to another device with a code" chevron onClick={() => navigate('/profile/sync')} />
          <ListRow icon="lock" title={t('profile.privacy')} sub="Data, consent and deletion" chevron onClick={() => navigate('/profile/privacy')} />
          <ListRow icon="help" title={t('profile.support')} sub="Help centre and contact" chevron onClick={() => navigate('/profile/support')} />
          <ListRow icon="doc" title={t('profile.terms')} sub="Terms, privacy policy, licences" chevron onClick={() => navigate('/profile/terms')} />
        </div>

        <SectionHead title="Prototype tools" />
        <div className="list card-list">
          <ListRow
            icon="grid"
            title="Operator console"
            sub="Admin dashboard for the platform operator"
            chevron
            onClick={() => navigate('/admin')}
          />
          <ListRow
            icon="refresh"
            title="Reset demo data"
            sub="Clears local changes and starts over"
            onClick={() => {
              localStorage.removeItem('nisos.state.v1');
              toast('Demo data reset. Reloading…');
              window.setTimeout(() => window.location.reload(), 700);
            }}
          />
        </div>

        <Button variant="secondary" block className="mt5" icon="logout" onClick={() => setLogoutOpen(true)}>
          {t('profile.logout')}
        </Button>

        <div className="mt5">
          <Disclaimer>
            Nisos is an independent prototype. It is not affiliated with, endorsed by, or connected to the Republic of
            Cyprus, any government department, or any bank.
          </Disclaimer>
        </div>

        <p className="t-sm subtle center mt5">Nisos prototype · v0.1.0</p>
      </div>

      <Sheet open={logoutOpen} onClose={() => setLogoutOpen(false)} title={t('profile.logout')}>
        <p className="t-sm muted mb5">
          You will be returned to onboarding. Local demo data stays on this device unless you reset it.
        </p>
        <Button
          variant="danger"
          block
          onClick={() => {
            dispatch({ type: 'onboarded', value: false });
            navigate('/home');
          }}
        >
          {t('profile.logout')}
        </Button>
        <Button variant="quiet" block className="mt2" onClick={() => setLogoutOpen(false)}>
          {t('common.cancel')}
        </Button>
      </Sheet>
    </>
  );
}
