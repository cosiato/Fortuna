import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import type { Account, Asset, Entity } from "@/types/database"
import { SupportedCurrency, formatCurrency } from "@/lib/currency"

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

function getEntityIcon(type: Entity["type"]): string {
  return type === "individual" ? "solar:user-linear" : "solar:buildings-linear"
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
  const { t } = useTranslation(["entities"])

  const entityCategories = useMemo(
    () =>
      entities.map((entity) => ({
        entity,
        categories: getEntityCategories(entity, assets, accounts, getAssetValue, getAccountValue),
      })),
    [entities, assets, accounts, getAssetValue, getAccountValue],
  )

  if (entities.length === 0) return null

  return (
    <div className="rounded-xl bg-background border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">{t("entities:summaryTitle")}</h3>
      <div className="space-y-1">
        {entityCategories.map(({ entity, categories }) => {
          const total = entityTotals[entity.id] ?? 0
          return (
            <button
              key={entity.id}
              onClick={() => onSelectEntity(entity.id)}
              className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-secondary transition-colors duration-150 text-left"
            >
              <div className="w-7 h-7 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
                <Icon
                  icon={getEntityIcon(entity.type)}
                  className="text-accent"
                  width={15}
                  height={15}
                />
              </div>
              <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                {getEntityDisplayName(entity, t("entities:personal"))}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {categories.map((cat) => {
                  const config = CATEGORY_CONFIG[cat.key] ?? CATEGORY_CONFIG.other
                  return (
                    <span
                      key={cat.key}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${config.bg}`}
                    >
                      <Icon icon={config.icon} className={config.text} width={11} height={11} />
                      <div className={`text-[10px] font-semibold mt-0.5 ${config.text}`}>
                        {cat.count}
                      </div>
                    </span>
                  )
                })}
              </div>
              <span className="text-sm font-semibold text-muted-foreground shrink-0">
                {formatCurrency(total, displayCurrency)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
