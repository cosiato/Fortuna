import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Icon } from '@iconify/react';
import type { CashFlowFrequency, CashFlowType, CashFlowCategory } from '@/types/database';
import { CASH_FLOW_CATEGORIES } from '@/lib/cashFlowCategories';
import { formatCurrency, type SupportedCurrency } from '@/lib/currency';

interface CashFlowNodeData {
  flowId: string;
  name: string;
  amount: number;
  frequency: CashFlowFrequency;
  flowType: CashFlowType;
  category: CashFlowCategory;
  isActive: boolean;
  currency: SupportedCurrency;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const FREQUENCY_LABELS: Record<CashFlowFrequency, string> = {
  weekly: '/wk',
  monthly: '/mo',
  yearly: '/yr',
};

export default function CashFlowNode({ data }: NodeProps & { data: CashFlowNodeData }) {
  const categoryInfo = CASH_FLOW_CATEGORIES[data.category];
  const isInflow = data.flowType === 'inflow';

  const bgClass = isInflow
    ? 'from-green-950/50 to-green-900/20 border-green-700/40'
    : 'from-red-950/50 to-red-900/20 border-red-700/40';

  const amountColor = isInflow ? 'text-green-400' : 'text-red-400';

  return (
    <div
      className={`group relative px-3 py-2.5 rounded-lg bg-gradient-to-br ${bgClass} border min-w-[140px] transition-all ${!data.isActive ? 'opacity-40' : ''}`}
    >
      {isInflow ? (
        <Handle type="source" position={Position.Right} className="!bg-green-500 !w-2 !h-2" />
      ) : (
        <Handle type="target" position={Position.Left} className="!bg-red-500 !w-2 !h-2" />
      )}

      <div className="flex items-center gap-2 mb-1">
        <Icon icon={categoryInfo.icon} width={14} height={14} className="text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
          {data.name}
        </span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className={`text-sm font-bold ${amountColor}`}>
          {formatCurrency(data.amount, data.currency)}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {FREQUENCY_LABELS[data.frequency]}
        </span>
      </div>

      <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggle(data.flowId);
          }}
          className="w-5 h-5 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-slate-600"
          title={data.isActive ? 'Pause' : 'Resume'}
        >
          <Icon
            icon={data.isActive ? 'solar:pause-linear' : 'solar:play-linear'}
            width={10}
            height={10}
            className="text-foreground"
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onEdit(data.flowId);
          }}
          className="w-5 h-5 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-slate-600"
          title="Edit"
        >
          <Icon icon="solar:pen-linear" width={10} height={10} className="text-foreground" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete(data.flowId);
          }}
          className="w-5 h-5 rounded-full bg-red-900/80 border border-red-700/50 flex items-center justify-center hover:bg-red-800"
          title="Delete"
        >
          <Icon icon="solar:trash-bin-2-linear" width={10} height={10} className="text-red-300" />
        </button>
      </div>
    </div>
  );
}
