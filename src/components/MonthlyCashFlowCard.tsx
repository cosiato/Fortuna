import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import { SupportedCurrency } from "@/lib/currency"
import { formatCompactValue } from "@/lib/dashboardUtils"

interface MonthlyCashFlowCardProps {
  totalInflow: number
  totalOutflow: number
  net: number
  displayCurrency: SupportedCurrency
}

function getSavingsRateColor(rate: number): string {
  if (rate < 10) return "bg-red-500/15 text-red-400 border-red-500/25"
  if (rate < 20) return "bg-amber-500/15 text-amber-400 border-amber-500/25"
  return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
}

export default function MonthlyCashFlowCard({
  totalInflow,
  totalOutflow,
  net,
  displayCurrency,
}: MonthlyCashFlowCardProps) {
  const { t } = useTranslation("common")

  const savingsRate = totalInflow > 0 ? (net / totalInflow) * 100 : 0
  const clampedRate = Math.max(0, savingsRate)

  return (
    <div className="rounded-xl bg-background border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{t("monthlyOverview")}</h3>
        {totalInflow > 0 && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getSavingsRateColor(clampedRate)}`}
          >
            {t("savingsRate")}: {clampedRate.toFixed(0)}%
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald-500/15">
            <Icon
              icon="solar:arrow-up-linear"
              className="text-emerald-400"
              width={16}
              height={16}
            />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("inflow")}</p>
            <p className="text-sm font-semibold text-emerald-400">
              {formatCompactValue(totalInflow, displayCurrency)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-red-500/15">
            <Icon icon="solar:arrow-down-linear" className="text-red-400" width={16} height={16} />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("outflow")}</p>
            <p className="text-sm font-semibold text-red-400">
              {formatCompactValue(totalOutflow, displayCurrency)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-md ${
              net >= 0 ? "bg-emerald-500/15" : "bg-red-500/15"
            }`}
          >
            <Icon
              icon={net >= 0 ? "solar:arrow-up-linear" : "solar:arrow-down-linear"}
              className={net >= 0 ? "text-emerald-400" : "text-red-400"}
              width={16}
              height={16}
            />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("net")}</p>
            <p
              className={`text-sm font-semibold ${net >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {formatCompactValue(net, displayCurrency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
