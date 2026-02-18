import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import { save } from "@tauri-apps/plugin-dialog"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { showErrorToast } from "@/lib/errorHandling"

interface SettingsDataProps {
  onResetAccount: () => void
  onRestoreBackup: () => void
}

export default function SettingsData({ onResetAccount, onRestoreBackup }: SettingsDataProps) {
  const { t } = useTranslation("settings")
  const { t: tErrors } = useTranslation("errors")
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const destination = await save({
        defaultPath: `fortuna-backup-${today}.db`,
        filters: [{ name: "SQLite Database", extensions: ["db"] }],
      })

      if (!destination) return

      setExporting(true)
      await api.settings.exportDatabase(destination)
      toast.success(t("data.exportSuccess"))
    } catch (error) {
      showErrorToast(error, tErrors("failedToExportData"))
    } finally {
      setExporting(false)
    }
  }

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
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExport}
            disabled={exporting}
          >
            <Icon icon="solar:export-linear" width={16} height={16} />
            {t("data.exportButton")}
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{t("data.importData")}</p>
            <p className="text-xs text-muted-foreground">{t("data.importDescription")}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={onRestoreBackup}>
            <Icon icon="solar:import-linear" width={16} height={16} />
            {t("data.importButton")}
          </Button>
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
