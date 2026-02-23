import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Icon } from "@iconify/react"
import { useTranslation } from "react-i18next"
import type { CashFlowFrequency, CashFlowType, CashFlowCategory } from "@/types/database"
import { CASH_FLOW_CATEGORIES } from "@/lib/cashFlowCategories"
import { formatCurrency, type SupportedCurrency } from "@/lib/currency"
import { usePrivacyMode, maskValue } from "@/hooks/usePrivacyMode"

interface CashFlowNodeData {
  flowId: string
  name: string
  amount: number
  frequency: CashFlowFrequency
  flowType: CashFlowType
  category: CashFlowCategory
  isActive: boolean
  currency: SupportedCurrency
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}

export default function CashFlowNode({ data }: NodeProps & { data: CashFlowNodeData }) {
  const { t } = useTranslation(["common", "vaults"])
  const { isPrivate } = usePrivacyMode()
  const categoryInfo = CASH_FLOW_CATEGORIES[data.category]
  const isInflow = data.flowType === "inflow"

  const bgClass = isInflow
    ? "from-green-950/50 to-green-900/20 border-green-700/40"
    : "from-red-950/50 to-red-900/20 border-red-700/40"

  const amountColor = isInflow ? "text-green-400" : "text-red-400"

  return (
    <div
      className={`group relative px-3 py-2.5 rounded-lg bg-gradient-to-br ${bgClass} border min-w-[140px] transition-all ${!data.isActive ? "opacity-40" : ""}`}
    >
      {isInflow ? (
        <Handle
          type="source"
          position={Position.Right}
          className="!opacity-0 !w-0 !h-0 !min-w-0 !min-h-0 !border-none !pointer-events-none"
        />
      ) : (
        <Handle
          type="target"
          position={Position.Left}
          className="!opacity-0 !w-0 !h-0 !min-w-0 !min-h-0 !border-none !pointer-events-none"
        />
      )}

      <div className="flex items-center gap-2 mb-1">
        <Icon
          icon={categoryInfo.icon}
          width={14}
          height={14}
          className="text-muted-foreground shrink-0"
        />
        <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
          {data.name}
        </span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className={`text-sm font-bold ${amountColor}`}>
          {maskValue(isPrivate, formatCurrency(data.amount, data.currency))}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {t(`common:frequencyShort.${data.frequency}`)}
        </span>
      </div>

      <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation()
            data.onToggle(data.flowId)
          }}
          className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-muted-foreground/30"
          title={data.isActive ? t("vaults:pause") : t("vaults:resume")}
        >
          <Icon
            icon={data.isActive ? "solar:pause-linear" : "solar:play-linear"}
            width={10}
            height={10}
            className="text-foreground"
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            data.onEdit(data.flowId)
          }}
          className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-muted-foreground/30"
          title={t("common:edit")}
        >
          <Icon icon="solar:pen-linear" width={10} height={10} className="text-foreground" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            data.onDelete(data.flowId)
          }}
          className="w-5 h-5 rounded-full bg-red-900/80 border border-red-700/50 flex items-center justify-center hover:bg-red-800"
          title={t("common:delete")}
        >
          <Icon icon="solar:trash-bin-2-linear" width={10} height={10} className="text-red-300" />
        </button>
      </div>
    </div>
  )
}
