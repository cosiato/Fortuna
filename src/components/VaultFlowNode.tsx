import { Handle, Position, type NodeProps } from "@xyflow/react"
import { formatCurrency, type SupportedCurrency } from "@/lib/currency"
import CountryFlag from "@/components/CountryFlag"
import { usePrivacyMode, maskValue } from "@/hooks/usePrivacyMode"

interface VaultFlowNodeData {
  name: string
  balance: number
  currency: string
  countryCode: string
  displayCurrency: SupportedCurrency
  displayBalance: number
}

export default function VaultFlowNode({ data }: NodeProps & { data: VaultFlowNodeData }) {
  const { isPrivate } = usePrivacyMode()

  return (
    <div className="relative px-5 py-4 rounded-xl bg-gradient-to-br from-secondary to-card border border-border shadow-card min-w-[160px]">
      <Handle
        type="target"
        position={Position.Left}
        className="!opacity-0 !w-0 !h-0 !min-w-0 !min-h-0 !border-none !pointer-events-none"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!opacity-0 !w-0 !h-0 !min-w-0 !min-h-0 !border-none !pointer-events-none"
      />

      <div className="flex items-center gap-2 mb-1">
        <CountryFlag code={data.countryCode} />
        <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
          {data.name}
        </span>
      </div>
      <p className="text-base font-bold text-accent text-center">
        {maskValue(isPrivate, formatCurrency(data.displayBalance, data.displayCurrency))}
      </p>
    </div>
  )
}
