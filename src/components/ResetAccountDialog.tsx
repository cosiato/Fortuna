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

interface ResetAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (pin?: string) => void
  pinEnabled: boolean
}

const CONFIRMATION_WORD = "RESET"

export default function ResetAccountDialog({
  open,
  onOpenChange,
  onConfirm,
  pinEnabled,
}: ResetAccountDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <Icon
                icon="solar:trash-bin-trash-linear"
                width={20}
                height={20}
                className="text-red-500"
              />
            </div>
            <div>
              <DialogTitle className="text-red-500">{t("resetAllData.title")}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("resetAllData.cannotBeUndone")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <div className="flex items-start gap-3">
              <Icon
                icon="solar:danger-triangle-linear"
                width={18}
                height={18}
                className="text-red-500 mt-0.5 flex-shrink-0"
              />
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-500">{t("resetAllData.warningTitle")}</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Icon icon="solar:box-linear" width={14} height={14} />
                    <span>{t("resetAllData.allAssets")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon icon="solar:safe-2-linear" width={14} height={14} />
                    <span>{t("resetAllData.allVaults")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon icon="solar:chart-linear" width={14} height={14} />
                    <span>{t("resetAllData.allSnapshots")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon icon="solar:buildings-linear" width={14} height={14} />
                    <span>{t("resetAllData.allEntities")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon icon="solar:settings-linear" width={14} height={14} />
                    <span>{t("resetAllData.allSettings")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {pinEnabled && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("resetAllData.enterPinToAuthorize")}
              </p>
              <Input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder={t("resetAllData.enterPin")}
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
                i18nKey="resetAllData.typeToConfirm"
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
              variant="destructive"
              className="flex-1"
              onClick={handleConfirm}
              disabled={!isConfirmed || !isPinValid || isLoading}
            >
              {isLoading ? t("resetAllData.resetting") : t("resetAllData.resetBtn")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
