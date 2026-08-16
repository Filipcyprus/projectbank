import { useCallback, useEffect, useState } from 'react';

/** Minimal hash router: no dependency, works from a file:// build, back-button safe. */
export function currentPath(): string {
  const h = window.location.hash.replace(/^#/, '');
  return h || '/';
}

export function navigate(path: string, opts: { replace?: boolean } = {}): void {
  const target = `#${path.startsWith('/') ? path : `/${path}`}`;
  if (opts.replace) window.location.replace(target);
  else window.location.hash = target;
}

export function back(): void {
  if (window.history.length > 1) window.history.back();
  else navigate('/home', { replace: true });
}

export function useRoute(): string {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

/** Matches '/gov/service/:id' against '/gov/service/veh-road-tax'. */
export function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/').filter(Boolean);
  const s = path.split('?')[0].split('/').filter(Boolean);
  if (p.length !== s.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(s[i]);
    else if (p[i] !== s[i]) return null;
  }
  return params;
}

export function useNavigate() {
  return useCallback((path: string, opts?: { replace?: boolean }) => navigate(path, opts), []);
}

export function queryParams(path: string): URLSearchParams {
  const idx = path.indexOf('?');
  return new URLSearchParams(idx === -1 ? '' : path.slice(idx + 1));
}
