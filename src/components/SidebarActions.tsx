import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import { AnimatePresence, motion } from "framer-motion"
import { SupportedCurrency, CURRENCY_INFO } from "@/lib/currency"
import CountryFlag from "@/components/CountryFlag"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarActionsProps {
  isCollapsed: boolean
  onToggle: () => void
  onRefresh: () => void
  isRefreshing: boolean
  refreshCooldown: boolean
  displayCurrency: SupportedCurrency
  onCurrencyClick: () => void
  onSettingsClick: () => void
}

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  isCollapsed: boolean
  disabled?: boolean
}

function ActionButton({ icon, label, onClick, isCollapsed, disabled }: ActionButtonProps) {
  const button = (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`
        flex items-center gap-2.5 w-full rounded-lg
        text-muted-foreground hover:text-foreground hover:bg-secondary
        transition-colors duration-150 disabled:opacity-50
        ${isCollapsed ? "justify-center h-9" : "px-3 h-9"}
      `}
    >
      <span className="flex-shrink-0">{icon}</span>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="text-xs truncate overflow-hidden"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}

export default function SidebarActions({
  isCollapsed,
  onToggle,
  onRefresh,
  isRefreshing,
  refreshCooldown,
  displayCurrency,
  onCurrencyClick,
  onSettingsClick,
}: SidebarActionsProps) {
  const { t } = useTranslation("common")

  const refreshIcon =
    refreshCooldown && !isRefreshing ? (
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
    ) : (
      <Icon
        icon="solar:refresh-linear"
        width={16}
        height={16}
        className={isRefreshing ? "animate-spin" : ""}
      />
    )

  const refreshLabel = refreshCooldown && !isRefreshing ? t("updated") : t("updatePrices")

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-1 px-2">
        <ActionButton
          icon={refreshIcon}
          label={refreshLabel}
          onClick={onRefresh}
          isCollapsed={isCollapsed}
          disabled={isRefreshing || refreshCooldown}
        />

        <ActionButton
          icon={
            <span className="flex items-center">
              <CountryFlag code={CURRENCY_INFO[displayCurrency].flagCode} />
            </span>
          }
          label={displayCurrency}
          onClick={onCurrencyClick}
          isCollapsed={isCollapsed}
        />

        <ActionButton
          icon={<Icon icon="solar:settings-linear" width={16} height={16} />}
          label={t("settings")}
          onClick={onSettingsClick}
          isCollapsed={isCollapsed}
        />

        <div className="border-t border-border my-1" />

        <div className={`flex ${isCollapsed ? "justify-center" : "justify-end"}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggle}
                aria-label={isCollapsed ? t("expandSidebar") : t("collapseSidebar")}
                className="flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
              >
                <Icon
                  icon="solar:sidebar-minimalistic-linear"
                  width={16}
                  height={16}
                  className={isCollapsed ? "" : "rotate-180"}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side={isCollapsed ? "right" : "top"}>
              <p>{isCollapsed ? t("expandSidebar") : t("collapseSidebar")}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
