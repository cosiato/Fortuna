import { useTranslation } from "react-i18next"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { AnimatePresence, motion } from "framer-motion"
import type { Entity } from "@/types/database"
import type { SupportedCurrency } from "@/lib/currency"
import SidebarEntityList from "@/components/SidebarEntityList"
import SidebarActions from "@/components/SidebarActions"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const EXPANDED_WIDTH = 260
const COLLAPSED_WIDTH = 70

async function toggleMaximize() {
  const win = getCurrentWindow()
  const maximized = await win.isMaximized()
  if (maximized) {
    await win.unmaximize()
  } else {
    await win.maximize()
  }
}

interface AppSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  entities: Entity[]
  selectedEntityId: number
  onSelectEntity: (entityId: number) => void
  onAddCompany: () => void
  onEditEntity?: (entity: Entity) => void
  onDeleteEntity?: (entity: Entity) => void
  entityTotals: Record<number, number>
  displayCurrency: SupportedCurrency
  onRefresh: () => void
  isRefreshing: boolean
  refreshCooldown: boolean
  onCurrencyClick: () => void
  onSettingsClick: () => void
  currentView: "dashboard" | "entity" | "settings"
  onNavigateDashboard: () => void
}

function AddCompanyButton({
  isCollapsed,
  onAddCompany,
}: {
  isCollapsed: boolean
  onAddCompany: () => void
}) {
  const { t } = useTranslation("entities")

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={300}>
        <div className="shrink-0 px-2 pb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onAddCompany}
                aria-label={t("addCompany")}
                className="flex items-center justify-center w-full h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
              >
                <span className="text-base font-light leading-none">+</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{t("addCompany")}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    )
  }

  return (
    <div className="shrink-0 px-2 pb-2">
      <button
        onClick={onAddCompany}
        className="flex items-center gap-2.5 w-full h-9 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
      >
        <span className="text-base font-light leading-none flex-shrink-0">+</span>
        <AnimatePresence>
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="text-xs truncate overflow-hidden"
          >
            {t("addCompany")}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  )
}

export default function AppSidebar({
  isCollapsed,
  onToggle,
  entities,
  selectedEntityId,
  onSelectEntity,
  onAddCompany,
  onEditEntity,
  onDeleteEntity,
  entityTotals,
  displayCurrency,
  onRefresh,
  isRefreshing,
  refreshCooldown,
  onCurrencyClick,
  onSettingsClick,
  currentView,
  onNavigateDashboard,
}: AppSidebarProps) {
  return (
    <motion.aside
      animate={{ width: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full flex flex-col border-r border-border bg-background relative z-20 overflow-hidden shrink-0"
    >
      {/* Traffic-light safe zone */}
      <div
        className="shrink-0 h-11 cursor-grab active:cursor-grabbing"
        onMouseDown={() => getCurrentWindow().startDragging()}
        onDoubleClick={toggleMaximize}
      />

      {/* Logo */}
      <div
        className={`shrink-0 flex items-center gap-2.5 select-none py-3 cursor-grab active:cursor-grabbing ${isCollapsed ? "justify-center px-0" : "px-4"}`}
        onMouseDown={() => getCurrentWindow().startDragging()}
        onDoubleClick={toggleMaximize}
      >
        <img src="/logo.png" alt="Fortuna" className="w-10 h-10 logo-hover pointer-events-auto" />
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-2xl font-bold text-accent font-serif leading-none pointer-events-auto"
          >
            Fortuna
          </motion.span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border mx-2 shrink-0" />

      {/* Entity list (scrollable) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-2">
        <SidebarEntityList
          entities={entities}
          selectedEntityId={selectedEntityId}
          onSelect={onSelectEntity}
          onEditEntity={onEditEntity}
          onDeleteEntity={onDeleteEntity}
          entityTotals={entityTotals}
          displayCurrency={displayCurrency}
          isCollapsed={isCollapsed}
          isDashboardActive={currentView === "dashboard"}
          onDashboard={onNavigateDashboard}
        />
      </div>

      {/* Add company (pinned above actions) */}
      <AddCompanyButton isCollapsed={isCollapsed} onAddCompany={onAddCompany} />

      {/* Divider */}
      <div className="border-t border-border mx-2" />

      {/* Actions (bottom-pinned) */}
      <div className="shrink-0 py-2">
        <SidebarActions
          isCollapsed={isCollapsed}
          onToggle={onToggle}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          refreshCooldown={refreshCooldown}
          displayCurrency={displayCurrency}
          onCurrencyClick={onCurrencyClick}
          onSettingsClick={onSettingsClick}
          isSettingsActive={currentView === "settings"}
        />
      </div>
    </motion.aside>
  )
}
