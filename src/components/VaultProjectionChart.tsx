import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
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
  { label: '3M', value: 3 },
  { label: '6M', value: 6 },
  { label: '12M', value: 12 },
] as const;

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
                  : 'bg-slate-800/40 text-muted-foreground border border-slate-700/30 hover:bg-slate-700/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48 rounded-lg border border-slate-800/50 bg-slate-900/20 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={[...data]} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="balanceGradientPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFD700" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="balanceGradientNeg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3D" />
            <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
            <YAxis
              stroke="#6B7280"
              fontSize={11}
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
            />
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
                const formatted = formatCurrency(numValue, displayCurrency);
                const labels: Record<string, string> = {
                  balance: 'Projected Balance',
                  totalInflow: 'Monthly Inflow',
                  totalOutflow: 'Monthly Outflow',
                };
                return [formatted, labels[name as string] ?? name];
              }}
            />
            {hasNegative && (
              <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />
            )}
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#FFD700"
              strokeWidth={2}
              fill="url(#balanceGradientPos)"
            />
            <Area
              type="monotone"
              dataKey="totalInflow"
              stroke="#22c55e"
              strokeWidth={1}
              strokeOpacity={0.5}
              fill="none"
            />
            <Area
              type="monotone"
              dataKey="totalOutflow"
              stroke="#ef4444"
              strokeWidth={1}
              strokeOpacity={0.5}
              fill="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
