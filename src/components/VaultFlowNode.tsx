import { Handle, Position, type NodeProps } from '@xyflow/react';
import { getCountryFlag } from '@/lib/countries';
import { formatCurrency, type SupportedCurrency } from '@/lib/currency';

interface VaultFlowNodeData {
  name: string;
  balance: number;
  currency: string;
  countryCode: string;
  displayCurrency: SupportedCurrency;
  displayBalance: number;
}

export default function VaultFlowNode({ data }: NodeProps & { data: VaultFlowNodeData }) {
  const flag = getCountryFlag(data.countryCode);

  return (
    <div className="relative px-5 py-4 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-600/40 shadow-[0_0_12px_rgba(100,116,139,0.1)] min-w-[160px]">
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-none !w-0 !h-0" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-none !w-0 !h-0" />

      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{flag}</span>
        <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
          {data.name}
        </span>
      </div>
      <p className="text-base font-bold text-accent text-center">
        {formatCurrency(data.displayBalance, data.displayCurrency)}
      </p>
    </div>
  );
}
