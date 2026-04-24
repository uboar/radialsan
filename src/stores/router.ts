import { writable } from 'svelte/store';

export type RouteName = 'dashboard' | 'menu' | 'profiles' | 'settings' | 'notFound';

export interface RouteState {
  name: RouteName;
  path: string;
  params: Record<string, string>;
}

function currentPath(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname || '/';
}

function parseRoute(path: string): RouteState {
  const menuMatch = /^\/menu\/([^/]+)\/?$/.exec(path);
  if (menuMatch) {
    return {
      name: 'menu',
      path,
      params: { id: decodeURIComponent(menuMatch[1]) },
    };
  }

  if (path === '/' || path === '') return { name: 'dashboard', path: '/', params: {} };
  if (path === '/profiles') return { name: 'profiles', path, params: {} };
  if (path === '/settings') return { name: 'settings', path, params: {} };
  return { name: 'notFound', path, params: {} };
}

export const route = writable<RouteState>(parseRoute(currentPath()));

export function navigate(to: string, replace = false) {
  if (typeof window === 'undefined') return;
  if (replace) {
    window.history.replaceState({}, '', to);
  } else {
    window.history.pushState({}, '', to);
  }
  route.set(parseRoute(currentPath()));
}

export function handleLinkClick(event: MouseEvent, to: string) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  event.preventDefault();
  navigate(to);
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    route.set(parseRoute(currentPath()));
  });
}
