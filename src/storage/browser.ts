import type { Storage } from "./contract";

export function createBrowserStorage(): Storage {
  const listeners = new Map<string, Set<() => void>>();

  const notify = (key: string) => {
    listeners.get(key)?.forEach((listener) => listener());
  };

  window.addEventListener("storage", (event) => {
    if (event.storageArea !== localStorage) return;
    if (event.key === null) {
      listeners.forEach((_, key) => notify(key));
    } else {
      notify(event.key);
    }
  });

  return {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => {
      localStorage.setItem(key, value);
      notify(key);
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
      notify(key);
    },
    subscribe: (key, listener) => {
      const keyListeners = listeners.get(key) ?? new Set();
      keyListeners.add(listener);
      listeners.set(key, keyListeners);
      return () => {
        keyListeners.delete(listener);
        if (keyListeners.size === 0) listeners.delete(key);
      };
    },
  };
}
