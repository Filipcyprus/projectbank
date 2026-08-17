import React, { useEffect, useState } from 'react';
import { Icon, type IconName, Logo } from './components/Icon';
import { Toasts } from './components/ui';
import { AppLockScreen } from './components/auth';
import { match, navigate, useRoute } from './lib/router';
import { useApp, unreadCount } from './state/store';
import { isPrototypeMode } from './integrations/config';

import { Onboarding } from './screens/onboarding/Onboarding';
import { Home } from './screens/home/Home';
import { Money } from './screens/money/Money';
import { AccountDetail } from './screens/money/AccountDetail';
import { Analytics } from './screens/money/Analytics';
import { Bills } from './screens/money/Bills';
import { Goals } from './screens/money/Goals';
import { ConnectBank } from './screens/money/ConnectBank';
import { BankCallback } from './screens/money/BankCallback';
import { AddAccount } from './screens/money/AddAccount';
import { Government } from './screens/government/Government';
import { GovCategory } from './screens/government/GovCategory';
import { ServiceDetail } from './screens/government/ServiceDetail';
import { Applications } from './screens/government/Applications';
import { TaxEstimate } from './screens/government/TaxEstimate';
import { Wallet } from './screens/wallet/Wallet';
import { WalletCardDetail } from './screens/wallet/WalletCardDetail';
import { Vault } from './screens/documents/Vault';
import { Profile } from './screens/profile/Profile';
import { PersonalInfo, LanguageScreen, PrivacyScreen, ConnectionsScreen, SupportScreen, TermsScreen, PlanScreen, FamilyScreen, SyncScreen } from './screens/profile/ProfilePages';
import { DigitalId } from './screens/identity/DigitalId';
import { ShareIdentity } from './screens/identity/ShareIdentity';
import { PayHub } from './screens/payments/PayHub';
import { SendMoney } from './screens/payments/SendMoney';
import { ScanPay } from './screens/payments/ScanPay';
import { RequestMoney } from './screens/payments/RequestMoney';
import { Notifications } from './screens/notifications/Notifications';
import { SecurityCenter, DevicesScreen, LoginHistoryScreen, DataPrivacyScreen } from './screens/security/Security';
import { AdminApp } from './admin/AdminApp';

const TABS: { path: string; icon: IconName; key: 'nav.home' | 'nav.money' | 'nav.gov' | 'nav.wallet' | 'nav.profile' }[] = [
  { path: '/home', icon: 'home', key: 'nav.home' },
  { path: '/money', icon: 'money', key: 'nav.money' },
  { path: '/gov', icon: 'gov', key: 'nav.gov' },
  { path: '/wallet', icon: 'wallet', key: 'nav.wallet' },
  { path: '/profile', icon: 'user', key: 'nav.profile' },
];

function TabBar({ path }: { path: string }) {
  const { t } = useApp();
  return (
    <nav className="tabbar" role="tablist" aria-label="Main">
      {TABS.map((tab) => {
        const active = path === tab.path || path.startsWith(`${tab.path}/`);
        return (
          <button
            key={tab.path}
            className="tab"
            role="tab"
            aria-selected={active}
            onClick={() => navigate(tab.path)}
            type="button"
          >
            <Icon name={tab.icon} size={23} strokeWidth={active ? 1.9 : 1.6} />
            <span>{t(tab.key)}</span>
          </button>
        );
      })}
    </nav>
  );
}

function StatusBar() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setTime(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="statusbar" aria-hidden="true">
      <span>{time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
      <span className="right">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.5" y="5" width="3" height="6" rx="1" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" opacity=".35" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M1 3.6a9 9 0 0 1 13 0M3.4 6.2a5.6 5.6 0 0 1 8.2 0" />
          <circle cx="7.5" cy="9.2" r="1" fill="currentColor" stroke="none" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.2" stroke="currentColor" opacity=".4" />
          <rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" />
          <path d="M23 4.2v3.6a2 2 0 0 0 0-3.6Z" fill="currentColor" opacity=".4" />
        </svg>
      </span>
    </div>
  );
}

