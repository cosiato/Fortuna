import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import { motion } from "framer-motion"

export type SettingsSection = "general" | "security" | "data" | "about"

const SECTIONS: ReadonlyArray<{ key: SettingsSection; icon: string }> = [
  { key: "general", icon: "solar:tuning-2-linear" },
  { key: "security", icon: "solar:shield-keyhole-linear" },
  { key: "data", icon: "solar:database-linear" },
  { key: "about", icon: "solar:info-circle-linear" },
]

interface SettingsSidebarProps {
  activeSection: SettingsSection
  onSectionChange: (section: SettingsSection) => void
}

export default function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  const { t } = useTranslation("settings")

  return (
    <nav className="w-[200px] shrink-0 border-r border-border pr-4 flex flex-col gap-1">
      {SECTIONS.map(({ key, icon }) => {
        const isActive = key === activeSection
        return (
          <button
            key={key}
            onClick={() => onSectionChange(key)}
            className={`
              relative flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm
              transition-colors duration-150
              ${isActive ? "text-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}
            `}
          >
            {isActive && (
              <motion.div
                layoutId="activeSettingsSection"
                className="absolute inset-0 bg-accent/10 rounded-lg"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon icon={icon} width={18} height={18} className="relative flex-shrink-0" />
            <span className="relative font-medium">{t(`sections.${key}`)}</span>
          </button>
        )
      })}
    </nav>
  )
}
