import React, { useId } from 'react';

/* Charts are hand-drawn SVG: no chart library, no runtime dependency, and full
 * control over theming. Every colour comes from a token so both themes work. */

export interface Slice {
  label: string;
  value: number;
  color: string;
}

export function Donut({
  slices,
  size = 168,
  thickness = 22,
  center,
  caption,
}: {
  slices: Slice[];
  size?: number;
  thickness?: number;
  center?: string;
  caption?: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={caption ?? 'Breakdown'}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
      {slices.map((s) => {
        const len = (s.value / total) * circumference;
        const el = (
          <circle
            key={s.label}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${Math.max(len - 2, 0)} ${circumference - Math.max(len - 2, 0)}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${c} ${c})`}
            style={{ transition: 'stroke-dasharray .5s var(--ease-out)' }}
          />
        );
        offset += len;
        return el;
      })}
      {center && (
        <>
          <text x={c} y={c - 2} textAnchor="middle" style={{ font: '600 20px/1 var(--font)', fill: 'var(--text)' }}>
            {center}
          </text>
          {caption && (
            <text x={c} y={c + 16} textAnchor="middle" style={{ font: '500 11px/1 var(--font)', fill: 'var(--text-muted)' }}>
              {caption}
            </text>
          )}
        </>
      )}
    </svg>
  );
}

export function ProgressRing({
  value,
  size = 92,
  thickness = 8,
  color = 'var(--ok-500)',
  label,
}: {
  value: number; // 0..100
  size?: number;
  thickness?: number;
  color?: string;
  label?: string;
}) {
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="progress-ring" role="img" aria-label={`${pct}%`}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        transform={`rotate(-90 ${c} ${c})`}
        style={{ transition: 'stroke-dasharray .6s var(--ease-out)' }}
      />
      <text x={c} y={c + 1} textAnchor="middle" dominantBaseline="middle">
        {label ?? `${Math.round(pct)}%`}
      </text>
    </svg>
  );
}

export function Bars({
  data,
  height = 140,
  color = 'var(--c1)',
  highlightLast = true,
  formatValue,
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  highlightLast?: boolean;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height }}>
        {data.map((d, i) => {
          const isLast = i === data.length - 1;
          return (
            <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6, height: '100%' }}>
              <div
                title={formatValue ? formatValue(d.value) : String(d.value)}
                style={{
                  height: `${Math.max((d.value / max) * 100, 3)}%`,
                  background: highlightLast && !isLast ? 'color-mix(in srgb, ' + color + ' 34%, transparent)' : color,
                  borderRadius: 7,
                  transition: 'height .5s var(--ease-out)',
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {data.map((d) => (
          <div key={d.label} className="t-sm subtle" style={{ flex: 1, textAlign: 'center', fontSize: 11 }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sparkline({
  points,
  width = 120,
  height = 40,
  color = 'var(--c1)',
  fill = true,
}: {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}) {
  const gid = useId();
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = width / (points.length - 1);
  const coords = points.map((p, i) => [i * step, height - ((p - min) / span) * (height - 4) - 2] as const);
  const d = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${d} L${width} ${height} L0 ${height} Z`} fill={`url(#${gid})`} />
        </>
      )}
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LegendRow({ color, name, value }: { color: string; name: string; value: string }) {
  return (
    <div className="legend-row">
      <span className="sw" style={{ background: color }} />
      <span className="nm truncate">{name}</span>
      <span className="vl">{value}</span>
    </div>
  );
}

export function BarMeter({ value, max, color = 'var(--c1)' }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, (value / (max || 1)) * 100);
  return (
    <div className="bar-track">
      <div className="bar-fill" style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--danger-500)' : color }} />
    </div>
  );
}
