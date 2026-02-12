import { useState, useMemo, useCallback } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { CashFlow } from '@/types/database';
import { calculateProjection } from '@/lib/cashFlowProjection';
import { formatCurrency, type SupportedCurrency } from '@/lib/currency';

interface VaultProjectionChartProps {
  currentBalance: number;
  cashFlows: readonly CashFlow[];
  displayCurrency: SupportedCurrency;
}

const PERIOD_OPTIONS = [
  { label: '1M', value: 1 },
  { label: '3M', value: 3 },
  { label: '6M', value: 6 },
  { label: '12M', value: 12 },
] as const;

function computeTickInterval(months: number): number {
  if (months <= 1) return 7;
  if (months <= 3) return 14;
  if (months <= 6) return 4;
  return 4;
}

export default function VaultProjectionChart({
  currentBalance,
  cashFlows,
  displayCurrency,
}: VaultProjectionChartProps) {
  const [months, setMonths] = useState<number>(6);

  const data = useMemo(
    () => calculateProjection(currentBalance, cashFlows, months),
    [currentBalance, cashFlows, months],
  );

  const tickInterval = computeTickInterval(months);

  const xAxisTickFormatter = useCallback(
    (_value: string, index: number) => {
      if (index % tickInterval !== 0) return '';
      return _value;
    },
    [tickInterval],
  );

  const hasFlows = cashFlows.filter((f) => f.isActive).length > 0;

  if (!hasFlows) {
    return (
      <div className="flex items-center justify-center h-40 rounded-lg border border-dashed border-slate-700/50 bg-slate-900/20">
        <p className="text-sm text-muted-foreground">
          Add active cash flows to see the balance projection.
        </p>
      </div>
    );
  }

  const hasNegative = data.some((d) => d.balance < 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Balance Projection</h3>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMonths(opt.value)}
              className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                months === opt.value
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'bg-[rgba(23,20,43,0.4)] text-muted-foreground border border-slate-700/30 hover:bg-slate-700/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48 rounded-lg border border-slate-800/50 bg-slate-900/20 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={[...data]} margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
            <defs>
              <linearGradient id="balanceGradientPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFD700" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3D" />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              fontSize={11}
              tickFormatter={xAxisTickFormatter}
              interval={0}
            />
            <YAxis
              yAxisId="balance"
              stroke="#6B7280"
              fontSize={11}
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
            />
            <YAxis yAxisId="events" orientation="right" hide />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E1E2E',
                border: '1px solid #2D2D3D',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(15, 15, 26, 0.3)',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#6B7280' }}
              formatter={(value, name) => {
                const numValue = typeof value === 'number' ? value : 0;
                if (numValue === 0 && name !== 'balance') return [null, null];
                const formatted = formatCurrency(numValue, displayCurrency);
                const labels: Record<string, string> = {
                  balance: 'Balance',
                  inflow: 'Inflow',
                  outflow: 'Outflow',
                };
                return [formatted, labels[name as string] ?? name];
              }}
              itemSorter={() => 0}
            />
            {hasNegative && (
              <ReferenceLine yAxisId="balance" y={0} stroke="#6B7280" strokeDasharray="3 3" />
            )}
            <Bar
              yAxisId="events"
              dataKey="inflow"
              fill="#22c55e"
              fillOpacity={0.6}
              isAnimationActive={false}
            />
            <Bar
              yAxisId="events"
              dataKey="outflow"
              fill="#ef4444"
              fillOpacity={0.6}
              isAnimationActive={false}
            />
            <Area
              yAxisId="balance"
              type="stepAfter"
              dataKey="balance"
              stroke="#FFD700"
              strokeWidth={2}
              fill="url(#balanceGradientPos)"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
