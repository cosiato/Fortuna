import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import type { UpdateStatus } from "@/hooks/useUpdater"

interface UpdateNotificationProps {
  status: UpdateStatus
  version: string | null
  progress: { downloaded: number; total: number }
  onDownload: () => void
  onDismiss: () => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

export default function UpdateNotification({
  status,
  version,
  progress,
  onDownload,
  onDismiss,
}: UpdateNotificationProps) {
  const { t } = useTranslation("common")

  if (status === "idle" || status === "checking" || status === "error") {
    return null
  }

  const percentage =
    progress.total > 0 ? Math.round((progress.downloaded / progress.total) * 100) : 0

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-lg border border-accent/30 bg-background/95 backdrop-blur-sm shadow-lg shadow-accent/10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {status === "available" && (
              <>
                <p className="text-sm font-medium text-foreground">
                  {t("updateAvailable", { version })}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs bg-accent text-background hover:bg-accent/90"
                    onClick={onDownload}
                  >
                    {t("updateNow")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={onDismiss}
                  >
                    {t("later")}
                  </Button>
                </div>
              </>
            )}

            {status === "downloading" && (
              <>
                <p className="text-sm font-medium text-foreground">{t("downloadingUpdate")}</p>
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(progress.downloaded)} / {formatBytes(progress.total)}
                  </p>
                </div>
              </>
            )}
          </div>

          {status !== "downloading" && (
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon icon="solar:close-circle-linear" width={16} height={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
