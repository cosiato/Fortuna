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
import { supportedLanguages, languageNames } from "@/lib/i18n"
import { SupportedCurrency, CURRENCY_INFO } from "@/lib/currency"

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
