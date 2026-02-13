import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { Snapshot } from "@/types/database"
import { SupportedCurrency, formatCurrency } from "@/lib/currency"

// --- TEMPORARY: fake yearly data for chart preview ---
function generateFakeSnapshots(currency: string): Snapshot[] {
  const now = new Date()
  const snapshots: Snapshot[] = []
  let value = 50000
  for (let i = 365; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const trend = 95 * (365 - i) / 365
    const noise = (Math.sin(i * 0.3) * 1500) + (Math.cos(i * 0.07) * 3000)
    value = 50000 + trend * 400 + noise
    snapshots.push({
      id: `fake-${i}`,
      totalValue: Math.max(value, 10000),
      currency,
      recordedAt: date.toISOString(),
    })
  }
  return snapshots
}
const USE_FAKE_DATA = true
// --- END TEMPORARY ---

interface NetWorthChartProps {
  snapshots: Snapshot[]
  displayCurrency: SupportedCurrency
  exchangeRates: { [currency: string]: number }
}

function convertValue(
  value: number,
  fromCurrency: string,
  toCurrency: string,
  rates: { [currency: string]: number },
): number {
  if (fromCurrency === toCurrency) return value

  let valueInUsd = value
  if (fromCurrency !== "USD") {
    const fromRate = rates[fromCurrency]
    if (fromRate && fromRate > 0) {
      valueInUsd = value / fromRate
    }
  }

  const toRate = rates[toCurrency]
  if (toRate && toRate > 0) {
    return valueInUsd * toRate
  }

  return valueInUsd
}

export default function NetWorthChart({
  snapshots,
  displayCurrency,
  exchangeRates,
}: NetWorthChartProps) {
  // TEMPORARY: use fake data when flag is on
  const sourceSnapshots = USE_FAKE_DATA
    ? generateFakeSnapshots(displayCurrency)
    : snapshots

  const latestPerDay = new Map<string, Snapshot>()
  for (const snapshot of sourceSnapshots) {
    const dayKey = new Date(snapshot.recordedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    latestPerDay.set(dayKey, snapshot)
  }

  const data = Array.from(latestPerDay.values()).map((snapshot) => ({
    date: new Date(snapshot.recordedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: convertValue(snapshot.totalValue, snapshot.currency, displayCurrency, exchangeRates),
  }))

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No history yet</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 24, bottom: 0 }}>
        <defs>
          <linearGradient id="netWorthAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD700" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3D" vertical={false} />
        <XAxis dataKey="date" tick={false} axisLine={{ stroke: "#2D2D3D" }} tickLine={false} />
        <YAxis
          stroke="#4B5563"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(value) =>
            displayCurrency === "BTC"
              ? `B${value.toFixed(2)}`
              : new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: displayCurrency,
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(value)
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1E1E2E",
            border: "1px solid #2D2D3D",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(15, 15, 26, 0.3)",
            fontSize: "12px",
          }}
          labelStyle={{ color: "#6B7280" }}
          formatter={(value) => [formatCurrency(value as number, displayCurrency), "Net Worth"]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#FFD700"
          strokeWidth={2}
          fill="url(#netWorthAreaGradient)"
          dot={false}
          activeDot={{ r: 3, fill: "#FFD700", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
