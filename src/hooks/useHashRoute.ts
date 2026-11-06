import { useCallback, useEffect, useState } from 'react';

export const ROUTES = ['compare', 'library', 'diff', 'cost', 'downgrade', 'eval'] as const;
export type RouteName = (typeof ROUTES)[number];

export interface Route {
  name: RouteName;
  params: Record<string, string>;
}

export function parseHash(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const name = (ROUTES as readonly string[]).includes(path) ? (path as RouteName) : 'compare';
  return { name, params: Object.fromEntries(new URLSearchParams(query)) };
}

export function formatHash(name: RouteName, params: Record<string, string | undefined> = {}): string {
  const clean = Object.entries(params).filter((e): e is [string, string] => !!e[1]);
  const query = new URLSearchParams(clean).toString();
  return `#/${name}${query ? `?${query}` : ''}`;
}

/** Tiny hash router: shareable links that also work on static hosts like GitHub Pages. */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  /** push=false replaces history (for in-page tweaks like changing a dropdown). */
  const navigate = useCallback((name: RouteName, params: Record<string, string | undefined> = {}, push = true) => {
    const hash = formatHash(name, params);
    if (hash === window.location.hash) return;
    if (push) {
      window.location.hash = hash;
    } else {
      window.history.replaceState(null, '', hash);
      setRoute(parseHash(hash));
    }
  }, []);

  return { route, navigate };
}
