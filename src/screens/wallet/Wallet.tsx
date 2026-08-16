import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Button, Card, Disclaimer, ListRow, SectionHead, Sheet, StatusBadge, TopBar } from '../../components/ui';
import { navigate } from '../../lib/router';
import { daysUntil, dateShort } from '../../lib/format';
import { useApp } from '../../state/store';
import type { WalletCard } from '../../integrations/types';

const GROUPS: { title: string; kinds: WalletCard['kind'][] }[] = [
  { title: 'Identity and licences', kinds: ['id', 'licence', 'health'] },
  { title: 'Vehicle and insurance', kinds: ['vehicle', 'insurance'] },
  { title: 'Certificates', kinds: ['certificate'] },
  { title: 'Payment cards', kinds: ['payment'] },
  { title: 'Passes and loyalty', kinds: ['ticket', 'loyalty', 'membership'] },
];

export function WalletCardTile({ card, onClick }: { card: WalletCard; onClick?: () => void }) {
  const expiry = card.expiresAt ? daysUntil(card.expiresAt) : null;
  return (
    <button className={`wallet-card wc-${card.kind}`} onClick={onClick} type="button">
      <div>
        <div className="row-between" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="kind">{card.kind === 'id' ? 'Digital identity' : card.kind}</div>
            <div className="name">{card.name}</div>
          </div>
          {card.verifiable && (
            <span className="badge" style={{ background: 'rgba(255,255,255,.16)', color: '#fff' }}>
              <Icon name="shield" size={12} /> Verifiable
            </span>
          )}
        </div>
      </div>
      <div className="meta">
        <div>
          <div className="k">{card.issuer}</div>
          {card.primaryValue && <div className="v">{card.primaryValue}</div>}
        </div>
        {expiry !== null && (
          <div style={{ textAlign: 'end' }}>
            <div className="k">Expires</div>
            <div className="v" style={{ color: expiry < 30 ? 'var(--copper-200)' : undefined }}>
              {expiry < 0 ? 'Expired' : `${expiry}d`}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

export function Wallet() {
  const { state, t, intlLocale } = useApp();
  const [addOpen, setAddOpen] = useState(false);

  const expiring = state.walletCards
    .filter((c) => c.expiresAt && daysUntil(c.expiresAt) < 60)
    .sort((a, b) => daysUntil(a.expiresAt!) - daysUntil(b.expiresAt!));

  return (
    <>
      <TopBar
        title={t('wallet.title')}
        right={
          <button className="iconbtn" onClick={() => setAddOpen(true)} aria-label={t('wallet.addToWallet')} type="button">
            <Icon name="plus" size={19} />
          </button>
        }
      />
      <div className="page">
        {expiring.length > 0 && (
          <Card flat pad="sm" className="mb4">
            <div className="row">
              <span className="avatar-ico warn">
                <Icon name="clock" size={19} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ font: '500 14px/1.3 var(--font)' }}>{t('wallet.expiringSoon')}</div>
                <div className="t-sm muted mt1">
                  {expiring[0].name} · {dateShort(expiring[0].expiresAt!, intlLocale)}
                </div>
              </div>
              <Badge tone="warn">{expiring.length}</Badge>
            </div>
          </Card>
        )}

        <Card pad="sm" onClick={() => navigate('/vault')} className="mb5">
          <div className="row">
            <span className="avatar-ico sea">
              <Icon name="folder" size={20} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ font: '500 15px/1.2 var(--font)' }}>{t('wallet.documents')}</div>
              <div className="t-sm muted mt1">{state.documents.length} documents · encrypted on device</div>
            </div>
            <Icon name="chevron" size={17} className="chevron" />
          </div>
        </Card>

        {GROUPS.map((group) => {
          const cards = state.walletCards.filter((c) => group.kinds.includes(c.kind));
          if (!cards.length) return null;
          return (
            <div key={group.title}>
              <SectionHead title={group.title} />
              <div className="card-stack">
                {cards.map((c) => (
                  <WalletCardTile key={c.id} card={c} onClick={() => navigate(`/wallet/card/${c.id}`)} />
                ))}
              </div>
            </div>
          );
        })}

        <Button variant="secondary" block icon="plus" className="mt5" onClick={() => setAddOpen(true)}>
          {t('wallet.addToWallet')}
        </Button>

        <div className="mt5">
          <Disclaimer>
            Wallet cards in this prototype are visual representations. A card is only legally usable when its issuer
            signs it as a verifiable credential and a verifier can check that signature — which needs the issuing
            authority to be integrated.
          </Disclaimer>
        </div>
      </div>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title={t('wallet.addToWallet')}>
        <div className="list card-list">
          <ListRow
            icon="gov"
            iconTone="sea"
            title="From a government service"
            sub="Certificates issued to you"
            end={<StatusBadge status="coming-soon" compact />}
            onClick={() => {
              setAddOpen(false);
              navigate('/gov');
            }}
          />
          <ListRow
            icon="doc"
            iconTone="accent"
            title="From your document vault"
            sub="Turn a stored document into a card"
            end={<StatusBadge status="demo" compact />}
            onClick={() => {
              setAddOpen(false);
              navigate('/vault');
            }}
          />
          <ListRow
            icon="card"
            title="Add a payment card"
            sub="Requires a card issuing partner"
            end={<StatusBadge status="coming-soon" compact />}
          />
          <ListRow
            icon="ticket"
            title="Scan a pass or ticket"
            sub="QR and barcode passes"
            end={<StatusBadge status="coming-soon" compact />}
          />
        </div>
      </Sheet>
    </>
  );
}
