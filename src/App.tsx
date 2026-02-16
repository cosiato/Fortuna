import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import CurrencySelector from "@/components/CurrencySelector"
import NetWorthChart from "@/components/NetWorthChart"
import AssetForm from "@/components/AssetForm"
import AccountForm from "@/components/AccountForm"
import VaultFlowDiagram from "@/components/VaultFlowDiagram"
import VaultProjectionChart from "@/components/VaultProjectionChart"
import CashFlowForm from "@/components/CashFlowForm"
import type { Asset, Account } from "@/types/database"
import { api } from "@/lib/api"
import { SupportedCurrency, formatCurrency, getIntlLocale } from "@/lib/currency"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AssetTile, { CATEGORY_STYLES } from "@/components/AssetTile"
import EntitySelector from "@/components/EntitySelector"
import SlotMachineNumber from "@/components/SlotMachineNumber"
import EntityForm from "@/components/EntityForm"
import DeleteEntityDialog from "@/components/DeleteEntityDialog"
import DeleteAccountDialog from "@/components/DeleteAccountDialog"
import ResetAccountDialog from "@/components/ResetAccountDialog"
import LockScreen from "@/components/LockScreen"
import OnboardingOverlay from "@/components/onboarding/OnboardingOverlay"
import SettingsDialog from "@/components/SettingsDialog"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { getCountryFlag } from "@/lib/countries"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { showErrorToast } from "@/lib/errorHandling"
import { calculateMonthlyTotals, calculateProjection } from "@/lib/cashFlowProjection"
import { useSnapshotRecorder } from "@/hooks/useSnapshotRecorder"
import { getAssetValueInUsd, toUsd, fromUsd, toDisplayCurrency } from "@/lib/currencyConversion"
import { useAppData } from "@/hooks/useAppData"
import { useAssetCrud } from "@/hooks/useAssetCrud"
import { useVaultCrud } from "@/hooks/useVaultCrud"
import { useEntityCrud } from "@/hooks/useEntityCrud"

const CATEGORY_BADGE_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; icon: string }
> = {
  stock: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/25",
    icon: "solar:chart-linear",
  },
  crypto: {
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    border: "border-purple-500/25",
    icon: "solar:money-bag-linear",
  },
  real_estate: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/25",
    icon: "solar:home-linear",
  },
  other: {
    bg: "bg-slate-400/15",
    text: "text-slate-400",
    border: "border-slate-400/25",
    icon: "solar:box-linear",
  },
}

