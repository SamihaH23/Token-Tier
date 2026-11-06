import { Provider } from '../types/prompt';

/**
 * API keys live only in this browser. sessionStorage by default (cleared when
 * the tab closes); localStorage only if the user ticks "remember".
 */
const keyName = (p: Provider) => `tokentier.apiKey.${p}`;

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function getApiKey(provider: Provider): string {
  return safe(() => sessionStorage.getItem(keyName(provider)) ?? localStorage.getItem(keyName(provider)) ?? '', '');
}

export function isKeyRemembered(provider: Provider): boolean {
  return safe(() => localStorage.getItem(keyName(provider)) !== null, false);
}

export function setApiKey(provider: Provider, key: string, remember: boolean): void {
  safe(() => {
    sessionStorage.removeItem(keyName(provider));
    localStorage.removeItem(keyName(provider));
    if (!key) return;
    (remember ? localStorage : sessionStorage).setItem(keyName(provider), key);
  }, undefined);
}
