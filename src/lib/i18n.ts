import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import enCommon from "@/locales/en/common.json"
import enAssets from "@/locales/en/assets.json"
import enVaults from "@/locales/en/vaults.json"
import enEntities from "@/locales/en/entities.json"
import enSettings from "@/locales/en/settings.json"
import enOnboarding from "@/locales/en/onboarding.json"
import enDialogs from "@/locales/en/dialogs.json"
import enErrors from "@/locales/en/errors.json"
import enValidation from "@/locales/en/validation.json"
import enCategories from "@/locales/en/categories.json"

import frCommon from "@/locales/fr/common.json"
import frAssets from "@/locales/fr/assets.json"
import frVaults from "@/locales/fr/vaults.json"
import frEntities from "@/locales/fr/entities.json"
import frSettings from "@/locales/fr/settings.json"
import frOnboarding from "@/locales/fr/onboarding.json"
import frDialogs from "@/locales/fr/dialogs.json"
import frErrors from "@/locales/fr/errors.json"
import frValidation from "@/locales/fr/validation.json"
import frCategories from "@/locales/fr/categories.json"

import esCommon from "@/locales/es/common.json"
import esAssets from "@/locales/es/assets.json"
import esVaults from "@/locales/es/vaults.json"
import esEntities from "@/locales/es/entities.json"
import esSettings from "@/locales/es/settings.json"
import esOnboarding from "@/locales/es/onboarding.json"
import esDialogs from "@/locales/es/dialogs.json"
import esErrors from "@/locales/es/errors.json"
import esValidation from "@/locales/es/validation.json"
import esCategories from "@/locales/es/categories.json"

import ptCommon from "@/locales/pt/common.json"
import ptAssets from "@/locales/pt/assets.json"
import ptVaults from "@/locales/pt/vaults.json"
import ptEntities from "@/locales/pt/entities.json"
import ptSettings from "@/locales/pt/settings.json"
import ptOnboarding from "@/locales/pt/onboarding.json"
import ptDialogs from "@/locales/pt/dialogs.json"
import ptErrors from "@/locales/pt/errors.json"
import ptValidation from "@/locales/pt/validation.json"
import ptCategories from "@/locales/pt/categories.json"

export const supportedLanguages = ["en", "fr", "es", "pt"] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export const languageNames: Record<SupportedLanguage, string> = {
  en: "English",
  fr: "Francais",
  es: "Espanol",
  pt: "Portugues",
}

export const resources = {
  en: {
    common: enCommon,
    assets: enAssets,
    vaults: enVaults,
    entities: enEntities,
    settings: enSettings,
    onboarding: enOnboarding,
    dialogs: enDialogs,
    errors: enErrors,
    validation: enValidation,
    categories: enCategories,
  },
  fr: {
    common: frCommon,
    assets: frAssets,
    vaults: frVaults,
    entities: frEntities,
    settings: frSettings,
    onboarding: frOnboarding,
    dialogs: frDialogs,
    errors: frErrors,
    validation: frValidation,
    categories: frCategories,
  },
  es: {
    common: esCommon,
    assets: esAssets,
    vaults: esVaults,
    entities: esEntities,
    settings: esSettings,
    onboarding: esOnboarding,
    dialogs: esDialogs,
    errors: esErrors,
    validation: esValidation,
    categories: esCategories,
  },
  pt: {
    common: ptCommon,
    assets: ptAssets,
    vaults: ptVaults,
    entities: ptEntities,
    settings: ptSettings,
    onboarding: ptOnboarding,
    dialogs: ptDialogs,
    errors: ptErrors,
    validation: ptValidation,
    categories: ptCategories,
  },
} as const

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  ns: [
    "common",
    "assets",
    "vaults",
    "entities",
    "settings",
    "onboarding",
    "dialogs",
    "errors",
    "validation",
    "categories",
  ],
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
