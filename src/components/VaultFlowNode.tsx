import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Icon } from '@iconify/react';
import { getCountryFlag } from '@/lib/countries';
import { formatCurrency, type SupportedCurrency } from '@/lib/currency';

interface VaultFlowNodeData {
  name: string;
  balance: number;
  currency: string;
  countryCode: string;
  displayCurrency: SupportedCurrency;
  displayBalance: number;
  onOpenProjection?: () => void;
}

export default function VaultFlowNode({ data }: NodeProps & { data: VaultFlowNodeData }) {
  const flag = getCountryFlag(data.countryCode);

  return (
    <div className="relative px-5 py-4 rounded-xl bg-gradient-to-br from-amber-950/60 to-amber-900/30 border-2 border-amber-500/50 shadow-[0_0_20px_rgba(255,215,0,0.15)] min-w-[160px]">
      <Handle type="target" position={Position.Left} className="!bg-green-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-red-500 !w-2 !h-2" />

      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{flag}</span>
        <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
          {data.name}
        </span>
      </div>
      <p className="text-base font-bold text-accent text-center">
        {formatCurrency(data.displayBalance, data.displayCurrency)}
      </p>
      {data.onOpenProjection && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onOpenProjection?.();
          }}
          className="mt-1.5 flex items-center gap-1 mx-auto px-2 py-0.5 rounded-md text-[10px] text-muted-foreground hover:text-accent hover:bg-amber-900/30 transition-colors"
        >
          <Icon icon="solar:graph-up-linear" width={12} height={12} />
          <span>Projection</span>
        </button>
      )}
    </div>
  );
}
