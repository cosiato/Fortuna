import { useTranslation } from "react-i18next"
import { SupportedCurrency } from "@/lib/currency"
import { formatCompactValue } from "@/lib/dashboardUtils"
import EmptyStateCard from "@/components/EmptyStateCard"

interface LiquidityCardProps {
  liquidTotal: number
  illiquidTotal: number
  displayCurrency: SupportedCurrency
}

export default function LiquidityCard({
  liquidTotal,
  illiquidTotal,
  displayCurrency,
}: LiquidityCardProps) {
  const { t } = useTranslation("common")

  const total = liquidTotal + illiquidTotal
  if (total <= 0)
    return (
      <EmptyStateCard
        icon="solar:water-linear"
        title={t("empty.liquidity.title")}
        subtitle={t("empty.liquidity.subtitle")}
      />
    )

  const liquidPct = (liquidTotal / total) * 100
  const illiquidPct = (illiquidTotal / total) * 100

  return (
    <div className="rounded-xl bg-background border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">{t("liquidity")}</h3>
      <div className="flex w-full h-3 rounded-full overflow-hidden mb-3">
        {liquidPct > 0 && (
          <div
            className="bg-sky-500 transition-all duration-500"
            style={{ width: `${liquidPct}%` }}
          />
        )}
        {illiquidPct > 0 && (
          <div
            className="bg-amber-500/60 transition-all duration-500"
            style={{ width: `${illiquidPct}%` }}
          />
        )}
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span className="text-muted-foreground">
            {t("liquid")} {liquidPct.toFixed(0)}%
          </span>
          <span className="font-semibold text-foreground">
            {formatCompactValue(liquidTotal, displayCurrency)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <span className="text-muted-foreground">
            {t("illiquid")} {illiquidPct.toFixed(0)}%
          </span>
          <span className="font-semibold text-foreground">
            {formatCompactValue(illiquidTotal, displayCurrency)}
          </span>
        </div>
      </div>
    </div>
  )
}
