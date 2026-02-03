import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Icon } from '@iconify/react';

interface PlaceholderFlowNodeData {
  flowType: 'inflow' | 'outflow';
  onAdd: () => void;
}

export default function PlaceholderFlowNode({ data }: NodeProps & { data: PlaceholderFlowNodeData }) {
  const isInflow = data.flowType === 'inflow';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        data.onAdd();
      }}
      className="group relative flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-dashed border-slate-700/60 bg-slate-900/30 min-w-[140px] transition-all hover:border-slate-500/60 hover:bg-slate-800/30 cursor-pointer"
    >
      {isInflow ? (
        <Handle type="source" position={Position.Right} className="!bg-transparent !border-none !w-0 !h-0" />
      ) : (
        <Handle type="target" position={Position.Left} className="!bg-transparent !border-none !w-0 !h-0" />
      )}

      <Icon
        icon="solar:add-circle-linear"
        width={14}
        height={14}
        className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors shrink-0"
      />
      <span className="text-xs text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
        Add {isInflow ? 'inflow' : 'outflow'}
      </span>
    </button>
  );
}
