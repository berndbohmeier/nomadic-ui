import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "./locales/de/translation.json";
import en from "./locales/en/translation.json";
import fr from "./locales/fr/translation.json";

export const LANGUAGE_STORAGE_KEY = "nomadic-language";
export const SYSTEM_LANGUAGE = "system";

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
] as const;

type SupportedLanguage = (typeof LANGUAGES)[number]["value"];
export type LanguagePreference = SupportedLanguage | typeof SYSTEM_LANGUAGE;

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
  de: { translation: de },
} as const;

function toSupported(lang: string | null | undefined) {
  const base = lang?.split("-")[0].toLowerCase();
  return LANGUAGES.find((l) => l.value === base)?.value;
}

function detectSystemLanguage(): SupportedLanguage {
  for (const lang of navigator.languages) {
    const supported = toSupported(lang);
    if (supported) return supported;
  }
  return "en";
}

// Stored as a raw string so it can be read without JSON parsing; anything
// unsupported (or missing) means "system".
export function getLanguagePreference(): LanguagePreference {
  return (
    toSupported(localStorage.getItem(LANGUAGE_STORAGE_KEY)) ?? SYSTEM_LANGUAGE
  );
}

function resolveLanguage(preference: LanguagePreference) {
  return preference === SYSTEM_LANGUAGE ? detectSystemLanguage() : preference;
}

void i18n.use(initReactI18next).init({
  resources,
  lng: resolveLanguage(getLanguagePreference()),
  fallbackLng: "en",
  supportedLngs: LANGUAGES.map((l) => l.value),
  interpolation: { escapeValue: false },
});

function applyLanguagePreference() {
  const language = resolveLanguage(getLanguagePreference());
  if (language !== i18n.language) void i18n.changeLanguage(language);
}

// Re-apply on OS language changes, on changes from other windows ("storage")
// and on same-window writes made through Mantine's useLocalStorage.
window.addEventListener("languagechange", applyLanguagePreference);
window.addEventListener("storage", (event) => {
  if (event.key === null || event.key === LANGUAGE_STORAGE_KEY) {
    applyLanguagePreference();
  }
});
window.addEventListener("mantine-local-storage", (event) => {
  if (
    (event as CustomEvent<{ key: string }>).detail.key === LANGUAGE_STORAGE_KEY
  ) {
    applyLanguagePreference();
  }
});

const syncHtmlLang = (lng: string) => {
  document.documentElement.lang = lng;
};
syncHtmlLang(i18n.language);
i18n.on("languageChanged", syncHtmlLang);

export default i18n;
