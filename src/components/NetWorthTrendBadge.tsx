import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import type { Snapshot } from "@/types/database"

interface NetWorthTrendBadgeProps {
  snapshots: Snapshot[]
  currentNetWorthUsd: number
}

function computeTrend(
  snapshots: readonly Snapshot[],
  currentNetWorthUsd: number,
): { percentChange: number; isPositive: boolean } | null {
  if (snapshots.length < 2) return null

  const now = Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000
  const thirtyDaysMs = 30 * oneDayMs

  const targetTime = now - thirtyDaysMs

  // Find the snapshot closest to 30 days ago
  let closest: Snapshot | null = null
  let closestDiff = Infinity

  for (const snap of snapshots) {
    const snapTime = new Date(snap.recordedAt).getTime()
    // Only consider snapshots older than 1 day
    if (now - snapTime < oneDayMs) continue
    const diff = Math.abs(snapTime - targetTime)
    if (diff < closestDiff) {
      closestDiff = diff
      closest = snap
    }
  }

  if (!closest || closest.totalValue === 0) return null

  const percentChange =
    ((currentNetWorthUsd - closest.totalValue) / Math.abs(closest.totalValue)) * 100

  return {
    percentChange,
    isPositive: percentChange >= 0,
  }
}

export default function NetWorthTrendBadge({
  snapshots,
  currentNetWorthUsd,
}: NetWorthTrendBadgeProps) {
  const { t } = useTranslation("common")

  const trend = useMemo(
    () => computeTrend(snapshots, currentNetWorthUsd),
    [snapshots, currentNetWorthUsd],
  )

  if (!trend) return null

  const sign = trend.isPositive ? "+" : ""
  const formatted = `${sign}${trend.percentChange.toFixed(1)}%`
  const label = t("thirtyDayChange")

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        trend.isPositive
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
          : "bg-red-500/15 text-red-400 border border-red-500/25"
      }`}
    >
      <Icon
        icon={
          trend.isPositive
            ? "solar:arrow-up-linear"
            : "solar:arrow-down-linear"
        }
        width={12}
        height={12}
      />
      {formatted} ({label})
    </span>
  )
}