function Router({ path }: { path: string }) {
  let params: Record<string, string> | null;

  if (path === '/' || path === '/home') return <Home />;
  if (path === '/money') return <Money />;
  if ((params = match('/money/account/:id', path))) return <AccountDetail id={params.id} />;
  if (path === '/money/analytics') return <Analytics />;
  if (path === '/money/bills') return <Bills />;
  if (path === '/money/goals') return <Goals />;
  if (path === '/money/connect') return <ConnectBank />;
  if (path === '/money/bank-callback') return <BankCallback />;
  if (path === '/money/add-account') return <AddAccount />;
  if (path === '/gov') return <Government />;
  if ((params = match('/gov/category/:cat', path))) return <GovCategory category={params.cat} />;
  if ((params = match('/gov/service/:id', path))) return <ServiceDetail id={params.id} />;
  if (path === '/gov/applications') return <Applications />;
  if (path === '/gov/tax-estimate') return <TaxEstimate />;
  if (path === '/wallet') return <Wallet />;
  if ((params = match('/wallet/card/:id', path))) return <WalletCardDetail id={params.id} />;
  if (path.startsWith('/vault')) return <Vault />;
  if (path === '/profile') return <Profile />;
  if (path === '/profile/personal') return <PersonalInfo />;
  if (path === '/profile/language') return <LanguageScreen />;
  if (path === '/profile/privacy') return <PrivacyScreen />;
  if (path === '/profile/banks') return <ConnectionsScreen kind="banks" />;
  if (path === '/profile/gov') return <ConnectionsScreen kind="gov" />;
  if (path === '/profile/support') return <SupportScreen />;
  if (path === '/profile/terms') return <TermsScreen />;
  if (path === '/profile/plan') return <PlanScreen />;
  if (path === '/profile/family') return <FamilyScreen />;
  if (path === '/profile/sync') return <SyncScreen />;
  if (path === '/id') return <DigitalId />;
  if (path === '/id/share') return <ShareIdentity />;
  if (path === '/pay') return <PayHub />;
  if (path.startsWith('/pay/send')) return <SendMoney path={path} />;
  if (path === '/pay/scan') return <ScanPay />;
  if (path === '/pay/request') return <RequestMoney />;
  if (path === '/notifications') return <Notifications />;
  if (path === '/security') return <SecurityCenter />;
  if (path === '/security/devices') return <DevicesScreen />;
  if (path === '/security/logins') return <LoginHistoryScreen />;
  if (path === '/security/data') return <DataPrivacyScreen />;

  return <Home />;
}

const HIDE_TABBAR = ['/pay/scan', '/id/share', '/pay/send'];

export function App() {
  const path = useRoute();
  const { state, t } = useApp();

  // The admin console is a separate operator surface, not part of the app.
  if (path.startsWith('/admin')) return <AdminApp path={path} />;

  const showTabBar = !HIDE_TABBAR.some((p) => path.startsWith(p));
  const unread = unreadCount(state.notifications);

  return (
    <div className="stage">
      <div className="stage-inner">
        <aside className="stage-copy">
          <div className="mark">
            <Logo size={38} />
            <span style={{ font: '600 22px/1 var(--font)', letterSpacing: '-.02em' }}>Nisos</span>
          </div>
          <h1>{t('brand.tagline')}</h1>
          <p>{t('brand.promise')}</p>
          <div className="facts">
            <div className="fact">
              <Icon name="shield" size={17} style={{ color: 'var(--accent)', flex: 'none' }} />
              <span>
                Working prototype. Every screen states whether it is backed by an official API, an official website link,
                or demo data.
              </span>
            </div>
            <div className="fact">
              <Icon name="link" size={17} style={{ color: 'var(--accent)', flex: 'none' }} />
              <span>
                Government and banking access sits behind an integration layer, so real APIs can be connected without
                redesigning the app.
              </span>
            </div>
            <div className="fact">
              <Icon name="grid" size={17} style={{ color: 'var(--accent)', flex: 'none' }} />
              <span>
                Operator console at{' '}
                <a href="#/admin" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  #/admin
                </a>
                {isPrototypeMode ? ' — no integration is configured in this build.' : '.'}
              </span>
            </div>
          </div>
        </aside>

        <div className="device">
          <div className="app-frame">
            <StatusBar />
            {state.onboarded ? (
              <>
                <div className="app-scroll scroll" key={path.split('/')[1] ?? 'root'}>
                  <Router path={path} />
                </div>
                {showTabBar && <TabBar path={path} />}
              </>
            ) : (
              <Onboarding />
            )}
            <div id="overlay-root" />
            <AppLockScreen open={state.onboarded && state.locked} />
            <Toasts />
          </div>
          {unread > 0 && <span hidden aria-live="polite">{`${unread} unread notifications`}</span>}
        </div>
      </div>
    </div>
  );
}
