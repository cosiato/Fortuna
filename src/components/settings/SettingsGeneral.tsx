import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import CountryFlag from "@/components/CountryFlag"
import { useLanguage } from "@/hooks/useLanguage"
import { useThemeMode, ThemePreference } from "@/hooks/useThemeMode"
import { supportedLanguages, languageNames } from "@/lib/i18n"
import { SupportedCurrency, CURRENCY_INFO } from "@/lib/currency"
import { Icon } from "@iconify/react"

interface SettingsGeneralProps {
  displayCurrency: SupportedCurrency
  onCurrencyClick: () => void
}

export default function SettingsGeneral({
  displayCurrency,
  onCurrencyClick,
}: SettingsGeneralProps) {
  const { t } = useTranslation("settings")
  const { currentLanguage, changeLanguage } = useLanguage()
  const { preference, setTheme } = useThemeMode()

  const currencyInfo = CURRENCY_INFO[displayCurrency]

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-1">{t("sections.general")}</h3>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="language-select" className="text-sm font-medium">
            {t("language")}
          </Label>
        </div>
        <Select value={currentLanguage} onValueChange={changeLanguage}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {supportedLanguages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {languageNames[lang]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="theme-select" className="text-sm font-medium">
              {t("general.theme")}
            </Label>
            <p className="text-xs text-muted-foreground">{t("general.themeDescription")}</p>
          </div>
          <Select value={preference} onValueChange={(value) => setTheme(value as ThemePreference)}>
            <SelectTrigger className="w-[160px]" id="theme-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <span className="flex items-center gap-2">
                  <Icon icon="solar:sun-2-linear" className="h-4 w-4" />
                  {t("general.themeLight")}
                </span>
              </SelectItem>
              <SelectItem value="dark">
                <span className="flex items-center gap-2">
                  <Icon icon="solar:moon-linear" className="h-4 w-4" />
                  {t("general.themeDark")}
                </span>
              </SelectItem>
              <SelectItem value="system">
                <span className="flex items-center gap-2">
                  <Icon icon="solar:monitor-linear" className="h-4 w-4" />
                  {t("general.themeSystem")}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">{t("general.currencyPreference")}</Label>
            <p className="text-xs text-muted-foreground">{t("general.currencyDescription")}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-sm text-foreground">
              <CountryFlag code={currencyInfo.flagCode} />
              {displayCurrency}
            </span>
            <Button variant="outline" size="sm" onClick={onCurrencyClick}>
              {t("general.changeCurrency")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
