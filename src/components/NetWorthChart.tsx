import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { Snapshot } from "@/types/database"
import { SupportedCurrency, formatCurrency } from "@/lib/currency"
import { Card, CardContent } from "@/components/ui/card"

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
  const latestPerDay = new Map<string, Snapshot>()
  for (const snapshot of snapshots) {
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
      <Card className="h-32">
        <CardContent className="h-full flex items-center justify-center p-8">
          <p className="text-muted-foreground">
            No historical data yet. Snapshots are recorded daily.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-40">
      <CardContent className="h-full p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3D" />
            <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={(value) =>
                displayCurrency === "BTC"
                  ? `B${value.toFixed(4)}`
                  : new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: displayCurrency,
                      notation: "compact",
                    }).format(value)
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1E1E2E",
                border: "1px solid #2D2D3D",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(15, 15, 26, 0.3)",
              }}
              labelStyle={{ color: "#6B7280" }}
              formatter={(value) => [formatCurrency(value as number, displayCurrency), "Net Worth"]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#FFD700"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#FFD700" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
