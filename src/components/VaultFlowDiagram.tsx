import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  useNodesState,
  useEdgesState,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Account, CashFlow } from '@/types/database';
import type { SupportedCurrency } from '@/lib/currency';
import VaultFlowNode from '@/components/VaultFlowNode';
import CashFlowNode from '@/components/CashFlowNode';
import AnimatedFlowEdge from '@/components/AnimatedFlowEdge';

interface VaultFlowDiagramProps {
  account: Account;
  cashFlows: readonly CashFlow[];
  displayCurrency: SupportedCurrency;
  displayBalance: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const nodeTypes: NodeTypes = {
  vault: VaultFlowNode,
  cashFlow: CashFlowNode,
};

const edgeTypes: EdgeTypes = {
  animated: AnimatedFlowEdge,
};

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const VERTICAL_GAP = 16;
const CENTER_X = 400;
const SIDE_OFFSET = 280;

export default function VaultFlowDiagram({
  account,
  cashFlows,
  displayCurrency,
  displayBalance,
  onEdit,
  onDelete,
  onToggle,
}: VaultFlowDiagramProps) {
  const inflows = useMemo(
    () => cashFlows.filter((f) => f.flowType === 'inflow'),
    [cashFlows],
  );
  const outflows = useMemo(
    () => cashFlows.filter((f) => f.flowType === 'outflow'),
    [cashFlows],
  );

  const buildNodes = useCallback((): Node[] => {
    const vaultY = Math.max(
      (Math.max(inflows.length, outflows.length) * (NODE_HEIGHT + VERTICAL_GAP)) / 2 - NODE_HEIGHT / 2,
      60,
    );

    const vaultNode: Node = {
      id: 'vault',
      type: 'vault',
      position: { x: CENTER_X - NODE_WIDTH / 2, y: vaultY },
      data: {
        name: account.name,
        balance: account.balance,
        currency: account.currency,
        countryCode: account.countryCode,
        displayCurrency,
        displayBalance,
      },
      draggable: false,
    };

    const inflowStartY = vaultY - ((inflows.length - 1) * (NODE_HEIGHT + VERTICAL_GAP)) / 2;

    const inflowNodes: Node[] = inflows.map((flow, i) => ({
      id: `inflow-${flow.id}`,
      type: 'cashFlow',
      position: {
        x: CENTER_X - SIDE_OFFSET - NODE_WIDTH,
        y: inflowStartY + i * (NODE_HEIGHT + VERTICAL_GAP),
      },
      data: {
        flowId: flow.id,
        name: flow.name,
        amount: flow.amount,
        frequency: flow.frequency,
        flowType: flow.flowType,
        category: flow.category,
        isActive: flow.isActive,
        currency: displayCurrency,
        onEdit,
        onDelete,
        onToggle,
      },
      sourcePosition: Position.Right,
      draggable: false,
    }));

    const outflowStartY = vaultY - ((outflows.length - 1) * (NODE_HEIGHT + VERTICAL_GAP)) / 2;

    const outflowNodes: Node[] = outflows.map((flow, i) => ({
      id: `outflow-${flow.id}`,
      type: 'cashFlow',
      position: {
        x: CENTER_X + SIDE_OFFSET,
        y: outflowStartY + i * (NODE_HEIGHT + VERTICAL_GAP),
      },
      data: {
        flowId: flow.id,
        name: flow.name,
        amount: flow.amount,
        frequency: flow.frequency,
        flowType: flow.flowType,
        category: flow.category,
        isActive: flow.isActive,
        currency: displayCurrency,
        onEdit,
        onDelete,
        onToggle,
      },
      targetPosition: Position.Left,
      draggable: false,
    }));

    return [vaultNode, ...inflowNodes, ...outflowNodes];
  }, [account, inflows, outflows, displayCurrency, displayBalance, onEdit, onDelete, onToggle]);

  const buildEdges = useCallback((): Edge[] => {
    const inflowEdges: Edge[] = inflows.map((flow) => ({
      id: `edge-inflow-${flow.id}`,
      source: `inflow-${flow.id}`,
      target: 'vault',
      type: 'animated',
      data: { flowType: 'inflow' as const },
      animated: false,
    }));

    const outflowEdges: Edge[] = outflows.map((flow) => ({
      id: `edge-outflow-${flow.id}`,
      source: 'vault',
      target: `outflow-${flow.id}`,
      type: 'animated',
      data: { flowType: 'outflow' as const },
      animated: false,
    }));

    return [...inflowEdges, ...outflowEdges];
  }, [inflows, outflows]);

  const initialNodes = useMemo(() => buildNodes(), [buildNodes]);
  const initialEdges = useMemo(() => buildEdges(), [buildEdges]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const hasFlows = cashFlows.length > 0;
  const containerHeight = hasFlows
    ? Math.max(200, Math.max(inflows.length, outflows.length) * (NODE_HEIGHT + VERTICAL_GAP) + 80)
    : 120;

  if (!hasFlows) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-slate-700/50 bg-slate-900/20"
        style={{ height: containerHeight }}
      >
        <p className="text-sm text-muted-foreground">
          No cash flows yet. Add one to see the flow diagram.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-slate-800/50 bg-slate-900/20 overflow-hidden"
      style={{ height: containerHeight }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      />
    </div>
  );
}
