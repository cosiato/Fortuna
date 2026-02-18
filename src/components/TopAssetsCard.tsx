import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import { CATEGORY_BADGE_CONFIG, formatCompactValue } from "@/lib/dashboardUtils"
import type { Asset } from "@/types/database"
import { SupportedCurrency } from "@/lib/currency"

interface TopAssetsCardProps {
  assets: Asset[]
  getAssetValue: (asset: Asset) => number
  displayCurrency: SupportedCurrency
}

export default function TopAssetsCard({
  assets,
  getAssetValue,
  displayCurrency,
}: TopAssetsCardProps) {
  const { t } = useTranslation("common")

  const topAssets = useMemo(() => {
    const ranked = assets.map((asset) => ({
      asset,
      value: getAssetValue(asset),
    }))
    ranked.sort((a, b) => b.value - a.value)
    return ranked.slice(0, 5)
  }, [assets, getAssetValue])

  if (topAssets.length < 1) return null

  return (
    <div className="rounded-xl bg-background border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">{t("topAssets")}</h3>
      <div className="space-y-2">
        {topAssets.map(({ asset, value }, index) => {
          const config = CATEGORY_BADGE_CONFIG[asset.type] ?? CATEGORY_BADGE_CONFIG.other
          return (
            <div key={asset.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground/60 w-4 text-right">
                {index + 1}
              </span>
              <div className={`flex items-center justify-center w-6 h-6 rounded-md ${config.bg}`}>
                <Icon icon={config.icon} className={config.text} width={14} height={14} />
              </div>
              <span className="text-sm font-medium text-foreground flex-1 truncate">
                {asset.name}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">
                {formatCompactValue(value, displayCurrency)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
