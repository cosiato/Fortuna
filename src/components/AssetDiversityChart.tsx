import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { SupportedCurrency } from "@/lib/currency"
import { formatCompactValue } from "@/components/DashboardView"

interface CategoryBadge {
  key: string
  label: string
  count: number
  total: number
}

interface AssetDiversityChartProps {
  categoryData: CategoryBadge[]
  vaultTotal: number
  vaultCount: number
  displayCurrency: SupportedCurrency
}

interface SliceData {
  key: string
  label: string
  value: number
  count: number
  color: string
  icon: string
}

const SLICE_COLORS: Record<string, string> = {
  stock: "#F59E0B",
  crypto: "#A855F7",
  real_estate: "#10B981",
  other: "#94A3B8",
  vaults: "#0EA5E9",
}

const SLICE_ICONS: Record<string, string> = {
  stock: "solar:chart-linear",
  crypto: "solar:money-bag-linear",
  real_estate: "solar:home-linear",
  other: "solar:box-linear",
  vaults: "solar:safe-2-linear",
}

function CustomTooltip({
  active,
  payload,
  displayCurrency,
}: {
  active?: boolean
  payload?: Array<{ payload: SliceData }>
  displayCurrency: SupportedCurrency
}) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload
  const total = payload[0].payload.value

  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
        <span className="text-xs font-medium text-foreground">{data.label}</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {formatCompactValue(total, displayCurrency)} - {data.count} item
        {data.count !== 1 ? "s" : ""}
      </div>
    </div>
  )
}

export default function AssetDiversityChart({
  categoryData,
  vaultTotal,
  vaultCount,
  displayCurrency,
}: AssetDiversityChartProps) {
  const { t } = useTranslation(["common", "vaults"])

  const slices = useMemo(() => {
    const result: SliceData[] = []

    for (const cat of categoryData) {
      if (cat.total <= 0) continue
      result.push({
        key: cat.key,
        label: cat.label,
        value: cat.total,
        count: cat.count,
        color: SLICE_COLORS[cat.key] ?? "#94A3B8",
        icon: SLICE_ICONS[cat.key] ?? "solar:box-linear",
      })
    }

    if (vaultTotal > 0 && vaultCount > 0) {
      result.push({
        key: "vaults",
        label: t("vaults:title"),
        value: vaultTotal,
        count: vaultCount,
        color: SLICE_COLORS.vaults,
        icon: SLICE_ICONS.vaults,
      })
    }

    return result
  }, [categoryData, vaultTotal, vaultCount, t])

  const grandTotal = useMemo(() => slices.reduce((sum, s) => sum + s.value, 0), [slices])

  if (slices.length === 0 || grandTotal <= 0) return null

  return (
    <div className="rounded-xl bg-background border border-border p-5">
      <h2 className="text-sm font-semibold text-foreground mb-3">{t("common:assetDiversity")}</h2>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-48 h-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
                strokeWidth={0}
              >
                {slices.map((slice) => (
                  <Cell key={slice.key} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip displayCurrency={displayCurrency} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {slices.map((slice) => {
            const percentage = ((slice.value / grandTotal) * 100).toFixed(1)
            return (
              <div key={slice.key} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <Icon
                  icon={slice.icon}
                  width={16}
                  height={16}
                  className="shrink-0"
                  style={{ color: slice.color }}
                />
                <span className="text-xs text-foreground font-medium truncate">{slice.label}</span>
                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                  {percentage}% - {formatCompactValue(slice.value, displayCurrency)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
