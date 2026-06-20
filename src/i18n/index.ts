import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import orc from "./locales/orc.json";
import troll from "./locales/troll.json";
import elf from "./locales/elf.json";

export const SUPPORTED_LANGUAGES = ["en", "orc", "troll", "elf"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = "gimfall-language";

function getInitialLanguage(): AppLanguage {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGUAGES.includes(stored as AppLanguage)) {
    return stored as AppLanguage;
  }
  return "en";
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    orc: { translation: orc },
    troll: { translation: troll },
    elf: { translation: elf },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  document.documentElement.lang = lng === "elf" ? "en" : lng;
});

document.documentElement.lang = getInitialLanguage() === "elf" ? "en" : getInitialLanguage();

export default i18n;
