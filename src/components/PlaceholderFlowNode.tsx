import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Icon } from "@iconify/react"
import { useTranslation } from "react-i18next"

interface PlaceholderFlowNodeData {
  flowType: "inflow" | "outflow"
  onAdd: () => void
}

export default function PlaceholderFlowNode({
  data,
}: NodeProps & { data: PlaceholderFlowNodeData }) {
  const { t } = useTranslation("vaults")
  const isInflow = data.flowType === "inflow"

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        data.onAdd()
      }}
      className="group relative flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-dashed border-border bg-card/30 min-w-[140px] transition-all hover:border-muted-foreground/60 hover:bg-secondary/30 cursor-pointer"
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

      <Icon
        icon="solar:add-circle-linear"
        width={14}
        height={14}
        className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors shrink-0"
      />
      <span className="text-xs text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
        {isInflow ? t("cashFlow.addInflow") : t("cashFlow.addOutflow")}
      </span>
    </button>
  )
}
