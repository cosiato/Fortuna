import { motion } from "framer-motion"
import type { Entity } from "@/types/database"
import type { SupportedCurrency } from "@/lib/currency"
import SidebarEntityList from "@/components/SidebarEntityList"
import SidebarActions from "@/components/SidebarActions"

const EXPANDED_WIDTH = 260
const COLLAPSED_WIDTH = 56

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
}: AppSidebarProps) {
  return (
    <motion.aside
      animate={{ width: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full flex flex-col border-r border-border bg-background relative z-20 overflow-hidden shrink-0"
    >
      {/* Traffic-light safe zone */}
      <div className="shrink-0 h-11" data-tauri-drag-region />

      {/* Logo */}
      <div
        className={`shrink-0 flex items-center gap-2.5 select-none py-3 ${isCollapsed ? "justify-center px-0" : "px-4"}`}
        data-tauri-drag-region
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
          onAddCompany={onAddCompany}
          onEditEntity={onEditEntity}
          onDeleteEntity={onDeleteEntity}
          entityTotals={entityTotals}
          displayCurrency={displayCurrency}
          isCollapsed={isCollapsed}
        />
      </div>

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
        />
      </div>
    </motion.aside>
  )
}
