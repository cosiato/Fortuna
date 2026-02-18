import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import { motion } from "framer-motion"
import type { Entity } from "@/types/database"
import { SupportedCurrency, formatCurrency } from "@/lib/currency"
import SlotMachineNumber from "@/components/SlotMachineNumber"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarEntityListProps {
  entities: Entity[]
  selectedEntityId: number
  onSelect: (entityId: number) => void
  onEditEntity?: (entity: Entity) => void
  onDeleteEntity?: (entity: Entity) => void
  entityTotals: Record<number, number>
  displayCurrency: SupportedCurrency
  isCollapsed: boolean
  isDashboardActive: boolean
  onDashboard: () => void
}

function EntityIcon({ type }: { type: string }) {
  return (
    <Icon
      icon={type === "individual" ? "solar:user-linear" : "solar:buildings-linear"}
      width={16}
      height={16}
      className="flex-shrink-0"
    />
  )
}

export default function SidebarEntityList({
  entities,
  selectedEntityId,
  onSelect,
  onEditEntity,
  onDeleteEntity,
  entityTotals,
  displayCurrency,
  isCollapsed,
  isDashboardActive,
  onDashboard,
}: SidebarEntityListProps) {
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null)
  const { t } = useTranslation(["entities", "common"])

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-1 px-2">
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onDashboard}
                aria-label={t("common:dashboard")}
                className={`
                  flex items-center justify-center w-full h-9 rounded-lg
                  transition-colors duration-150
                  ${isDashboardActive ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}
                `}
              >
                <Icon icon="solar:home-linear" width={16} height={16} className="flex-shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">{t("common:dashboard")}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={onDashboard}
            className={`
              flex items-center gap-2 w-full py-2 px-3 rounded-lg text-left
              transition-colors duration-150
              ${isDashboardActive ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}
            `}
          >
            <Icon icon="solar:home-linear" width={16} height={16} className="flex-shrink-0" />
            <span className="font-medium text-sm mt-1">{t("common:dashboard")}</span>
          </button>
        )}

        <div className="border-t border-border my-1" />

        {entities.map((entity) => {
          const isSelected = entity.id === selectedEntityId && !isDashboardActive
          const total = entityTotals[entity.id] ?? 0
          const isCompany = entity.type === "company"
          const label = entity.type === "individual" ? t("entities:personal") : entity.name

          if (isCollapsed) {
            return (
              <Tooltip key={entity.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelect(entity.id)}
                    aria-label={label}
                    className={`
                      relative flex items-center justify-center w-full h-9 rounded-lg
                      transition-colors duration-150
                      ${isSelected ? "text-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}
                    `}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeEntitySidebar"
                        className="absolute inset-0 bg-accent/10 rounded-lg"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative">
                      <EntityIcon type={entity.type} />
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(total, displayCurrency)}
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          }

          return (
            <div key={entity.id} className="relative group">
              <button
                onClick={() => onSelect(entity.id)}
                className={`
                  relative flex items-center gap-2 w-full py-2 px-3 rounded-lg text-left
                  transition-colors duration-150
                  ${isSelected ? "text-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}
                `}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeEntitySidebar"
                    className="absolute inset-0 bg-accent/10 rounded-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">
                  <EntityIcon type={entity.type} />
                </span>
                <span className="relative font-medium text-sm truncate mt-0.5">{label}</span>
                <SlotMachineNumber
                  value={formatCurrency(total, displayCurrency)}
                  className={`relative text-xs ml-auto flex-shrink-0 transition-transform duration-200 ${isCompany ? "group-hover:-translate-x-5" : ""} ${openPopoverId === entity.id ? "-translate-x-5" : ""} ${isSelected ? "text-accent/80" : "text-muted-foreground"}`}
                  duration={500}
                  staggerMs={20}
                />
              </button>

              {isCompany && (
                <Popover
                  open={openPopoverId === entity.id}
                  onOpenChange={(open) => setOpenPopoverId(open ? entity.id : null)}
                >
                  <PopoverTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenPopoverId(openPopoverId === entity.id ? null : entity.id)
                      }}
                      className={`
                        absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md
                        text-muted-foreground hover:text-foreground hover:bg-slate-700/50
                        transition-all duration-200
                        ${openPopoverId === entity.id ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}
                      `}
                      aria-label={t("entities:entityOptions")}
                    >
                      <Icon icon="solar:menu-dots-bold" width={14} height={14} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    side="right"
                    className="w-36 p-1 bg-[rgba(23,20,43,0.4)] backdrop-blur-xl border-slate-800/50"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenPopoverId(null)
                        onEditEntity?.(entity)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-slate-700/50 rounded-md transition-colors"
                    >
                      <Icon icon="solar:pen-linear" width={14} height={14} />
                      <span>{t("common:edit")}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenPopoverId(null)
                        onDeleteEntity?.(entity)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                    >
                      <Icon icon="solar:trash-bin-trash-linear" width={14} height={14} />
                      <span>{t("common:delete")}</span>
                    </button>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
