import { useState } from "react"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "framer-motion"
import SettingsSidebar, { type SettingsSection } from "@/components/settings/SettingsSidebar"
import SettingsGeneral from "@/components/settings/SettingsGeneral"
import SettingsSecurity from "@/components/settings/SettingsSecurity"
import SettingsData from "@/components/settings/SettingsData"
import SettingsAbout from "@/components/settings/SettingsAbout"
import type { SupportedCurrency } from "@/lib/currency"

interface SettingsViewProps {
  displayCurrency: SupportedCurrency
  onCurrencyClick: () => void
  isPinEnabled: boolean
  onPinStatusChange: (enabled: boolean) => void
  onLock: () => void
  onResetAccount: () => void
}

export default function SettingsView({
  displayCurrency,
  onCurrencyClick,
  isPinEnabled,
  onPinStatusChange,
  onLock,
  onResetAccount,
}: SettingsViewProps) {
  const { t } = useTranslation("settings")
  const [activeSection, setActiveSection] = useState<SettingsSection>("general")

  const renderSection = () => {
    switch (activeSection) {
      case "general":
        return (
          <SettingsGeneral displayCurrency={displayCurrency} onCurrencyClick={onCurrencyClick} />
        )
      case "security":
        return (
          <SettingsSecurity
            isPinEnabled={isPinEnabled}
            onPinStatusChange={onPinStatusChange}
            onLock={onLock}
          />
        )
      case "data":
        return <SettingsData onResetAccount={onResetAccount} />
      case "about":
        return <SettingsAbout />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 mb-8">
      <h1 className="text-xl font-semibold text-white">{t("title")}</h1>
      <div className="flex">
        <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 px-8 pr-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
