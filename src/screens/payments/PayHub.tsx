import React from 'react';
import { Card, Disclaimer, ListRow, SectionHead, StatusBadge, TopBar } from '../../components/ui';
import { navigate } from '../../lib/router';
import { initials, relativeDay } from '../../lib/format';
import { useApp } from '../../state/store';

export function PayHub() {
  const { state, t, intlLocale } = useApp();
  const favourites = state.payees.filter((p) => p.favourite);
  const others = state.payees.filter((p) => !p.favourite);

  return (
    <>
      <TopBar title={t('pay.title')} onBack />
      <div className="page">
        <div className="grid g2">
          <Card pad="sm" onClick={() => navigate('/pay/send')}>
            <span className="avatar-ico accent">
              <span style={{ display: 'grid', placeItems: 'center' }}>↗</span>
            </span>
            <div style={{ font: '500 15px/1.25 var(--font)', marginTop: 12 }}>{t('action.sendMoney')}</div>
            <div className="t-sm subtle mt1">To a contact or IBAN</div>
          </Card>
          <Card pad="sm" onClick={() => navigate('/pay/scan')}>
            <span className="avatar-ico sea">
              <span style={{ display: 'grid', placeItems: 'center' }}>⌗</span>
            </span>
            <div style={{ font: '500 15px/1.25 var(--font)', marginTop: 12 }}>{t('pay.scanTitle')}</div>
            <div className="t-sm subtle mt1">Merchant QR code</div>
          </Card>
        </div>

        <SectionHead title="More ways to pay" />
        <div className="list card-list">
          <ListRow
            icon="receipt"
            iconTone="accent"
            title={t('money.bills')}
            sub="Utilities, insurance, subscriptions"
            chevron
            onClick={() => navigate('/money/bills')}
          />
          <ListRow
            icon="gov"
            iconTone="sea"
            title="Government fees"
            sub="Road tax, certificates, statutory fees"
            end={<StatusBadge status="official-link" compact />}
            onClick={() => navigate('/gov')}
          />
          <ListRow
            icon="arrow-down"
            title={t('action.request')}
            sub="Ask someone to pay you"
            chevron
            onClick={() => navigate('/pay/request')}
          />
          <ListRow
            icon="swap"
            title="Between your accounts"
            sub="Instant internal transfer"
            chevron
            onClick={() => navigate('/pay/send')}
          />
        </div>

        <SectionHead title={t('pay.recipients')} />
        <div className="list card-list">
          {[...favourites, ...others].map((p) => (
            <ListRow
              key={p.id}
              title={p.name}
              sub={p.handle ?? p.iban ?? p.bank}
              emoji={initials(p.name)}
              end={p.lastPaid ? relativeDay(p.lastPaid, intlLocale) : undefined}
              onClick={() => navigate(`/pay/send?payee=${p.id}`)}
            />
          ))}
        </div>

        <div className="mt5">
          <Disclaimer>
            Payments in this prototype are recorded in a local demo ledger. Moving real money requires a licensed
            payment provider and strong customer authentication on every transfer.
          </Disclaimer>
        </div>
      </div>
    </>
  );
}
