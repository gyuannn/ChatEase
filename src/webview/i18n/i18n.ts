import { use } from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./en.json";
import zh from "./zh.json";
import { appSettings } from "../utils/settings";

export const resources = {
  en: en,
  zh: zh,
} as const;

export const lans = Object.keys(resources);

use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: appSettings.get("language") as string,
    fallbackLng: "en",
    resources,
  });
