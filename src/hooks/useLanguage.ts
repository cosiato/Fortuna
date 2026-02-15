import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import type { SupportedLanguage } from '@/lib/i18n'

export function useLanguage() {
  const { i18n } = useTranslation()

  const changeLanguage = useCallback(
    async (locale: SupportedLanguage) => {
      await i18n.changeLanguage(locale)
      try {
        await api.settings.setLocalePreference(locale)
      } catch {
        // Language already changed in UI, backend save is best-effort
      }
    },
    [i18n],
  )

  return {
    currentLanguage: i18n.language as SupportedLanguage,
    changeLanguage,
  }
}
