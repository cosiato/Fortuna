import { useMemo, useCallback, useEffect } from 'react';
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
import { Icon } from '@iconify/react';
import type { Account, CashFlow } from '@/types/database';
import type { SupportedCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
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
  onAddFlow: () => void;
  onOpenProjection: () => void;
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
  onAddFlow,
  onOpenProjection,
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
        onOpenProjection,
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
  }, [account, inflows, outflows, displayCurrency, displayBalance, onEdit, onDelete, onToggle, onOpenProjection]);

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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const containerHeight = Math.max(200, Math.max(inflows.length, outflows.length) * (NODE_HEIGHT + VERTICAL_GAP) + 80);

  return (
    <div
      className="relative flex items-center justify-center rounded-lg border border-slate-800/50 bg-slate-900/20 overflow-hidden"
      style={{ height: containerHeight }}
    >
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-accent hover:text-accent/80 hover:bg-accent/10"
          onClick={onAddFlow}
        >
          <Icon icon="solar:add-circle-linear" width={14} height={14} className="mr-1" />
          <span className="text-xs">Add Flow</span>
        </Button>
      </div>
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
