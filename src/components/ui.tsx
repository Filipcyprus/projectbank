import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from './Icon';
import { back as goBack } from '../lib/router';
import { STATUS_LABEL, STATUS_TONE } from '../integrations/config';
import type { IntegrationStatus } from '../integrations/types';
import { useApp } from '../state/store';
import { useInstallPrompt } from '../lib/pwa';
import { hasNisosSession } from '../integrations/adapters/nisosSecurityAdapter';

/* --- Chrome --------------------------------------------------------------- */

export function TopBar({
  title,
  onBack,
  right,
  transparent,
}: {
  title?: string;
  onBack?: (() => void) | boolean;
  right?: React.ReactNode;
  transparent?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = document.querySelector('.app-scroll');
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 4);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className={`topbar${scrolled && !transparent ? ' scrolled' : ''}`}>
      <div className="side">
        {onBack && (
          <button
            className="iconbtn ghost"
            aria-label="Back"
            onClick={() => (typeof onBack === 'function' ? onBack() : goBack())}
          >
            <Icon name="chevron-left" />
          </button>
        )}
      </div>
      {title && <h1>{title}</h1>}
      <div className="side end">{right}</div>
    </div>
  );
}

/* --- Primitives ----------------------------------------------------------- */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ink' | 'danger' | 'quiet';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  icon?: IconName;
  loading?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  icon,
  loading,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const cls = [
    'btn',
    variant !== 'primary' ? variant : '',
    size !== 'md' ? size : '',
    block ? 'block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading ? <span className="spinner" /> : icon ? <Icon name={icon} size={18} /> : null}
      {children}
    </button>
  );
}

export function Card({
  children,
  pad = true,
  flat,
  inset,
  onClick,
  className = '',
  style,
}: {
  children: React.ReactNode;
  pad?: boolean | 'sm';
  flat?: boolean;
  inset?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const cls = [
    'card',
    pad === 'sm' ? 'pad-sm' : pad ? 'pad' : '',
    flat ? 'flat' : '',
    inset ? 'inset' : '',
    onClick ? 'tap' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  if (onClick)
    return (
      <button className={cls} style={style} onClick={onClick}>
        {children}
      </button>
    );
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}

export function ListRow({
  icon,
  iconTone = 'default',
  emoji,
  title,
  sub,
  end,
  endSub,
  chevron,
  onClick,
  tone,
}: {
  icon?: IconName;
  iconTone?: 'default' | 'accent' | 'sea' | 'ok' | 'warn' | 'danger' | 'info';
  emoji?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  end?: React.ReactNode;
  endSub?: React.ReactNode;
  chevron?: boolean;
  onClick?: () => void;
  tone?: 'positive' | 'negative';
}) {
  const Tag = (onClick ? 'button' : 'div') as 'button';
  return (
    <Tag className="list-row" onClick={onClick} type={onClick ? 'button' : undefined}>
      {(icon || emoji) && (
        <span className={`avatar-ico ${iconTone === 'default' ? '' : iconTone}`}>
          {emoji ? <span style={{ fontSize: 18 }}>{emoji}</span> : <Icon name={icon!} size={19} />}
        </span>
      )}
      <span className="body">
        <span className="title truncate" style={{ display: 'block' }}>
          {title}
        </span>
        {sub && (
          <span className="sub truncate" style={{ display: 'block' }}>
            {sub}
          </span>
        )}
      </span>
      {(end || endSub) && (
        <span className="end">
          {end && <span className={`amt${tone === 'positive' ? ' pos' : ''}`}>{end}</span>}
          {endSub && <span className="sub">{endSub}</span>}
        </span>
      )}
      {chevron && <Icon name="chevron" size={17} className="chevron" />}
    </Tag>
  );
}

export function Badge({
  children,
  tone = 'default',
  dot,
}: {
  children: React.ReactNode;
  tone?: 'default' | 'ok' | 'warn' | 'danger' | 'info' | 'demo' | 'accent';
  dot?: boolean;
}) {
  return (
    <span className={`badge${tone === 'default' ? '' : ` ${tone}`}`}>
      {dot && <i className="d" />}
      {children}
    </span>
  );
}

/**
 * The most important component in the product: it tells the citizen whether
 * what they are looking at is a real integration or a prototype.
 */
export function StatusBadge({ status, compact }: { status: IntegrationStatus; compact?: boolean }) {
  const { t } = useApp();
  const tone = STATUS_TONE[status];
  // Falls back to the canonical English label if a locale lacks the key.
  const label = t(`status.${status}` as 'status.demo', STATUS_LABEL[status]);
  return (
    <Badge tone={tone === 'demo' ? 'demo' : tone} dot={!compact}>
      {compact && status === 'official-api' ? 'API' : label}
    </Badge>
  );
}

export function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className="chip" aria-pressed={!!active} onClick={onClick} type="button">
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      className="switch"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <span className="knob" />
    </button>
  );
}

export function CheckBox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      className="check"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <Icon name="check" size={14} strokeWidth={2.6} />
    </button>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="search">
      <Icon name="search" size={18} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
      />
      {value && (
        <button className="iconbtn ghost" style={{ width: 24, height: 24 }} onClick={() => onChange('')} aria-label="Clear">
          <Icon name="x" size={15} />
        </button>
      )}
    </div>
  );
}

export function Field({
  label,
  children,
  error,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`field${className ? ` ${className}` : ''}`}>
      <span className="lab">{label}</span>
      {children}
      {hint && !error && (
        <span className="t-sm muted" style={{ marginTop: 6, display: 'block' }}>
          {hint}
        </span>
      )}
      {error && (
        <span className="err-text">
          <Icon name="alert" size={14} /> {error}
        </span>
      )}
    </label>
  );
}

