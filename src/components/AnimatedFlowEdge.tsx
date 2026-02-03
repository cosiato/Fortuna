import { type EdgeProps, getBezierPath } from '@xyflow/react';

interface AnimatedFlowEdgeData {
  flowType: 'inflow' | 'outflow';
}

export default function AnimatedFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps & { data?: AnimatedFlowEdgeData }) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const isInflow = data?.flowType === 'inflow';
  const color = isInflow ? '#22c55e' : '#ef4444';

  return (
    <>
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeOpacity={0.3}
      />
      <circle r={3} fill={color}>
        <animateMotion
          dur="2s"
          repeatCount="indefinite"
          path={edgePath}
          keyPoints={isInflow ? '0;1' : '1;0'}
          keyTimes="0;1"
        />
      </circle>
    </>
  );
}