function formatCompactValue(value: number, currency: SupportedCurrency): string {
  if (currency === "BTC") {
    return value >= 1 ? `${value.toFixed(2)} BTC` : `${value.toFixed(4)} BTC`
  }
  return new Intl.NumberFormat(getIntlLocale(), {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export default function App() {
  const [displayCurrency, setDisplayCurrency] = useState<SupportedCurrency>("USD")
  const [isLocked, setIsLocked] = useState(false)
  const [isPinEnabled, setIsPinEnabled] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const { t } = useTranslation(["common", "assets", "vaults", "errors"])

  const { state: appData, actions: appActions, initMetadata } = useAppData()
  const {
    assets,
    accounts,
    snapshots,
    entities,
    cashFlows,
    prices,
    exchangeRates,
    loading,
    isRefreshing,
    refreshCooldown,
  } = appData

  // Apply init metadata once available
  useEffect(() => {
    if (!initMetadata) return
    setDisplayCurrency(initMetadata.displayCurrency)
    setIsPinEnabled(initMetadata.isPinEnabled)
    if (initMetadata.shouldLock) {
      handleLock()
    }
    if (initMetadata.showOnboarding) {
      setShowOnboarding(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initMetadata])

  const handleLock = async () => {
    try {
      await api.settings.lockApp()
    } catch {
      // Lock frontend even if backend call fails
    }
    setIsLocked(true)
  }

  const handleUnlock = async () => {
    setIsLocked(false)
  }

  const handleCurrencyChange = async (currency: SupportedCurrency) => {
    setDisplayCurrency(currency)
    try {
      await api.settings.setCurrencyPreference(currency)
    } catch (error) {
      showErrorToast(error, t("errors:failedToSaveCurrency"))
    }
  }

  const handleResetAccount = async (pin?: string) => {
    try {
      await api.settings.resetAllData(pin)
      appActions.setPrices({})
      setIsPinEnabled(false)
      setIsLocked(false)
      entityCrud.setSelectedEntityId(0)
      setResetDialogOpen(false)
      setSettingsOpen(false)
      localStorage.removeItem("fortuna_onboarding_completed")
      setShowOnboarding(true)
      await appActions.fetchDataOnly()
    } catch (error) {
      showErrorToast(error, t("errors:failedToResetData"))
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "l" && isPinEnabled && !isLocked) {
        e.preventDefault()
        handleLock()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPinEnabled, isLocked])

  const netWorthUsd =
    assets.reduce((sum, asset) => sum + getAssetValueInUsd(asset, prices, exchangeRates), 0) +
    accounts.reduce(
      (sum, account) => sum + toUsd(account.balance, account.currency, exchangeRates),
      0,
    )
  const netWorth = fromUsd(netWorthUsd, displayCurrency, exchangeRates)

  const { requestSnapshot, recordSnapshotNow } = useSnapshotRecorder({
    netWorth: netWorthUsd,
    currency: "USD",
    enabled: !loading,
    onSnapshotsUpdated: appActions.refreshSnapshots,
  })

  const entityCrud = useEntityCrud({
    fetchDataOnly: appActions.fetchDataOnly,
    requestSnapshot,
  })

  const assetCrud = useAssetCrud({
    selectedEntityId: entityCrud.selectedEntityId,
    fetchDataOnly: appActions.fetchDataOnly,
    requestSnapshot,
    setAssets: appActions.setAssets,
    setPrices: appActions.setPrices,
  })

  const vaultCrud = useVaultCrud({
    selectedEntityId: entityCrud.selectedEntityId,
    cashFlows,
    setCashFlows: appActions.setCashFlows,
    fetchDataOnly: appActions.fetchDataOnly,
    requestSnapshot,
  })

  const ASSET_CATEGORIES = [
    {
      key: "stock",
      label: t("assets:type.stock"),
      icon: <Icon icon="solar:chart-linear" width={12} height={12} />,
    },
    {
      key: "crypto",
      label: t("assets:type.crypto"),
      icon: <Icon icon="solar:money-bag-linear" width={12} height={12} />,
    },
    {
      key: "real_estate",
      label: t("assets:type.real_estate"),
      icon: <Icon icon="solar:home-linear" width={12} height={12} />,
    },
    {
      key: "other",
      label: t("assets:type.other"),
      icon: <Icon icon="solar:box-linear" width={12} height={12} />,
    },
  ]

  const filteredAssets = assets.filter((asset) => asset.entityId === entityCrud.selectedEntityId)
  const filteredAccounts = accounts.filter(
    (account) => account.entityId === entityCrud.selectedEntityId,
  )

  const assetsByType = ASSET_CATEGORIES.reduce<Record<string, Asset[]>>((acc, category) => {
    acc[category.key] = filteredAssets.filter((asset) => asset.type === category.key)
    return acc
  }, {})

  const nonEmptyCategories = ASSET_CATEGORIES.filter(
    (category) => assetsByType[category.key].length > 0,
  )

  const defaultAssetTab = nonEmptyCategories[0]?.key || "stock"
  const [activeTab, setActiveTab] = useState(defaultAssetTab)

  useEffect(() => {
    if (nonEmptyCategories.length > 0 && !nonEmptyCategories.some((c) => c.key === activeTab)) {
      setActiveTab(nonEmptyCategories[0].key)
    }
  }, [nonEmptyCategories, activeTab])

  const getAssetValue = (asset: Asset): number =>
    fromUsd(getAssetValueInUsd(asset, prices, exchangeRates), displayCurrency, exchangeRates)

  const getAccountValue = (account: Account): number =>
    toDisplayCurrency(account.balance, account.currency, displayCurrency, exchangeRates)

  const entityTotals = entities.reduce<Record<number, number>>((acc, entity) => {
    const entityAssets = assets.filter((a) => a.entityId === entity.id)
    const entityAccounts = accounts.filter((a) => a.entityId === entity.id)

    const assetsTotal = entityAssets.reduce((sum, asset) => sum + getAssetValue(asset), 0)
    const accountsTotal = entityAccounts.reduce((sum, account) => sum + getAccountValue(account), 0)

    acc[entity.id] = assetsTotal + accountsTotal
    return acc
  }, {})

  const categoryBadgeData = ASSET_CATEGORIES.map((cat) => {
    const catAssets = assets.filter((a) => a.type === cat.key)
    const total = catAssets.reduce((sum, asset) => sum + getAssetValue(asset), 0)
    return { key: cat.key, label: cat.label, count: catAssets.length, total }
  }).filter((c) => c.count > 0)

  const vaultBadgeTotal = accounts.reduce((sum, acc) => sum + getAccountValue(acc), 0)

  useEffect(() => {
    if (!loading && (assets.length > 0 || accounts.length > 0)) {
      recordSnapshotNow()
      api.snapshots.prune().catch(() => {
        // Pruning is best-effort; failures do not affect user experience
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <img src="/logo.png" alt="Fortuna" className="w-24 h-24 animate-gentle-bounce" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 bg-vignette pointer-events-none" />
      <header className="border-b border-border px-6 py-4 relative">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Fortuna" className="w-7 h-7 logo-hover" />
            <h1 className="text-2xl font-bold text-accent leading-none pt-0.5">Fortuna</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1.5 text-muted-foreground hover:text-foreground disabled:opacity-100"
              onClick={appActions.handleManualRefresh}
              disabled={isRefreshing || refreshCooldown}
              title={t("common:refreshPrices")}
            >
              {refreshCooldown && !isRefreshing ? (
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs text-emerald-500">{t("common:updated")}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Icon
                    icon="solar:refresh-linear"
                    width={16}
                    height={16}
                    className={isRefreshing ? "animate-spin" : ""}
                  />
                  <span className="text-xs">{t("common:updatePrices")}</span>
                </span>
              )}
            </Button>
            <CurrencySelector value={displayCurrency} onChange={handleCurrencyChange} />
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setSettingsOpen(true)}
              title={t("common:settings")}
            >
              <Icon icon="solar:settings-linear" width={16} height={16} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 relative">
        <Card className="gradient-border-treasury mb-8 hover:shadow-glow-gold/30">
          <CardContent className="relative z-10 px-6 pt-6 pb-3">
            <SlotMachineNumber
              value={formatCurrency(netWorth, displayCurrency)}
              className="text-4xl font-bold text-accent font-serif"
              duration={700}
            />
            <div className="flex flex-wrap items-center gap-2 mt-3 mb-8">
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
              {accounts.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/15 border border-sky-500/25">
                  <Icon
                    icon="solar:safe-2-linear"
                    className="text-sky-400"
                    width={14}
                    height={14}
                  />
                  <span className="text-xs font-medium text-sky-400">{t("vaults:title")}</span>
                  <span className="text-xs text-muted-foreground/60">|</span>
                  <span className="text-xs font-bold text-sky-400">{accounts.length}</span>
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

        <EntitySelector
          entities={entities}
          selectedEntityId={entityCrud.selectedEntityId}
          onSelect={entityCrud.setSelectedEntityId}
          onAddCompany={() => entityCrud.setEntityFormOpen(true)}
          onEditEntity={entityCrud.handleEditEntity}
          onDeleteEntity={entityCrud.handleDeleteEntityRequest}
          entityTotals={entityTotals}
          displayCurrency={displayCurrency}
        />

        <div className="space-y-6 mb-8">
          <div className="rounded-xl bg-[rgba(23,20,43,0.4)] border border-slate-800/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">{t("assets:title")}</h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-accent hover:text-accent/80 hover:bg-accent/10"
                onClick={() => assetCrud.setAssetFormOpen(true)}
              >
                <span className="text-xl leading-none">+</span>
              </Button>
            </div>
            {filteredAssets.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">{t("assets:noAssets")}</p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="h-auto bg-transparent p-0 flex justify-start gap-1 mb-4">
                  {ASSET_CATEGORIES.map((category) => {
                    const categoryAssets = assetsByType[category.key]
                    const hasAssets = categoryAssets.length > 0

                    return (
                      <TabsTrigger
                        key={category.key}
                        value={category.key}
                        disabled={!hasAssets}
                        className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-md text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground hover:bg-slate-700/30 data-[state=active]:text-foreground data-[state=active]:bg-slate-700/40 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                      >
                        <span className="text-current">{category.icon}</span>
                        <span>{category.label}</span>
                        {hasAssets && (
                          <span className="text-muted-foreground">{categoryAssets.length}</span>
                        )}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {ASSET_CATEGORIES.map((category) => {
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
                                onEdit={assetCrud.handleEditAsset}
                                onDelete={assetCrud.handleDeleteAsset}
                                onQuantityChange={assetCrud.handleQuantityChange}
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

          <div className="rounded-xl bg-[rgba(23,20,43,0.4)] border border-slate-800/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">{t("vaults:title")}</h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-accent hover:text-accent/80 hover:bg-accent/10"
                onClick={() => vaultCrud.setAccountFormOpen(true)}
              >
                <span className="text-xl leading-none">+</span>
              </Button>
            </div>
            {filteredAccounts.length === 0 ? (
              <div className="p-4">
                <p className="text-muted-foreground text-center py-4">{t("vaults:noVaults")}</p>
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-3">
                {filteredAccounts.map((account) => {
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
                            <span className="text-lg">{getCountryFlag(account.countryCode)}</span>
                            <span className="text-sm font-semibold text-foreground">
                              {account.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {account.currency}
                            </span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  vaultCrud.handleEditAccount(account)
                                }}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-accent hover:bg-accent/10"
                              >
                                <Icon icon="solar:pen-linear" width={12} height={12} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  vaultCrud.handleDeleteAccountRequest(account)
                                }}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                              >
                                <Icon icon="solar:trash-bin-trash-linear" width={12} height={12} />
                              </Button>
                            </div>
                          </div>
                          <TooltipProvider delayDuration={300}>
                            <div className="flex items-center gap-3">
                              {hasActiveFlows && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="flex items-center gap-1.5 cursor-default">
                                      <span className={`text-xs font-medium ${netColorClass}`}>
                                        {monthlyTotals.net >= 0 ? "+" : ""}
                                        {formatCurrency(monthlyNetDisplay, displayCurrency)}
                                        <span className="text-muted-foreground">
                                          {t("common:perMonth")}
                                        </span>
                                      </span>
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
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p>{t("common:projectedMonthlyGain")}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-sm font-bold text-accent cursor-default">
                                    {formatCurrency(currentBalanceDisplay, displayCurrency)}
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
                            onEdit={vaultCrud.handleEditCashFlow}
                            onDelete={vaultCrud.handleDeleteCashFlow}
                            onToggle={vaultCrud.handleToggleCashFlow}
                            onAddFlow={(flowType) =>
                              vaultCrud.openAddFlow(account.id, flowType ?? "inflow")
                            }
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

        <AssetForm
          asset={assetCrud.editingAsset}
          open={assetCrud.assetFormOpen}
          onOpenChange={assetCrud.handleAssetFormClose}
          onSubmit={assetCrud.editingAsset ? assetCrud.handleUpdateAsset : assetCrud.handleAddAsset}
        />

        <AccountForm
          account={vaultCrud.editingAccount}
          open={vaultCrud.accountFormOpen}
          onOpenChange={vaultCrud.handleAccountFormClose}
          onSubmit={
            vaultCrud.editingAccount ? vaultCrud.handleUpdateAccount : vaultCrud.handleAddAccount
          }
        />

        <CashFlowForm
          cashFlow={vaultCrud.editingCashFlow}
          accountId={vaultCrud.cashFlowAccountId}
          accountCurrency={accounts.find((a) => a.id === vaultCrud.cashFlowAccountId)?.currency}
          defaultFlowType={vaultCrud.defaultFlowType}
          open={vaultCrud.cashFlowFormOpen}
          onOpenChange={vaultCrud.handleCashFlowFormClose}
          onSubmit={vaultCrud.handleAddCashFlow}
        />

        <EntityForm
          entity={entityCrud.editingEntity}
          open={entityCrud.entityFormOpen}
          onOpenChange={entityCrud.handleEntityFormClose}
          onSubmit={
            entityCrud.editingEntity ? entityCrud.handleUpdateEntity : entityCrud.handleAddCompany
          }
        />

        <DeleteEntityDialog
          open={entityCrud.deleteDialogOpen}
          onOpenChange={entityCrud.setDeleteDialogOpen}
          entity={entityCrud.entityToDelete}
          associatedAssetCount={
            entityCrud.entityToDelete
              ? assets.filter((a) => a.entityId === entityCrud.entityToDelete!.id).length
              : 0
          }
          associatedAccountCount={
            entityCrud.entityToDelete
              ? accounts.filter((a) => a.entityId === entityCrud.entityToDelete!.id).length
              : 0
          }
          onConfirm={entityCrud.handleConfirmDeleteEntity}
        />

        <DeleteAccountDialog
          open={vaultCrud.deleteAccountDialogOpen}
          onOpenChange={vaultCrud.setDeleteAccountDialogOpen}
          account={vaultCrud.accountToDelete}
          associatedCashFlowCount={
            vaultCrud.accountToDelete
              ? cashFlows.filter((f) => f.accountId === vaultCrud.accountToDelete!.id).length
              : 0
          }
          onConfirm={vaultCrud.handleConfirmDeleteAccount}
        />

        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          isPinEnabled={isPinEnabled}
          onPinStatusChange={setIsPinEnabled}
          onLock={handleLock}
          onResetAccount={() => setResetDialogOpen(true)}
        />

        <ResetAccountDialog
          open={resetDialogOpen}
          onOpenChange={setResetDialogOpen}
          onConfirm={handleResetAccount}
          pinEnabled={isPinEnabled}
        />
      </main>

      <footer className="border-t border-border/30 py-3 relative">
        <p className="text-center text-xs text-muted-foreground/40">
          v{__APP_VERSION__} &middot; &copy; {new Date().getFullYear()} {t("common:footer")}{" "}
          &middot; {t("common:madeWithLoveBy")}{" "}
          <a
            href="https://github.com/cosiato"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-muted-foreground/60 transition-colors"
          >
            cosiato
          </a>
        </p>
      </footer>

      <LockScreen isLocked={isLocked} onUnlock={handleUnlock} />
      {!isLocked && (
        <OnboardingOverlay
          show={showOnboarding}
          onComplete={() => {
            localStorage.setItem("fortuna_onboarding_completed", "true")
            setShowOnboarding(false)
          }}
        />
      )}
    </div>
  )
}
