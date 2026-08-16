import React, { useState } from 'react';
import { Icon, type IconName } from '../../components/Icon';
import { Badge, Button, Card, Chip, EmptyState, ListRow, SkeletonList, StatusBadge, Switch, TopBar } from '../../components/ui';
import { navigate } from '../../lib/router';
import { relativeDay, timeShort } from '../../lib/format';
import { useApp, unreadCount } from '../../state/store';
import { getNotificationPermission, requestNotificationPermission } from '../../lib/notify';
import type { NotificationStream } from '../../integrations/types';

const STREAM_META: Record<NotificationStream, { icon: IconName; tone: 'sea' | 'accent' | 'danger' | 'info' }> = {
  government: { icon: 'gov', tone: 'sea' },
  money: { icon: 'money', tone: 'accent' },
  security: { icon: 'shield', tone: 'danger' },
  documents: { icon: 'doc', tone: 'info' },
};

const SEVERITY_TONE = {
  info: 'default',
  action: 'warn',
  warning: 'warn',
  success: 'ok',
} as const;

export function Notifications() {
  const { state, dispatch, t, intlLocale, toast } = useApp();
  const [stream, setStream] = useState<NotificationStream | 'all'>('all');
  const [permission, setPermission] = useState(getNotificationPermission());

  const rows = state.notifications
    .filter((n) => (stream === 'all' ? true : n.stream === stream))
    .sort((a, b) => (a.at < b.at ? 1 : -1));

  const unread = unreadCount(state.notifications);

  const countFor = (s: NotificationStream) => state.notifications.filter((n) => n.stream === s && !n.read).length;

  return (
    <>
      <TopBar
        title={t('notif.title')}
        onBack
        right={
          unread > 0 ? (
            <button
              className="iconbtn"
              onClick={() => dispatch({ type: 'readAllNotifications' })}
              aria-label={t('notif.markAllRead')}
              type="button"
            >
              <Icon name="check" size={18} />
            </button>
          ) : undefined
        }
      />
      <div className="page">
        <div className="row wrap" style={{ gap: 8 }}>
          <Chip active={stream === 'all'} onClick={() => setStream('all')}>
            {t('common.all')} {unread > 0 && `· ${unread}`}
          </Chip>
          {(Object.keys(STREAM_META) as NotificationStream[]).map((s) => {
            const c = countFor(s);
            return (
              <Chip key={s} active={stream === s} onClick={() => setStream(s)}>
                {t(`notif.stream.${s}` as 'notif.stream.government')}
                {c > 0 && ` · ${c}`}
              </Chip>
            );
          })}
        </div>

        {permission !== 'unsupported' && (
          <Card flat pad="sm" className="mt4">
            <div className="row-between">
              <div className="row" style={{ gap: 'var(--s3)' }}>
                <span className="avatar-ico accent" style={{ width: 38, height: 38, flex: 'none' }}>
                  <Icon name="bell" size={18} />
                </span>
                <div>
                  <div style={{ font: '500 14px/1.3 var(--font)' }}>Desktop notifications</div>
                  <div className="t-sm muted mt1">
                    {permission === 'denied'
                      ? 'Blocked in your browser settings.'
                      : permission === 'granted' && state.security.desktopNotifications
                        ? 'On — fires while this tab is in the background.'
                        : 'Get an OS notification when something needs you.'}
                  </div>
                </div>
              </div>
              {permission === 'granted' ? (
                <Switch
                  checked={state.security.desktopNotifications}
                  label="Desktop notifications"
                  onChange={(v) => dispatch({ type: 'security', patch: { desktopNotifications: v } })}
                />
              ) : permission === 'denied' ? null : (
                <Button
                  size="sm"
                  onClick={async () => {
                    const result = await requestNotificationPermission();
                    setPermission(result);
                    dispatch({ type: 'security', patch: { desktopNotifications: result === 'granted' } });
                    if (result === 'denied') toast('Blocked — you can allow it again in your browser\'s site settings.', 'error');
                  }}
                >
                  Enable
                </Button>
              )}
            </div>
          </Card>
        )}

        <div className="mt5">
          {state.load.notifications === 'loading' ? (
            <Card>
              <SkeletonList rows={5} />
            </Card>
          ) : rows.length === 0 ? (
            <EmptyState icon="check-circle" title={t('notif.empty')} body="New messages from government services, your money and security alerts land here." />
          ) : (
            <div className="grid" style={{ gap: 'var(--s3)' }}>
              {rows.map((n) => {
                const meta = STREAM_META[n.stream];
                return (
                  <Card
                    key={n.id}
                    pad="sm"
                    onClick={() => {
                      dispatch({ type: 'readNotification', id: n.id });
                      if (n.action) navigate(n.action.route.replace(/^#/, ''));
                    }}
                    style={n.read ? undefined : { borderColor: 'var(--line-strong)' }}
                  >
                    <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--s3)' }}>
                      <span className={`avatar-ico ${meta.tone}`}>
                        <Icon name={meta.icon} size={19} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row-between" style={{ gap: 8 }}>
                          <span style={{ font: `${n.read ? 500 : 600} 14px/1.3 var(--font)` }} className="truncate">
                            {n.title}
                          </span>
                          {!n.read && (
                            <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--accent)', flex: 'none' }} />
                          )}
                        </div>
                        <p className="t-sm muted mt1">{n.body}</p>
                        <div className="row" style={{ gap: 8, marginTop: 10 }}>
                          <Badge tone={SEVERITY_TONE[n.severity]}>
                            {t(`notif.stream.${n.stream}` as 'notif.stream.government')}
                          </Badge>
                          <StatusBadge status={n.source} compact />
                          <span className="t-sm subtle" style={{ marginInlineStart: 'auto' }}>
                            {relativeDay(n.at, intlLocale)} · {timeShort(n.at, intlLocale)}
                          </span>
                        </div>
                        {n.action && (
                          <div className="row mt3" style={{ gap: 6, color: 'var(--accent)', font: '500 13px/1 var(--font)' }}>
                            {n.action.label}
                            <Icon name="chevron" size={14} />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt6">
          <ListRow
            icon="settings"
            title="Notification settings"
            sub="Choose which streams reach your device"
            chevron
            onClick={() => navigate('/profile')}
          />
        </div>
      </div>
    </>
  );
}
