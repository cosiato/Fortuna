import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import NetWorthChart from "@/components/NetWorthChart"
import SlotMachineNumber from "@/components/SlotMachineNumber"
import EntitySummaryGrid from "@/components/EntitySummaryGrid"
import AssetDiversityChart from "@/components/AssetDiversityChart"
import NetWorthTrendBadge from "@/components/NetWorthTrendBadge"
import MonthlyCashFlowCard from "@/components/MonthlyCashFlowCard"
import TopAssetsCard from "@/components/TopAssetsCard"
import LiquidityCard from "@/components/LiquidityCard"
import { Card, CardContent } from "@/components/ui/card"
import type { Account, Asset, Entity, Snapshot } from "@/types/database"
import { SupportedCurrency, formatCurrency } from "@/lib/currency"
import { CATEGORY_BADGE_CONFIG, formatCompactValue, type CategoryBadge } from "@/lib/dashboardUtils"

interface MonthlyTotals {
  totalInflow: number
  totalOutflow: number
  net: number
}

interface DashboardViewProps {
  netWorth: number
  netWorthUsd: number
  displayCurrency: SupportedCurrency
  categoryBadgeData: CategoryBadge[]
  vaultBadgeTotal: number
  accountCount: number
  snapshots: Snapshot[]
  exchangeRates: { [currency: string]: number }
  entities: Entity[]
  entityTotals: Record<number, number>
  onSelectEntity: (entityId: number) => void
  monthlyTotals: MonthlyTotals
  assets: Asset[]
  accounts: Account[]
  getAssetValue: (asset: Asset) => number
  getAccountValue: (account: Account) => number
  liquidTotal: number
  illiquidTotal: number
}

export default function DashboardView({
  netWorth,
  netWorthUsd,
  displayCurrency,
  categoryBadgeData,
  vaultBadgeTotal,
  accountCount,
  snapshots,
  exchangeRates,
  entities,
  entityTotals,
  onSelectEntity,
  monthlyTotals,
  assets,
  accounts,
  getAssetValue,
  getAccountValue,
  liquidTotal,
  illiquidTotal,
}: DashboardViewProps) {
  const { t } = useTranslation(["common", "vaults"])

  return (
    <>
      <Card className="gradient-border-treasury mb-8 hover:shadow-glow-gold/30">
        <CardContent className="relative z-10 px-6 pt-6 pb-3">
          <SlotMachineNumber
            value={formatCurrency(netWorth, displayCurrency)}
            className="text-4xl font-bold text-accent font-serif"
            duration={700}
          />
          <div className="mt-1.5 mb-3">
            <NetWorthTrendBadge snapshots={snapshots} currentNetWorthUsd={netWorthUsd} />
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {categoryBadgeData.map((cat) => {
              const colors = CATEGORY_BADGE_CONFIG[cat.key]
              return (
                <div
                  key={cat.key}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${colors.bg} border ${colors.border}`}
                >
                  <Icon icon={colors.icon} className={colors.text} width={14} height={14} />
                  <span className={`text-xs font-medium ${colors.text}`}>{cat.label}</span>
                  <span className="text-xs text-muted-foreground/60">|</span>
                  <span className={`text-xs font-bold ${colors.text}`}>{cat.count}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCompactValue(cat.total, displayCurrency)}
                  </span>
                </div>
              )
            })}
            {accountCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/15 border border-sky-500/25">
                <Icon icon="solar:safe-2-linear" className="text-sky-400" width={14} height={14} />
                <span className="text-xs font-medium text-sky-400">{t("vaults:title")}</span>
                <span className="text-xs text-muted-foreground/60">|</span>
                <span className="text-xs font-bold text-sky-400">{accountCount}</span>
                <span className="text-xs text-muted-foreground">
                  {formatCompactValue(vaultBadgeTotal, displayCurrency)}
                </span>
              </div>
            )}
          </div>
          <div className="h-36 -mx-2">
            <NetWorthChart
              snapshots={snapshots}
              displayCurrency={displayCurrency}
              exchangeRates={exchangeRates}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <EntitySummaryGrid
          entities={entities}
          entityTotals={entityTotals}
          displayCurrency={displayCurrency}
          onSelectEntity={onSelectEntity}
          assets={assets}
          accounts={accounts}
          getAssetValue={getAssetValue}
          getAccountValue={getAccountValue}
        />
        <TopAssetsCard
          assets={assets}
          getAssetValue={getAssetValue}
          displayCurrency={displayCurrency}
        />
        <AssetDiversityChart
          categoryData={categoryBadgeData}
          vaultTotal={vaultBadgeTotal}
          vaultCount={accountCount}
          displayCurrency={displayCurrency}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <MonthlyCashFlowCard
          totalInflow={monthlyTotals.totalInflow}
          totalOutflow={monthlyTotals.totalOutflow}
          net={monthlyTotals.net}
          displayCurrency={displayCurrency}
        />
        <LiquidityCard
          liquidTotal={liquidTotal}
          illiquidTotal={illiquidTotal}
          displayCurrency={displayCurrency}
        />
      </div>
    </>
  )
}
