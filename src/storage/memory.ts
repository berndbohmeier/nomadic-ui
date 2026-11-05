import type { Storage } from "./contract";

export function createMemoryStorage(
  initialValues: Record<string, string> = {},
): Storage {
  const values = new Map(Object.entries(initialValues));
  const listeners = new Map<string, Set<() => void>>();

  const notify = (key: string) => {
    listeners.get(key)?.forEach((listener) => listener());
  };

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
      notify(key);
    },
    removeItem: (key) => {
      values.delete(key);
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
