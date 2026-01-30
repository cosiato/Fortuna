"use client"

import { Icon } from "@iconify/react"
import { Entity } from "@/lib/db"
import { SupportedCurrency, formatCurrency } from "@/lib/currency"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface EntitySelectorProps {
  entities: Entity[]
  selectedEntityId: number
  onSelect: (entityId: number) => void
  onAddCompany: () => void
  entityTotals: Record<number, number>
  displayCurrency: SupportedCurrency
}

export default function EntitySelector({
  entities,
  selectedEntityId,
  onSelect,
  onAddCompany,
  entityTotals,
  displayCurrency,
}: EntitySelectorProps) {
  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
      {entities.map((entity) => {
        const isSelected = entity.id === selectedEntityId
        const total = entityTotals[entity.id] ?? 0

        return (
          <button
            key={entity.id}
            onClick={() => onSelect(entity.id)}
            className={`
              relative flex flex-col items-start gap-0.5 py-2 px-4 rounded-lg
              transition-colors duration-200 ease-out min-w-[120px]
              ${
                isSelected
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-700/20"
              }
            `}
          >
            {isSelected && (
              <motion.div
                layoutId="activeEntityBackground"
                className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/5 rounded-lg border border-accent/20"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}
            <div className="relative flex items-center gap-2">
              <Icon
                icon={entity.type === "individual" ? "solar:user-linear" : "solar:buildings-linear"}
                width={16}
                height={16}
              />
              <span className="font-medium text-sm whitespace-nowrap">{entity.name}</span>
            </div>
            <span
              className={`relative text-xs ${isSelected ? "text-accent/80" : "text-muted-foreground"}`}
            >
              {formatCurrency(total, displayCurrency)}
            </span>
          </button>
        )
      })}

      <Button
        variant="ghost"
        size="sm"
        className="h-auto py-2 px-3 text-muted-foreground hover:text-accent hover:bg-accent/10 flex items-center gap-1.5"
        onClick={onAddCompany}
      >
        <Icon icon="solar:add-circle-linear" width={16} height={16} />
        <span className="text-xs">Add Company</span>
      </Button>
    </div>
  )
}
