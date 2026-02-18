import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"

interface SettingsDataProps {
  onResetAccount: () => void
}

export default function SettingsData({ onResetAccount }: SettingsDataProps) {
  const { t } = useTranslation("settings")

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-6">{t("sections.data")}</h3>
      </div>

      <div className="border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{t("data.exportData")}</p>
            <p className="text-xs text-muted-foreground">{t("data.exportDescription")}</p>
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
            {t("data.comingSoon")}
          </span>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <p className="text-xs text-muted-foreground mb-3">{t("dangerZone")}</p>
        <p className="text-xs text-muted-foreground mb-4">{t("data.resetDescription")}</p>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400"
          onClick={onResetAccount}
        >
          <Icon icon="solar:trash-bin-trash-linear" width={16} height={16} />
          {t("resetAllData")}
        </Button>
      </div>
    </div>
  )
}
