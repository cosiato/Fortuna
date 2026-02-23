import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import { usePrivacyMode } from "@/hooks/usePrivacyMode"

export default function PrivacyToggle() {
  const { isPrivate, togglePrivacy } = usePrivacyMode()
  const { t } = useTranslation("common")

  return (
    <button
      onClick={togglePrivacy}
      aria-label={isPrivate ? t("showAmounts") : t("hideAmounts")}
      aria-pressed={isPrivate}
      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
    >
      <Icon
        icon={isPrivate ? "solar:eye-closed-linear" : "solar:eye-linear"}
        width={16}
        height={16}
      />
    </button>
  )
}
