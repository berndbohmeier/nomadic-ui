import { useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { Dispatch, SetStateAction } from "react";
import { StorageContext } from "../app/context";

interface UseStorageOptions<T> {
  key: string;
  defaultValue: T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

export function useStorage<T>({
  key,
  defaultValue,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
}: UseStorageOptions<T>): [T, Dispatch<SetStateAction<T>>] {
  const storage = useContext(StorageContext);
  if (!storage) throw new Error("StorageContext is missing");

  const subscribe = useCallback(
    (listener: () => void) => storage.subscribe(key, listener),
    [key, storage],
  );
  const getSnapshot = useCallback(() => storage.getItem(key), [key, storage]);
  const storedValue = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const value = useMemo(
    () => (storedValue === null ? defaultValue : deserialize(storedValue)),
    [defaultValue, deserialize, storedValue],
  );

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (nextValue) => {
      const currentStoredValue = storage.getItem(key);
      const currentValue =
        currentStoredValue === null
          ? defaultValue
          : deserialize(currentStoredValue);
      const resolvedValue =
        typeof nextValue === "function"
          ? (nextValue as (previousValue: T) => T)(currentValue)
          : nextValue;
      storage.setItem(key, serialize(resolvedValue));
    },
    [defaultValue, deserialize, key, serialize, storage],
  );

  return [value, setValue];
}
