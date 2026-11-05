import { useEffect } from "react";
import {
  applyLanguagePreference,
  LANGUAGE_STORAGE_KEY,
  SYSTEM_LANGUAGE,
} from "./index";
import type { LanguagePreference } from "./index";
import { useStorage } from "../storage/useStorage";

export function useLanguagePreference() {
  const [preference, setPreference] = useStorage<LanguagePreference>({
    key: LANGUAGE_STORAGE_KEY,
    defaultValue: SYSTEM_LANGUAGE,
    serialize: (value) => value,
    deserialize: (value) =>
      (value as LanguagePreference | undefined) ?? SYSTEM_LANGUAGE,
  });

  useEffect(() => {
    applyLanguagePreference(preference);
  }, [preference]);

  return [preference, setPreference] as const;
}
