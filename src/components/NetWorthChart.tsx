'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Snapshot } from '@/lib/db';
import { SupportedCurrency, formatCurrency } from '@/lib/currency';
import { Card, CardContent } from '@/components/ui/card';

interface NetWorthChartProps {
  snapshots: Snapshot[];
  displayCurrency: SupportedCurrency;
  exchangeRates: { [currency: string]: number };
}

function convertValue(
  value: number,
  fromCurrency: string,
  toCurrency: string,
  rates: { [currency: string]: number }
): number {
  if (fromCurrency === toCurrency) return value;

  let valueInUsd = value;
  if (fromCurrency !== 'USD') {
    const fromRate = rates[fromCurrency];
    if (fromRate && fromRate > 0) {
      valueInUsd = value / fromRate;
    }
  }

  const toRate = rates[toCurrency];
  if (toRate && toRate > 0) {
    return valueInUsd * toRate;
  }

  return valueInUsd;
}

export default function NetWorthChart({
  snapshots,
  displayCurrency,
  exchangeRates,
}: NetWorthChartProps) {
  const data = snapshots.map((snapshot) => ({
    date: new Date(snapshot.recordedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    value: convertValue(snapshot.totalValue, snapshot.currency, displayCurrency, exchangeRates),
  }));

  if (data.length === 0) {
    return (
      <Card className="h-64">
        <CardContent className="h-full flex items-center justify-center p-8">
          <p className="text-muted-foreground">No historical data yet. Snapshots are recorded daily.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-64">
      <CardContent className="h-full p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) =>
                displayCurrency === 'BTC'
                  ? `B${value.toFixed(4)}`
                  : new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: displayCurrency,
                      notation: 'compact',
                    }).format(value)
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#9CA3AF' }}
              formatter={(value) => [
                formatCurrency(value as number, displayCurrency),
                'Net Worth',
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3B82F6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
