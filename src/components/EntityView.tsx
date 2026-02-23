import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import { motion } from "framer-motion"
import type { Asset, Account, CashFlow, EntityType } from "@/types/database"
import { SupportedCurrency, formatCurrency } from "@/lib/currency"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import AssetTile, { CATEGORY_STYLES } from "@/components/AssetTile"
import { ASSET_CATEGORY_KEYS, CATEGORY_BADGE_CONFIG } from "@/lib/dashboardUtils"
import SlotMachineNumber from "@/components/SlotMachineNumber"
import CountryFlag from "@/components/CountryFlag"
import VaultFlowDiagram from "@/components/VaultFlowDiagram"
import VaultProjectionChart from "@/components/VaultProjectionChart"
import { calculateMonthlyTotals, calculateProjection } from "@/lib/cashFlowProjection"
import { toDisplayCurrency } from "@/lib/currencyConversion"
import PrivacyToggle from "@/components/PrivacyToggle"
import { usePrivacyMode, HIDDEN_VALUE, maskValue } from "@/hooks/usePrivacyMode"

interface EntityViewProps {
  entityName: string
  entityType: EntityType
  entityTotal: number
  assets: Asset[]
  accounts: Account[]
  cashFlows: CashFlow[]
  displayCurrency: SupportedCurrency
  exchangeRates: { [currency: string]: number }
  getAssetValue: (asset: Asset) => number
  getAccountValue: (account: Account) => number
  onAddAsset: () => void
  onEditAsset: (asset: Asset) => void
  onDeleteAsset: (id: string) => void
  onQuantityChange: (id: string, newQuantity: number) => void
  onAddAccount: () => void
  onEditAccount: (account: Account) => void
  onDeleteAccountRequest: (account: Account) => void
  onEditCashFlow: (id: string) => void
  onDeleteCashFlow: (id: string) => void
  onToggleCashFlow: (id: string) => void
  onAddFlow: (accountId: string, flowType: "inflow" | "outflow") => void
}

const ASSET_CATEGORIES = ASSET_CATEGORY_KEYS.map((key) => ({
  key,
  icon: CATEGORY_BADGE_CONFIG[key].icon,
}))

