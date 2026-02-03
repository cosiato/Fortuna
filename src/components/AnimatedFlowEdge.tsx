import { type EdgeProps, getBezierPath } from '@xyflow/react';

interface AnimatedFlowEdgeData {
  flowType: 'inflow' | 'outflow';
}

const PARTICLE_COUNT = 4;
const DURATION = 2.5;

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

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const delay = (i / PARTICLE_COUNT) * DURATION;
    return { key: `${id}-p-${i}`, delay };
  });

  return (
    <>
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.15}
      />

      <path
        d={edgePath}
        fill="none"
        stroke={`url(#gradient-${id})`}
        strokeWidth={2}
        strokeOpacity={0}
      >
        <animate
          attributeName="stroke-opacity"
          values="0;0.4;0"
          dur={`${DURATION}s`}
          repeatCount="indefinite"
        />
      </path>

      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity={isInflow ? 0.6 : 0} />
          <stop offset="100%" stopColor={color} stopOpacity={isInflow ? 0 : 0.6} />
        </linearGradient>

        <filter id={`glow-${id}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {particles.map(({ key, delay }) => (
        <circle
          key={key}
          r={2}
          fill={color}
          opacity={0}
          filter={`url(#glow-${id})`}
        >
          <animateMotion
            dur={`${DURATION}s`}
            repeatCount="indefinite"
            path={edgePath}
            begin={`${delay}s`}
            keyPoints={isInflow ? '0;1' : '0;1'}
            keyTimes="0;1"
          />
          <animate
            attributeName="opacity"
            values="0;0.8;0.8;0"
            keyTimes="0;0.1;0.8;1"
            dur={`${DURATION}s`}
            repeatCount="indefinite"
            begin={`${delay}s`}
          />
          <animate
            attributeName="r"
            values="1.5;2.5;1.5"
            keyTimes="0;0.5;1"
            dur={`${DURATION}s`}
            repeatCount="indefinite"
            begin={`${delay}s`}
          />
        </circle>
      ))}
    </>
  );
}
