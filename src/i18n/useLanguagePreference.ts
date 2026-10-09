import { useLocalStorage } from "@mantine/hooks";
import { LANGUAGE_STORAGE_KEY, SYSTEM_LANGUAGE } from "./index";
import type { LanguagePreference } from "./index";

export function useLanguagePreference() {
  return useLocalStorage<LanguagePreference>({
    key: LANGUAGE_STORAGE_KEY,
    defaultValue: SYSTEM_LANGUAGE,
    getInitialValueInEffect: false,
    serialize: (value) => value,
    deserialize: (value) =>
      (value as LanguagePreference | undefined) ?? SYSTEM_LANGUAGE,
  });
}
