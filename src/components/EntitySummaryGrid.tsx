import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import type { Account, Asset, Entity } from "@/types/database"
import { SupportedCurrency, formatCurrency } from "@/lib/currency"
import EmptyStateCard from "@/components/EmptyStateCard"

const PAGE_SIZE = 3

const CATEGORY_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  stock: { bg: "bg-amber-500/15", text: "text-amber-400", icon: "solar:chart-linear" },
  crypto: { bg: "bg-purple-500/15", text: "text-purple-400", icon: "solar:money-bag-linear" },
  real_estate: { bg: "bg-emerald-500/15", text: "text-emerald-400", icon: "solar:home-linear" },
  other: { bg: "bg-slate-400/15", text: "text-slate-400", icon: "solar:box-linear" },
  vaults: { bg: "bg-sky-500/15", text: "text-sky-400", icon: "solar:safe-2-linear" },
}

interface EntitySummaryGridProps {
  entities: Entity[]
  entityTotals: Record<number, number>
  displayCurrency: SupportedCurrency
  onSelectEntity: (entityId: number) => void
  assets: Asset[]
  accounts: Account[]
  getAssetValue: (asset: Asset) => number
  getAccountValue: (account: Account) => number
}

function getEntityDisplayName(entity: Entity, personalLabel: string): string {
  return entity.type === "individual" ? personalLabel : entity.name
}

interface CategorySummary {
  key: string
  count: number
}

function getEntityCategories(
  entity: Entity,
  assets: Asset[],
  accounts: Account[],
  getAssetValue: (asset: Asset) => number,
  getAccountValue: (account: Account) => number,
): CategorySummary[] {
  const entityAssets = assets.filter((a) => a.entityId === entity.id)
  const entityAccounts = accounts.filter((a) => a.entityId === entity.id)

  const typeCounts = new Map<string, number>()

  for (const asset of entityAssets) {
    if (getAssetValue(asset) > 0) {
      typeCounts.set(asset.type, (typeCounts.get(asset.type) ?? 0) + 1)
    }
  }

  const vaultCount = entityAccounts.filter((acc) => getAccountValue(acc) > 0).length
  if (vaultCount > 0) {
    typeCounts.set("vaults", vaultCount)
  }

  return Array.from(typeCounts.entries()).map(([key, count]) => ({ key, count }))
}

export default function EntitySummaryGrid({
  entities,
  entityTotals,
  displayCurrency,
  onSelectEntity,
  assets,
  accounts,
  getAssetValue,
  getAccountValue,
}: EntitySummaryGridProps) {
  const { t } = useTranslation(["entities", "common"])
  const [page, setPage] = useState(0)

  const entityCategories = useMemo(() => {
    const mapped = entities.map((entity) => ({
      entity,
      categories: getEntityCategories(entity, assets, accounts, getAssetValue, getAccountValue),
    }))
    mapped.sort((a, b) => (entityTotals[b.entity.id] ?? 0) - (entityTotals[a.entity.id] ?? 0))
    return mapped
  }, [entities, assets, accounts, getAssetValue, getAccountValue, entityTotals])

  const totalPages = Math.ceil(entityCategories.length / PAGE_SIZE)
  const hasPagination = entityCategories.length > PAGE_SIZE
  const currentPage = Math.min(page, Math.max(0, totalPages - 1))
  const pageEntities = entityCategories.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  )

  if (entities.length === 0)
    return (
      <EmptyStateCard
        icon="solar:users-group-rounded-linear"
        title={t("common:empty.entities.title")}
        subtitle={t("common:empty.entities.subtitle")}
      />
    )

  return (
    <div className="rounded-xl bg-background border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{t("entities:summaryTitle")}</h3>
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
      <div className="space-y-1">
        {pageEntities.map(({ entity, categories }) => {
          const total = entityTotals[entity.id] ?? 0
          return (
            <button
              key={entity.id}
              onClick={() => onSelectEntity(entity.id)}
              className="w-full px-2 py-2 rounded-lg hover:bg-secondary transition-colors duration-150 text-left"
            >
              <div className="flex items-center gap-3 justify-between">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                    {getEntityDisplayName(entity, t("entities:personal"))}
                  </div>
                  {categories.length > 0 && (
                    <div className="inline-flex gap-1">
                      {categories.map((cat) => {
                        const config = CATEGORY_CONFIG[cat.key] ?? CATEGORY_CONFIG.other
                        return (
                          <span
                            key={cat.key}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${config.bg}`}
                          >
                            <Icon
                              icon={config.icon}
                              className={config.text}
                              width={11}
                              height={11}
                            />
                            <div className={`text-[10px] font-semibold mt-0.5 ${config.text}`}>
                              {cat.count}
                            </div>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground shrink-0">
                  {formatCurrency(total, displayCurrency)}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
