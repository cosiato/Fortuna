import { type EdgeProps, getBezierPath } from "@xyflow/react"

export default function PlaceholderFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <path
      id={id}
      d={edgePath}
      fill="none"
      stroke="#334155"
      strokeWidth={1}
      strokeDasharray="4 4"
      strokeOpacity={0.5}
    />
  )
}