export default function EntityView({
  entityName,
  entityType,
  entityTotal,
  assets,
  accounts,
  cashFlows,
  displayCurrency,
  exchangeRates,
  getAssetValue,
  getAccountValue,
  onAddAsset,
  onEditAsset,
  onDeleteAsset,
  onQuantityChange,
  onAddAccount,
  onEditAccount,
  onDeleteAccountRequest,
  onEditCashFlow,
  onDeleteCashFlow,
  onToggleCashFlow,
  onAddFlow,
}: EntityViewProps) {
  const { t } = useTranslation(["common", "assets", "vaults", "entities"])
  const { isPrivate } = usePrivacyMode()

  const displayName = entityType === "individual" ? t("entities:personal") : entityName

  const categories = ASSET_CATEGORIES.map((cat) => ({
    ...cat,
    label: t(`assets:type.${cat.key}`),
    iconElement: <Icon icon={cat.icon} width={12} height={12} />,
  }))

  const assetsByType = categories.reduce<Record<string, Asset[]>>((acc, category) => {
    acc[category.key] = assets.filter((asset) => asset.type === category.key)
    return acc
  }, {})

  const nonEmptyCategories = categories.filter((category) => assetsByType[category.key].length > 0)

  const defaultAssetTab = nonEmptyCategories[0]?.key || "stock"
  const [activeTab, setActiveTab] = useState<string>(defaultAssetTab)

  useEffect(() => {
    const nonEmptyKeys: string[] = ASSET_CATEGORIES.map((c) => c.key).filter((key) =>
      assets.some((a) => a.type === key),
    )
    if (nonEmptyKeys.length > 0 && !nonEmptyKeys.includes(activeTab)) {
      setActiveTab(nonEmptyKeys[0])
    }
  }, [assets, activeTab])

  return (
    <div className="space-y-6 mb-8">
      <div className="mb-2">
        <h1 className="text-xl font-semibold text-white mb-1">{displayName}</h1>
        <div className="flex items-center gap-2">
          {isPrivate ? (
            <span className="text-3xl font-bold text-accent font-serif">{HIDDEN_VALUE}</span>
          ) : (
            <SlotMachineNumber
              value={formatCurrency(entityTotal, displayCurrency)}
              className="text-3xl font-bold text-accent font-serif"
              duration={700}
            />
          )}
          <PrivacyToggle />
        </div>
      </div>

      <div className="rounded-xl bg-background border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t("assets:title")}</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-accent hover:text-accent/80 hover:bg-accent/10"
            onClick={onAddAsset}
          >
            <span
              className={`text-xl leading-none ${assets.length === 0 ? "animate-gentle-bounce-lg" : ""}`}
            >
              +
            </span>
          </Button>
        </div>
        {assets.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{t("assets:noAssets")}</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-auto bg-transparent p-0 flex justify-start gap-1 mb-4">
              {categories.map((category) => {
                const categoryAssets = assetsByType[category.key]
                const hasAssets = categoryAssets.length > 0

                return (
                  <TabsTrigger
                    key={category.key}
                    value={category.key}
                    disabled={!hasAssets}
                    className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-md text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground hover:bg-slate-700/30 data-[state=active]:text-foreground data-[state=active]:bg-slate-700/40 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                  >
                    <span className="text-current">{category.iconElement}</span>
                    <span>{category.label}</span>
                    {hasAssets && (
                      <span className="text-muted-foreground">{categoryAssets.length}</span>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {categories.map((category) => {
              const categoryAssets = assetsByType[category.key]

              return (
                <TabsContent key={category.key} value={category.key} className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    {categoryAssets.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        {t("assets:noAssetsInCategory", {
                          category: category.label.toLowerCase(),
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {categoryAssets.map((asset) => (
                          <AssetTile
                            key={asset.id}
                            asset={asset}
                            displayValue={getAssetValue(asset)}
                            displayCurrency={displayCurrency}
                            categoryStyle={CATEGORY_STYLES[category.key]}
                            onEdit={onEditAsset}
                            onDelete={onDeleteAsset}
                            onQuantityChange={onQuantityChange}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                </TabsContent>
              )
            })}
          </Tabs>
        )}
      </div>

      <div className="rounded-xl bg-background border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t("vaults:title")}</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-accent hover:text-accent/80 hover:bg-accent/10"
            onClick={onAddAccount}
          >
            <span
              className={`text-xl leading-none ${accounts.length === 0 ? "animate-gentle-bounce-lg" : ""}`}
            >
              +
            </span>
          </Button>
        </div>
        {accounts.length === 0 ? (
          <div className="p-4">
            <p className="text-muted-foreground text-center py-4">{t("vaults:noVaults")}</p>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {accounts.map((account) => {
              const accountFlows = cashFlows.filter((f) => f.accountId === account.id)
              const flowKey = accountFlows
                .map((f) => `${f.id}:${f.amount}:${f.frequency}:${f.isActive}:${f.flowType}`)
                .join(",")
              const hasActiveFlows = accountFlows.some((f) => f.isActive)

              const monthlyTotals = calculateMonthlyTotals(accountFlows)
              const monthlyNetDisplay = toDisplayCurrency(
                monthlyTotals.net,
                account.currency,
                displayCurrency,
                exchangeRates,
              )

              const currentBalanceDisplay = getAccountValue(account)
              const projection1M = calculateProjection(account.balance, accountFlows, 1)
              const projectedBalance =
                projection1M.length > 0
                  ? projection1M[projection1M.length - 1].balance
                  : account.balance
              const projectedBalanceDisplay = toDisplayCurrency(
                projectedBalance,
                account.currency,
                displayCurrency,
                exchangeRates,
              )
              const projectedChange = projectedBalanceDisplay - currentBalanceDisplay
              const projectedChangePct =
                currentBalanceDisplay !== 0
                  ? (projectedChange / Math.abs(currentBalanceDisplay)) * 100
                  : 0

              const netColorClass =
                monthlyTotals.net > 0
                  ? "text-emerald-400"
                  : monthlyTotals.net < 0
                    ? "text-red-400"
                    : "text-muted-foreground"

              return (
                <AccordionItem
                  key={account.id}
                  value={account.id}
                  className="border border-slate-800/50 rounded-lg bg-slate-900/20 overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-[rgba(23,20,43,0.4)]">
                    <div className="flex flex-1 items-center justify-between mr-2">
                      <div className="flex items-center gap-2">
                        <CountryFlag code={account.countryCode} />
                        <span className="text-sm font-semibold text-foreground">
                          {account.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{account.currency}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditAccount(account)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation()
                                onEditAccount(account)
                              }
                            }}
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 cursor-pointer"
                          >
                            <Icon icon="solar:pen-linear" width={12} height={12} />
                          </div>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteAccountRequest(account)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation()
                                onDeleteAccountRequest(account)
                              }
                            }}
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                          >
                            <Icon icon="solar:trash-bin-trash-linear" width={12} height={12} />
                          </div>
                        </div>
                      </div>
                      <TooltipProvider delayDuration={300}>
                        <div className="flex items-center gap-3">
                          {hasActiveFlows && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center gap-1.5 cursor-default">
                                  <span className={`text-xs font-medium ${netColorClass}`}>
                                    {isPrivate ? (
                                      HIDDEN_VALUE
                                    ) : (
                                      <>
                                        {monthlyTotals.net >= 0 ? "+" : ""}
                                        {formatCurrency(monthlyNetDisplay, displayCurrency)}
                                      </>
                                    )}
                                    <span className="text-muted-foreground">
                                      {t("common:perMonth")}
                                    </span>
                                  </span>
                                  {!isPrivate && (
                                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-0.5">
                                      <Icon
                                        icon={
                                          projectedChange >= 0
                                            ? "solar:arrow-up-linear"
                                            : "solar:arrow-down-linear"
                                        }
                                        width={10}
                                        height={10}
                                      />
                                      {projectedChange >= 0 ? "+" : ""}
                                      {projectedChangePct.toFixed(1)}%
                                    </span>
                                  )}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>{t("common:projectedMonthlyGain")}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {!account.isLiquid && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-muted-foreground cursor-default">
                                  <Icon icon="solar:lock-linear" width={14} height={14} />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>{t("vaults:illiquidTooltip")}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm font-bold text-accent cursor-default mt-0.5">
                                {maskValue(
                                  isPrivate,
                                  formatCurrency(currentBalanceDisplay, displayCurrency),
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>{t("common:currentBalance")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <VaultFlowDiagram
                        key={`${account.id}-${flowKey}`}
                        account={account}
                        cashFlows={accountFlows}
                        displayCurrency={displayCurrency}
                        displayBalance={getAccountValue(account)}
                        exchangeRates={exchangeRates}
                        onEdit={onEditCashFlow}
                        onDelete={onDeleteCashFlow}
                        onToggle={onToggleCashFlow}
                        onAddFlow={(flowType) => onAddFlow(account.id, flowType ?? "inflow")}
                      />
                      <VaultProjectionChart
                        currentBalance={getAccountValue(account)}
                        cashFlows={accountFlows}
                        displayCurrency={displayCurrency}
                        accountCurrency={account.currency}
                        exchangeRates={exchangeRates}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </div>
    </div>
  )
}