export function SectionHead({ title, action }: { title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {action && (
        <button onClick={action.onClick} type="button">
          {action.label}
        </button>
      )}
    </div>
  );
}

/* --- Overlays ------------------------------------------------------------- */

function overlayRoot(): HTMLElement {
  return document.getElementById('overlay-root') ?? document.body;
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  action,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <>
      <div className="scrim-el" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="grip" />
        {(title || action) && (
          <div className="sheet-head">
            <h2 className="t-h2">{title}</h2>
            {action ?? (
              <button className="iconbtn" onClick={onClose} aria-label="Close">
                <Icon name="x" size={17} />
              </button>
            )}
          </div>
        )}
        <div className="sheet-body scroll">{children}</div>
      </div>
    </>,
    overlayRoot(),
  );
}

export function FullScreenLayer({ children, open }: { children: React.ReactNode; open: boolean }) {
  if (!open) return null;
  return createPortal(<div className="fullscreen-layer">{children}</div>, overlayRoot());
}

export function Toasts() {
  const { state, dispatch } = useApp();
  if (!state.toasts.length) return null;
  return createPortal(
    <div className="toast-wrap">
      {state.toasts.map((t) => (
        <div
          key={t.id}
          className={`toast${t.tone === 'error' ? ' err' : ''}`}
          role="status"
          onClick={() => dispatch({ type: 'dismissToast', id: t.id })}
        >
          <Icon name={t.tone === 'error' ? 'alert' : 'check-circle'} size={17} />
          {t.message}
        </div>
      ))}
    </div>,
    overlayRoot(),
  );
}

/* --- States --------------------------------------------------------------- */

export function Skeleton({ h = 16, w = '100%', r = 8, style }: { h?: number; w?: number | string; r?: number; style?: React.CSSProperties }) {
  return <div className="skel" style={{ height: h, width: w, borderRadius: r, ...style }} />;
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid" style={{ gap: 14 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="row">
          <Skeleton h={40} w={40} r={13} />
          <div className="col" style={{ flex: 1, gap: 7 }}>
            <Skeleton h={13} w={`${55 + ((i * 13) % 30)}%`} />
            <Skeleton h={11} w="35%" />
          </div>
          <Skeleton h={13} w={56} />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon = 'inbox',
  title,
  body,
  action,
}: {
  icon?: IconName;
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="empty">
      <div className="ico">
        <Icon name={icon} size={26} />
      </div>
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useApp();
  return (
    <div className="empty">
      <div className="ico" style={{ background: 'var(--danger-100)', color: 'var(--danger-500)' }}>
        <Icon name="alert" size={26} />
      </div>
      <h3>{t('common.somethingWrong')}</h3>
      <p>{message ?? t('common.offline')}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon="refresh" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}

export function ResultState({
  tone = 'ok',
  title,
  body,
  children,
}: {
  tone?: 'ok' | 'err' | 'info';
  title: string;
  body?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="result-state">
      <div className={`result-mark ${tone}`}>
        <Icon name={tone === 'ok' ? 'check' : tone === 'err' ? 'x' : 'info'} size={36} strokeWidth={2.2} />
      </div>
      <h2 className="t-h1" style={{ marginBottom: 8 }}>
        {title}
      </h2>
      {body && <div className="muted t-sm" style={{ maxWidth: 300 }}>{body}</div>}
      {children}
    </div>
  );
}

export function Disclaimer({ children, icon = 'info' }: { children: React.ReactNode; icon?: IconName }) {
  return (
    <div className="disclaimer">
      <Icon name={icon} size={16} />
      <div>{children}</div>
    </div>
  );
}

export function DemoBanner({ children }: { children?: React.ReactNode }) {
  const { t } = useApp();
  // Once the citizen is signed in to the Nisos backend, money, identity and
  // payments really are live - claiming "no real service is connected" would
  // be the opposite of the honesty this banner exists to provide. Government
  // and wallet data are still demo, so the notice narrows rather than vanishes.
  const live = hasNisosSession();
  return (
    <div className="demo-banner">
      <Icon name="info" size={16} />
      <span>{children ?? (live ? t('common.partialLiveNotice') : t('common.demoNotice'))}</span>
    </div>
  );
}

const INSTALL_DISMISS_KEY = 'nisos.installBannerDismissed';

/** Shown only when the browser has actually offered an install prompt. */
export function InstallAppBanner() {
  const { available, installed, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(INSTALL_DISMISS_KEY) === '1');

  if (installed || !available || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(INSTALL_DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <Card flat pad="sm" className="install-banner">
      <div className="row" style={{ gap: 'var(--s3)' }}>
        <span className="avatar-ico accent" style={{ width: 40, height: 40, flex: 'none' }}>
          <Icon name="download" size={19} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '500 14px/1.3 var(--font)' }}>Install Nisos</div>
          <div className="t-sm muted mt1">Add it to your home screen — it opens full-screen, like any other app.</div>
        </div>
      </div>
      <div className="row mt3" style={{ gap: 8 }}>
        <Button
          size="sm"
          onClick={async () => {
            const outcome = await promptInstall();
            if (outcome === 'accepted' || outcome === 'dismissed') dismiss();
          }}
        >
          Install
        </Button>
        <Button size="sm" variant="quiet" onClick={dismiss}>
          Not now
        </Button>
      </div>
    </Card>
  );
}

/* --- Misc ----------------------------------------------------------------- */

export function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}

/** Counts up to a value once, for balance reveals. Respects reduced motion. */
export function useCountUp(target: number, ms = 700): number {
  const [v, setV] = useState(target);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(target);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setV(target);
      return;
    }
    fromRef.current = v;
    startRef.current = null;
    let raf = 0;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min(1, (ts - startRef.current) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(fromRef.current + (target - fromRef.current) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return v;
}
