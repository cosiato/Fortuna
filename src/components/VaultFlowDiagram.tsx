import { useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  useNodesState,
  useEdgesState,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import type { Account, CashFlow } from "@/types/database";
import type { SupportedCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import VaultFlowNode from "@/components/VaultFlowNode";
import CashFlowNode from "@/components/CashFlowNode";
import PlaceholderFlowNode from "@/components/PlaceholderFlowNode";
import AnimatedFlowEdge from "@/components/AnimatedFlowEdge";
import PlaceholderFlowEdge from "@/components/PlaceholderFlowEdge";

interface VaultFlowDiagramProps {
  account: Account;
  cashFlows: readonly CashFlow[];
  displayCurrency: SupportedCurrency;
  displayBalance: number;
  exchangeRates: { [currency: string]: number };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onAddFlow: (flowType?: "inflow" | "outflow") => void;
}

const nodeTypes: NodeTypes = {
  vault: VaultFlowNode,
  cashFlow: CashFlowNode,
  placeholder: PlaceholderFlowNode,
};

const edgeTypes: EdgeTypes = {
  animated: AnimatedFlowEdge,
  placeholder: PlaceholderFlowEdge,
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
  exchangeRates,
  onEdit,
  onDelete,
  onToggle,
  onAddFlow,
}: VaultFlowDiagramProps) {
  const { t } = useTranslation("vaults");
  const inflows = useMemo(
    () => cashFlows.filter((f) => f.flowType === "inflow"),
    [cashFlows],
  );
  const outflows = useMemo(
    () => cashFlows.filter((f) => f.flowType === "outflow"),
    [cashFlows],
  );

  const convertAmount = useCallback(
    (amount: number): number => {
      const accountRate = exchangeRates[account.currency] ?? 1;
      const displayRate = exchangeRates[displayCurrency] ?? 1;
      return amount * (displayRate / accountRate);
    },
    [exchangeRates, account.currency, displayCurrency],
  );

  const buildNodes = useCallback((): Node[] => {
    const inflowCount = Math.max(inflows.length, 1);
    const outflowCount = Math.max(outflows.length, 1);

    const vaultY = Math.max(
      (Math.max(inflowCount, outflowCount) * (NODE_HEIGHT + VERTICAL_GAP)) / 2 -
        NODE_HEIGHT / 2,
      60,
    );

    const vaultNode: Node = {
      id: "vault",
      type: "vault",
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

    const inflowNodes: Node[] =
      inflows.length > 0
        ? inflows.map((flow, i) => {
            const startY =
              vaultY -
              ((inflows.length - 1) * (NODE_HEIGHT + VERTICAL_GAP)) / 2;
            return {
              id: `inflow-${flow.id}`,
              type: "cashFlow",
              position: {
                x: CENTER_X - SIDE_OFFSET - NODE_WIDTH,
                y: startY + i * (NODE_HEIGHT + VERTICAL_GAP),
              },
              data: {
                flowId: flow.id,
                name: flow.name,
                amount: convertAmount(flow.amount),
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
            };
          })
        : [
            {
              id: "placeholder-inflow",
              type: "placeholder",
              position: {
                x: CENTER_X - SIDE_OFFSET - NODE_WIDTH,
                y: vaultY,
              },
              data: {
                flowType: "inflow" as const,
                onAdd: () => onAddFlow("inflow"),
              },
              sourcePosition: Position.Right,
              draggable: false,
            },
          ];

    const outflowNodes: Node[] =
      outflows.length > 0
        ? outflows.map((flow, i) => {
            const startY =
              vaultY -
              ((outflows.length - 1) * (NODE_HEIGHT + VERTICAL_GAP)) / 2;
            return {
              id: `outflow-${flow.id}`,
              type: "cashFlow",
              position: {
                x: CENTER_X + SIDE_OFFSET,
                y: startY + i * (NODE_HEIGHT + VERTICAL_GAP),
              },
              data: {
                flowId: flow.id,
                name: flow.name,
                amount: convertAmount(flow.amount),
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
            };
          })
        : [
            {
              id: "placeholder-outflow",
              type: "placeholder",
              position: {
                x: CENTER_X + SIDE_OFFSET,
                y: vaultY,
              },
              data: {
                flowType: "outflow" as const,
                onAdd: () => onAddFlow("outflow"),
              },
              targetPosition: Position.Left,
              draggable: false,
            },
          ];

    return [vaultNode, ...inflowNodes, ...outflowNodes];
  }, [
    account,
    inflows,
    outflows,
    convertAmount,
    displayCurrency,
    displayBalance,
    onEdit,
    onDelete,
    onToggle,
    onAddFlow,
  ]);

  const buildEdges = useCallback((): Edge[] => {
    const inflowEdges: Edge[] =
      inflows.length > 0
        ? inflows.map((flow) => ({
            id: `edge-inflow-${flow.id}`,
            source: `inflow-${flow.id}`,
            target: "vault",
            type: "animated",
            data: { flowType: "inflow" as const },
            animated: false,
          }))
        : [
            {
              id: "edge-placeholder-inflow",
              source: "placeholder-inflow",
              target: "vault",
              type: "placeholder",
              animated: false,
            },
          ];

    const outflowEdges: Edge[] =
      outflows.length > 0
        ? outflows.map((flow) => ({
            id: `edge-outflow-${flow.id}`,
            source: "vault",
            target: `outflow-${flow.id}`,
            type: "animated",
            data: { flowType: "outflow" as const },
            animated: false,
          }))
        : [
            {
              id: "edge-placeholder-outflow",
              source: "vault",
              target: "placeholder-outflow",
              type: "placeholder",
              animated: false,
            },
          ];

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

  const containerHeight = Math.max(
    200,
    Math.max(inflows.length, outflows.length) * (NODE_HEIGHT + VERTICAL_GAP) +
      80,
  );

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
          onClick={() => onAddFlow()}
        >
          <Icon
            icon="solar:add-circle-linear"
            width={14}
            height={14}
            className="mr-1"
          />
          <span className="text-xs">{t("cashFlow.addFlowBtn")}</span>
        </Button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
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
