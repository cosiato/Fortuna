import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import { CATEGORY_BADGE_CONFIG, formatCompactValue } from "@/lib/dashboardUtils"
import type { Asset } from "@/types/database"
import { SupportedCurrency } from "@/lib/currency"
import EmptyStateCard from "@/components/EmptyStateCard"

const PAGE_SIZE = 6

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
  const [page, setPage] = useState(0)

  const rankedAssets = useMemo(() => {
    const ranked = assets.map((asset) => ({
      asset,
      value: getAssetValue(asset),
    }))
    ranked.sort((a, b) => b.value - a.value)
    return ranked
  }, [assets, getAssetValue])

  const totalPages = Math.ceil(rankedAssets.length / PAGE_SIZE)
  const hasPagination = rankedAssets.length > PAGE_SIZE
  const currentPage = Math.min(page, Math.max(0, totalPages - 1))
  const pageAssets = rankedAssets.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  if (rankedAssets.length < 1)
    return (
      <EmptyStateCard
        icon="solar:crown-linear"
        title={t("empty.topAssets.title")}
        subtitle={t("empty.topAssets.subtitle")}
      />
    )

  return (
    <div className="rounded-xl bg-background border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{t("topAssets")}</h3>
        {hasPagination && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-0.5 rounded hover:bg-secondary disabled:opacity-30 transition-colors"
            >
              <Icon
                icon="solar:alt-arrow-left-linear"
                width={14}
                height={14}
                className="text-muted-foreground"
              />
            </button>
            <span className="text-[10px] text-muted-foreground tabular-nums min-w-[24px] text-center">
              {currentPage + 1}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-0.5 rounded hover:bg-secondary disabled:opacity-30 transition-colors"
            >
              <Icon
                icon="solar:alt-arrow-right-linear"
                width={14}
                height={14}
                className="text-muted-foreground"
              />
            </button>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {pageAssets.map(({ asset, value }, index) => {
          const rank = currentPage * PAGE_SIZE + index + 1
          const config = CATEGORY_BADGE_CONFIG[asset.type] ?? CATEGORY_BADGE_CONFIG.other
          return (
            <div key={asset.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground/60 w-4 text-right">
                {rank}
              </span>
              <div className={`flex items-center justify-center w-6 h-6 rounded-md ${config.bg}`}>
                <Icon icon={config.icon} className={config.text} width={14} height={14} />
              </div>
              <span className="text-sm font-medium text-foreground flex-1 truncate">
                {asset.name}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatCompactValue(value, displayCurrency)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
