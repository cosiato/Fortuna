import { useState, useEffect } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface RestoreBackupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (pin?: string) => Promise<void>
  pinEnabled: boolean
  selectedFile: string
}

const CONFIRMATION_WORD = "RESTORE"

export default function RestoreBackupDialog({
  open,
  onOpenChange,
  onConfirm,
  pinEnabled,
  selectedFile,
}: RestoreBackupDialogProps) {
  const { t } = useTranslation("dialogs")
  const [confirmText, setConfirmText] = useState("")
  const [pin, setPin] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setConfirmText("")
      setPin("")
      setIsLoading(false)
    }
  }, [open])

  const isConfirmed = confirmText === CONFIRMATION_WORD
  const isPinValid = !pinEnabled || pin.length === 4

  const handleConfirm = async () => {
    if (!isConfirmed || !isPinValid) return
    setIsLoading(true)
    try {
      await onConfirm(pinEnabled ? pin : undefined)
    } finally {
      setIsLoading(false)
    }
  }

  const fileName = selectedFile.split(/[/\\]/).pop() ?? selectedFile

  return (
    <Dialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <Icon icon="solar:import-linear" width={20} height={20} className="text-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-amber-500">{t("restoreBackup.title")}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("restoreBackup.cannotBeUndone")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <Icon
                icon="solar:danger-triangle-linear"
                width={18}
                height={18}
                className="text-amber-500 mt-0.5 flex-shrink-0"
              />
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-500">
                  {t("restoreBackup.warningTitle")}
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Icon icon="solar:database-linear" width={14} height={14} />
                    <span>{t("restoreBackup.warningReplace")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon icon="solar:restart-linear" width={14} height={14} />
                    <span>{t("restoreBackup.warningRestart")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-1">{t("restoreBackup.selectedFile")}</p>
            <p className="text-sm font-mono truncate" title={selectedFile}>
              {fileName}
            </p>
          </div>

          {pinEnabled && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("restoreBackup.enterPinToAuthorize")}
              </p>
              <Input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder={t("restoreBackup.enterPin")}
                type="password"
                inputMode="numeric"
                maxLength={4}
                className="font-mono"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <Trans
                ns="dialogs"
                i18nKey="restoreBackup.typeToConfirm"
                values={{ word: CONFIRMATION_WORD }}
                components={{
                  bold: <span className="font-mono font-bold text-foreground" />,
                }}
              />
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRMATION_WORD}
              className="font-mono"
              disabled={isLoading}
              autoFocus={!pinEnabled}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button
              type="button"
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleConfirm}
              disabled={!isConfirmed || !isPinValid || isLoading}
            >
              {isLoading ? t("restoreBackup.restoring") : t("restoreBackup.restoreBtn")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
