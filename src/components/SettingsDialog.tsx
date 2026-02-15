import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import PinInput from "@/components/PinInput"
import { api } from "@/lib/api"
import { useLanguage } from "@/hooks/useLanguage"
import { supportedLanguages, languageNames } from "@/lib/i18n"

type SettingsView = "menu" | "set-pin" | "confirm-pin" | "verify-current" | "verify-for-disable"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isPinEnabled: boolean
  onPinStatusChange: (enabled: boolean) => void
  onLock: () => void
  onResetAccount: () => void
}

export default function SettingsDialog({
  open,
  onOpenChange,
  isPinEnabled,
  onPinStatusChange,
  onLock,
  onResetAccount,
}: SettingsDialogProps) {
  const { t } = useTranslation("settings")
  const { currentLanguage, changeLanguage } = useLanguage()
  const [view, setView] = useState<SettingsView>("menu")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setView("menu")
      setNewPin("")
      setConfirmPin("")
      setError("")
    }
  }, [open])

  const handleTogglePin = () => {
    if (isPinEnabled) {
      setView("verify-for-disable")
      setNewPin("")
      setError("")
    } else {
      setView("set-pin")
      setNewPin("")
      setError("")
    }
  }

  const handleVerifyForDisableComplete = async (pin: string) => {
    setIsLoading(true)
    try {
      await api.settings.removePin(pin)
      onPinStatusChange(false)
      setView("menu")
      setNewPin("")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage.includes("Invalid current PIN")) {
        setError(t("incorrectPin"))
      } else {
        setError(t("failedToRemovePin"))
      }
      setNewPin("")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetPinComplete = (pin: string) => {
    setNewPin(pin)
    setView("confirm-pin")
    setConfirmPin("")
    setError("")
  }

  const handleConfirmPinComplete = async (pin: string) => {
    if (pin !== newPin) {
      setError(t("pinMismatch"))
      setConfirmPin("")
      return
    }

    setIsLoading(true)
    try {
      await api.settings.setPin(pin)
      onPinStatusChange(true)
      setView("menu")
      setNewPin("")
      setConfirmPin("")
    } catch {
      setError(t("failedToSetPin"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePin = () => {
    setView("verify-current")
    setNewPin("")
    setError("")
  }

  const handleVerifyCurrentComplete = async (pin: string) => {
    setIsLoading(true)
    try {
      const isValid = await api.settings.verifyPin(pin)
      if (isValid) {
        setView("set-pin")
        setNewPin("")
        setError("")
      } else {
        setError(t("incorrectPin"))
        setNewPin("")
      }
    } catch {
      setError(t("failedToVerifyPin"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleLockNow = () => {
    onOpenChange(false)
    onLock()
  }

  const handleBack = () => {
    setView("menu")
    setNewPin("")
    setConfirmPin("")
    setError("")
  }

  const renderContent = () => {
    switch (view) {
      case "set-pin":
        return (
          <div className="flex flex-col items-center gap-6 py-4">
            <p className="text-muted-foreground text-sm">{t("enterPin")}</p>
            <PinInput
              value={newPin}
              onChange={setNewPin}
              onComplete={handleSetPinComplete}
              error={!!error}
              disabled={isLoading}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button variant="ghost" size="sm" onClick={handleBack}>
              {t("cancel", { ns: "common" })}
            </Button>
          </div>
        )

      case "confirm-pin":
        return (
          <div className="flex flex-col items-center gap-6 py-4">
            <p className="text-muted-foreground text-sm">{t("confirmYourPin")}</p>
            <PinInput
              value={confirmPin}
              onChange={setConfirmPin}
              onComplete={handleConfirmPinComplete}
              error={!!error}
              disabled={isLoading}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button variant="ghost" size="sm" onClick={handleBack}>
              {t("cancel", { ns: "common" })}
            </Button>
          </div>
        )

      case "verify-current":
        return (
          <div className="flex flex-col items-center gap-6 py-4">
            <p className="text-muted-foreground text-sm">{t("enterCurrentPin")}</p>
            <PinInput
              value={newPin}
              onChange={setNewPin}
              onComplete={handleVerifyCurrentComplete}
              error={!!error}
              disabled={isLoading}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button variant="ghost" size="sm" onClick={handleBack}>
              {t("cancel", { ns: "common" })}
            </Button>
          </div>
        )

      case "verify-for-disable":
        return (
          <div className="flex flex-col items-center gap-6 py-4">
            <p className="text-muted-foreground text-sm">{t("enterPinToDisable")}</p>
            <PinInput
              value={newPin}
              onChange={setNewPin}
              onComplete={handleVerifyForDisableComplete}
              error={!!error}
              disabled={isLoading}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button variant="ghost" size="sm" onClick={handleBack}>
              {t("cancel", { ns: "common" })}
            </Button>
          </div>
        )

      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="language-select" className="text-sm font-medium">
                  {t("language")}
                </Label>
              </div>
              <Select value={currentLanguage} onValueChange={changeLanguage}>
                <SelectTrigger className="w-[140px]">
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

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pin-toggle" className="text-sm font-medium">
                    {t("pinLock")}
                  </Label>
                  <p className="text-xs text-muted-foreground">{t("pinDescription")}</p>
                </div>
                <Switch
                  id="pin-toggle"
                  checked={isPinEnabled}
                  onCheckedChange={handleTogglePin}
                  disabled={isLoading}
                />
              </div>
            </div>

            {isPinEnabled && (
              <>
                <div className="border-t border-border pt-4 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={handleChangePin}
                  >
                    <Icon icon="solar:key-linear" width={16} height={16} />
                    {t("changePin")}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={handleLockNow}
                  >
                    <Icon icon="solar:lock-linear" width={16} height={16} />
                    {t("lockNow")}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {/Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? "Cmd" : "Ctrl"}+L
                    </span>
                  </Button>
                </div>
              </>
            )}

            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-3">{t("dangerZone")}</p>
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
  }

  const getTitle = () => {
    switch (view) {
      case "set-pin":
        return t("setPin")
      case "confirm-pin":
        return t("confirmPin")
      case "verify-current":
        return t("verifyCurrentPin")
      case "verify-for-disable":
        return t("disablePin")
      default:
        return t("title")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
