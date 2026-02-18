import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import PinInput from "@/components/PinInput"
import { api } from "@/lib/api"

type SecurityView = "menu" | "set-pin" | "confirm-pin" | "verify-current" | "verify-for-disable"

interface SettingsSecurityProps {
  isPinEnabled: boolean
  onPinStatusChange: (enabled: boolean) => void
  onLock: () => void
}

export default function SettingsSecurity({
  isPinEnabled,
  onPinStatusChange,
  onLock,
}: SettingsSecurityProps) {
  const { t } = useTranslation("settings")
  const [view, setView] = useState<SecurityView>("menu")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const resetState = () => {
    setView("menu")
    setNewPin("")
    setConfirmPin("")
    setError("")
  }

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
      resetState()
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
      resetState()
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

  const getSubViewTitle = (): string => {
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
        return ""
    }
  }

  const getSubViewDescription = (): string => {
    switch (view) {
      case "set-pin":
        return t("enterPin")
      case "confirm-pin":
        return t("confirmYourPin")
      case "verify-current":
        return t("enterCurrentPin")
      case "verify-for-disable":
        return t("enterPinToDisable")
      default:
        return ""
    }
  }

  const getSubViewHandler = (): ((pin: string) => void) => {
    switch (view) {
      case "set-pin":
        return handleSetPinComplete
      case "confirm-pin":
        return handleConfirmPinComplete
      case "verify-current":
        return handleVerifyCurrentComplete
      case "verify-for-disable":
        return handleVerifyForDisableComplete
      default:
        return () => {}
    }
  }

  const getPinValue = (): string => {
    return view === "confirm-pin" ? confirmPin : newPin
  }

  const getPinSetter = (): ((val: string) => void) => {
    return view === "confirm-pin" ? setConfirmPin : setNewPin
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-6">{t("sections.security")}</h3>
      </div>

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
          disabled={isLoading || view !== "menu"}
        />
      </div>

      <AnimatePresence mode="wait">
        {view !== "menu" && (
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border border-border rounded-lg p-6"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <p className="text-sm font-medium mb-1">{getSubViewTitle()}</p>
                <p className="text-muted-foreground text-sm">{getSubViewDescription()}</p>
              </div>
              <PinInput
                value={getPinValue()}
                onChange={getPinSetter()}
                onComplete={getSubViewHandler()}
                error={!!error}
                disabled={isLoading}
                autoFocus
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button variant="ghost" size="sm" onClick={resetState}>
                {t("cancel", { ns: "common" })}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isPinEnabled && view === "menu" && (
        <div className="border-t border-border pt-6 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleChangePin}
          >
            <Icon icon="solar:key-linear" width={16} height={16} />
            {t("changePin")}
          </Button>

          <Button variant="outline" className="w-full justify-start gap-2" onClick={onLock}>
            <Icon icon="solar:lock-linear" width={16} height={16} />
            {t("lockNow")}
            <span className="ml-auto text-xs text-muted-foreground">
              {/Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? "Cmd" : "Ctrl"}+L
            </span>
          </Button>
        </div>
      )}
    </div>
  )
}
