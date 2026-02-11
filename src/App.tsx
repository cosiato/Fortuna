import { useEffect, useState, useCallback } from "react"
import { Icon } from "@iconify/react"
import CurrencySelector from "@/components/CurrencySelector"
import NetWorthChart from "@/components/NetWorthChart"
import AssetForm from "@/components/AssetForm"
import AccountForm from "@/components/AccountForm"
import VaultFlowDiagram from "@/components/VaultFlowDiagram"
import VaultProjectionChart from "@/components/VaultProjectionChart"
import CashFlowForm from "@/components/CashFlowForm"
import type {
  Asset,
  Snapshot,
  Account,
  Entity,
  CashFlow,
  CreateCashFlowInput,
  UpdateCashFlowInput,
} from "@/types/database"
import { api } from "@/lib/api"
import { PriceResult, getMultiplePrices, forceRefreshPrices, fetchSinglePrice } from "@/lib/prices"
import {
  SupportedCurrency,
  formatCurrency,
  getExchangeRates,
  forceRefreshExchangeRates,
} from "@/lib/currency"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AssetTile, { CATEGORY_STYLES } from "@/components/AssetTile"
import EntitySelector from "@/components/EntitySelector"
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
import { motion } from "framer-motion"
import { showErrorToast } from "@/lib/errorHandling"
import { calculateMonthlyTotals, calculateProjection } from "@/lib/cashFlowProjection"
import { useSnapshotRecorder } from "@/hooks/useSnapshotRecorder"

export default function App() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedEntityId, setSelectedEntityId] = useState<number>(0)
  const [prices, setPrices] = useState<{ [symbol: string]: PriceResult }>({})
  const [exchangeRates, setExchangeRates] = useState<{ [currency: string]: number }>({
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.5,
    CHF: 0.88,
    HKD: 7.82,
    SGD: 1.34,
    AED: 3.67,
    BTC: 0.000024,
  })
  const [displayCurrency, setDisplayCurrency] = useState<SupportedCurrency>("USD")
  const [loading, setLoading] = useState(true)
  const [assetFormOpen, setAssetFormOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [accountFormOpen, setAccountFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)
  const [entityFormOpen, setEntityFormOpen] = useState(false)
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshCooldown, setRefreshCooldown] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [isPinEnabled, setIsPinEnabled] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([])
  const [cashFlowFormOpen, setCashFlowFormOpen] = useState(false)
  const [editingCashFlow, setEditingCashFlow] = useState<CashFlow | null>(null)
  const [cashFlowAccountId, setCashFlowAccountId] = useState<string>("")
  const [showOnboarding, setShowOnboarding] = useState(false)
  const REFRESH_COOLDOWN = 2 * 60 * 1000 // 2 minutes

  useEffect(() => {
    const saved = localStorage.getItem("displayCurrency")
    if (saved && ["USD", "EUR", "BTC"].includes(saved)) {
      setDisplayCurrency(saved as SupportedCurrency)
    }
  }, [])

  const handleCurrencyChange = (currency: SupportedCurrency) => {
    setDisplayCurrency(currency)
    localStorage.setItem("displayCurrency", currency)
  }

  const handleAddAsset = async (data: Partial<Asset>) => {
    try {
      await api.assets.create({
        name: data.name!,
        type: data.type as Asset["type"],
        symbol: data.symbol,
        quantity: data.quantity,
        manualPrice: data.manualPrice,
        currency: data.currency,
        entityId: selectedEntityId,
      })
      setAssetFormOpen(false)
      await fetchDataOnly()
      requestSnapshot()

      if (data.symbol && (data.type === "stock" || data.type === "crypto")) {
        const priceResult = await fetchSinglePrice(data.symbol, data.type as "stock" | "crypto")
        if (priceResult.price > 0) {
          setPrices((prev) => ({
            ...prev,
            [priceResult.symbol.toLowerCase()]: priceResult,
            [priceResult.symbol.toUpperCase()]: priceResult,
          }))
        }
      }
    } catch (error) {
      showErrorToast(error, "Failed to create asset")
    }
  }

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset)
    setAssetFormOpen(true)
  }

  const handleUpdateAsset = async (data: Partial<Asset>) => {
    if (!editingAsset) return
    try {
      await api.assets.update(editingAsset.id, {
        name: data.name,
        type: data.type as Asset["type"],
        symbol: data.symbol,
        quantity: data.quantity,
        manualPrice: data.manualPrice,
        currency: data.currency,
      })
      setAssetFormOpen(false)
      setEditingAsset(null)
      await fetchDataOnly()
      requestSnapshot()

      if (data.symbol && (data.type === "stock" || data.type === "crypto")) {
        const priceResult = await fetchSinglePrice(data.symbol, data.type as "stock" | "crypto")
        if (priceResult.price > 0) {
          setPrices((prev) => ({
            ...prev,
            [priceResult.symbol.toLowerCase()]: priceResult,
            [priceResult.symbol.toUpperCase()]: priceResult,
          }))
        }
      }
    } catch (error) {
      showErrorToast(error, "Failed to update asset")
    }
  }

  const handleDeleteAsset = async (id: string) => {
    try {
      await api.assets.delete(id)
      await fetchDataOnly()
      requestSnapshot()
    } catch (error) {
      showErrorToast(error, "Failed to delete asset")
    }
  }

  const handleQuantityChange = async (id: string, newQuantity: number) => {
    try {
      await api.assets.update(id, { quantity: newQuantity })
      setAssets((prev) =>
        prev.map((asset) => (asset.id === id ? { ...asset, quantity: newQuantity } : asset)),
      )
      requestSnapshot()
    } catch (error) {
      showErrorToast(error, "Failed to update quantity")
    }
  }

  const handleAssetFormClose = (open: boolean) => {
    setAssetFormOpen(open)
    if (!open) {
      setEditingAsset(null)
    }
  }

  const handleAddAccount = async (data: Partial<Account>) => {
    try {
      await api.accounts.create({
        name: data.name!,
        balance: data.balance,
        currency: data.currency,
        countryCode: data.countryCode!,
        entityId: selectedEntityId,
      })
      setAccountFormOpen(false)
      await fetchDataOnly()
      requestSnapshot()
    } catch (error) {
      showErrorToast(error, "Failed to create vault")
    }
  }

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    setAccountFormOpen(true)
  }

  const handleUpdateAccount = async (data: Partial<Account>) => {
    if (!editingAccount) return
    try {
      await api.accounts.update(editingAccount.id, {
        name: data.name,
        balance: data.balance,
        currency: data.currency,
        countryCode: data.countryCode,
      })
      setAccountFormOpen(false)
      setEditingAccount(null)
      await fetchDataOnly()
      requestSnapshot()
    } catch (error) {
      showErrorToast(error, "Failed to update vault")
    }
  }

  const handleAccountFormClose = (open: boolean) => {
    setAccountFormOpen(open)
    if (!open) {
      setEditingAccount(null)
    }
  }

  const handleDeleteAccountRequest = (account: Account) => {
    setAccountToDelete(account)
    setDeleteAccountDialogOpen(true)
  }

  const handleConfirmDeleteAccount = async () => {
    if (!accountToDelete) return
    try {
      await api.accounts.delete(accountToDelete.id)
      setDeleteAccountDialogOpen(false)
      setAccountToDelete(null)
      await fetchDataOnly()
      requestSnapshot()
      const updated = await api.cashFlows.getAll()
      setCashFlows(updated)
    } catch (error) {
      showErrorToast(error, "Failed to delete vault")
    }
  }

  const handleAddCompany = async (data: { name: string }) => {
    try {
      await api.entities.create({ name: data.name, type: "company" })
      setEntityFormOpen(false)
      await fetchDataOnly()
    } catch (error) {
      showErrorToast(error, "Failed to create entity")
    }
  }

  const handleEditEntity = (entity: Entity) => {
    setEditingEntity(entity)
    setEntityFormOpen(true)
  }

  const handleUpdateEntity = async (data: { name: string }) => {
    if (!editingEntity) return
    try {
      await api.entities.update(editingEntity.id, { name: data.name })
      setEntityFormOpen(false)
      setEditingEntity(null)
      await fetchDataOnly()
    } catch (error) {
      showErrorToast(error, "Failed to update entity")
    }
  }

  const handleEntityFormClose = (open: boolean) => {
    setEntityFormOpen(open)
    if (!open) {
      setEditingEntity(null)
    }
  }

  const handleDeleteEntityRequest = (entity: Entity) => {
    setEntityToDelete(entity)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDeleteEntity = async () => {
    if (!entityToDelete) return

    try {
      const entityAssets = assets.filter((a) => a.entityId === entityToDelete.id)
      const entityAccounts = accounts.filter((a) => a.entityId === entityToDelete.id)

      for (const asset of entityAssets) {
        await api.assets.delete(asset.id)
      }

      for (const account of entityAccounts) {
        await api.accounts.delete(account.id)
      }

      await api.entities.delete(entityToDelete.id)

      if (selectedEntityId === entityToDelete.id) {
        setSelectedEntityId(0)
      }

      setDeleteDialogOpen(false)
      setEntityToDelete(null)
      await fetchDataOnly()
      requestSnapshot()
    } catch (error) {
      showErrorToast(error, "Failed to delete entity")
    }
  }

  const handleAddCashFlow = async (
    data: CreateCashFlowInput | UpdateCashFlowInput,
    isEdit: boolean,
  ) => {
    try {
      if (isEdit && editingCashFlow) {
        await api.cashFlows.update(editingCashFlow.id, data as UpdateCashFlowInput)
      } else {
        await api.cashFlows.create(data as CreateCashFlowInput)
      }
      setCashFlowFormOpen(false)
      setEditingCashFlow(null)
      const updated = await api.cashFlows.getAll()
      setCashFlows(updated)
    } catch (error) {
      showErrorToast(error, "Failed to save cash flow")
    }
  }

  const handleEditCashFlow = (id: string) => {
    const flow = cashFlows.find((f) => f.id === id)
    if (flow) {
      setEditingCashFlow(flow)
      setCashFlowAccountId(flow.accountId)
      setCashFlowFormOpen(true)
    }
  }

  const handleDeleteCashFlow = async (id: string) => {
    try {
      await api.cashFlows.delete(id)
      const updated = await api.cashFlows.getAll()
      setCashFlows(updated)
    } catch (error) {
      showErrorToast(error, "Failed to delete cash flow")
    }
  }

  const handleToggleCashFlow = async (id: string) => {
    const flow = cashFlows.find((f) => f.id === id)
    if (!flow) return
    try {
      await api.cashFlows.update(id, { isActive: !flow.isActive })
      const updated = await api.cashFlows.getAll()
      setCashFlows(updated)
    } catch (error) {
      showErrorToast(error, "Failed to toggle cash flow")
    }
  }

  const handleCashFlowFormClose = (open: boolean) => {
    setCashFlowFormOpen(open)
    if (!open) {
      setEditingCashFlow(null)
    }
  }

  const handleResetAccount = async () => {
    try {
      await api.settings.resetAllData()
      setPrices({})
      setIsPinEnabled(false)
      setIsLocked(false)
      setSelectedEntityId(0)
      setResetDialogOpen(false)
      setSettingsOpen(false)
      localStorage.removeItem("fortuna_onboarding_completed")
      setShowOnboarding(true)
      await fetchDataOnly()
    } catch (error) {
      showErrorToast(error, "Failed to reset data")
    }
  }

  const fetchDataOnly = useCallback(async () => {
    try {
      await api.entities.ensureIndividual()

      const [assetsData, snapshotsData, accountsData, entitiesData, cashFlowsData] =
        await Promise.all([
          api.assets.getAll(),
          api.snapshots.getAll(),
          api.accounts.getAll(),
          api.entities.getAll(),
          api.cashFlows.getAll(),
        ])

      setAssets(assetsData)
      setSnapshots(snapshotsData)
      setAccounts(accountsData)
      setEntities(entitiesData)
      setCashFlows(cashFlowsData)

      return { assetsData, accountsData }
    } catch (error) {
      showErrorToast(error, "Failed to load data")
      return { assetsData: [] as Asset[], accountsData: [] as Account[] }
    }
  }, [])

  const refreshPrices = useCallback(async (assetsData: Asset[]) => {
    try {
      const ratesData = await getExchangeRates()
      setExchangeRates(
        ratesData.rates || {
          USD: 1,
          EUR: 0.92,
          GBP: 0.79,
          JPY: 149.5,
          CHF: 0.88,
          HKD: 7.82,
          SGD: 1.34,
          AED: 3.67,
          BTC: 0.000024,
        },
      )

      const tradeableAssets = assetsData.filter(
        (a: Asset) => (a.type === "stock" || a.type === "crypto") && a.symbol,
      )

      if (tradeableAssets.length > 0) {
        const symbolsWithTypes = tradeableAssets.map((a: Asset) => ({
          symbol: a.symbol!,
          type: a.type as "stock" | "crypto",
        }))

        const pricesArray = await getMultiplePrices(symbolsWithTypes)

        const pricesMap: { [symbol: string]: PriceResult } = {}

        for (const p of pricesArray) {
          pricesMap[p.symbol.toLowerCase()] = p
          pricesMap[p.symbol.toUpperCase()] = p
        }

        setPrices((prev) => ({ ...prev, ...pricesMap }))
      }
    } catch (error) {
      showErrorToast(error, "Failed to refresh prices")
    }
  }, [])

  const handleManualRefresh = useCallback(async () => {
    if (refreshCooldown) {
      return
    }

    setIsRefreshing(true)
    setRefreshCooldown(true)

    setTimeout(() => {
      setRefreshCooldown(false)
    }, REFRESH_COOLDOWN)

    try {
      const tradeableAssets = assets.filter(
        (a: Asset) => (a.type === "stock" || a.type === "crypto") && a.symbol,
      )

      const [ratesData] = await Promise.all([
        forceRefreshExchangeRates(),
        tradeableAssets.length > 0
          ? forceRefreshPrices(
              tradeableAssets.map((a: Asset) => ({
                symbol: a.symbol!,
                type: a.type as "stock" | "crypto",
              })),
            ).then((pricesArray) => {
              const pricesMap: { [symbol: string]: PriceResult } = {}
              for (const p of pricesArray) {
                pricesMap[p.symbol.toLowerCase()] = p
                pricesMap[p.symbol.toUpperCase()] = p
              }
              setPrices((prev) => ({ ...prev, ...pricesMap }))
            })
          : Promise.resolve(),
      ])

      setExchangeRates(
        ratesData.rates || {
          USD: 1,
          EUR: 0.92,
          GBP: 0.79,
          JPY: 149.5,
          CHF: 0.88,
          HKD: 7.82,
          SGD: 1.34,
          AED: 3.67,
          BTC: 0.000024,
        },
      )
      requestSnapshot()
    } catch (error) {
      showErrorToast(error, "Failed to refresh prices")
    } finally {
      setIsRefreshing(false)
    }
  }, [assets, refreshCooldown])

  useEffect(() => {
    const initializeApp = async () => {
      const { assetsData, accountsData } = await fetchDataOnly()
      await refreshPrices(assetsData)

      try {
        const pinEnabled = await api.settings.isPinEnabled()
        setIsPinEnabled(pinEnabled)
        if (pinEnabled) {
          setIsLocked(true)
        }
      } catch {
        // PIN check failed, continue without lock
      }

      const onboardingCompleted = localStorage.getItem("fortuna_onboarding_completed")
      if (!onboardingCompleted && assetsData.length === 0 && accountsData.length === 0) {
        setShowOnboarding(true)
      }

      setLoading(false)
    }
    initializeApp()
  }, [fetchDataOnly, refreshPrices])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "l" && isPinEnabled && !isLocked) {
        e.preventDefault()
        setIsLocked(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPinEnabled, isLocked])

  const calculateNetWorthUsd = () => {
    let totalInUsd = 0

    for (const asset of assets) {
      let value = 0
      let currency = asset.currency

      if (asset.manualPrice !== null) {
        value = asset.manualPrice * asset.quantity
      } else if (asset.symbol) {
        const priceKey = asset.symbol.toLowerCase()
        const priceData = prices[priceKey] || prices[asset.symbol.toUpperCase()]
        if (priceData && priceData.price > 0) {
          value = priceData.price * asset.quantity
          currency = priceData.currency
        }
      }

      if (currency !== "USD" && exchangeRates[currency]) {
        value = value / exchangeRates[currency]
      }

      totalInUsd += value
    }

    for (const account of accounts) {
      let value = account.balance
      if (account.currency !== "USD" && exchangeRates[account.currency]) {
        value = value / exchangeRates[account.currency]
      }
      totalInUsd += value
    }

    return totalInUsd
  }

  const netWorthUsd = calculateNetWorthUsd()
  const netWorth =
    displayCurrency !== "USD" && exchangeRates[displayCurrency]
      ? netWorthUsd * exchangeRates[displayCurrency]
      : netWorthUsd

  const refreshSnapshots = useCallback(async () => {
    try {
      const updated = await api.snapshots.getAll()
      setSnapshots(updated)
    } catch {
      // Snapshot refresh is best-effort
    }
  }, [])

  const { requestSnapshot, recordSnapshotNow } = useSnapshotRecorder({
    netWorth: netWorthUsd,
    currency: "USD",
    enabled: !loading,
    onSnapshotsUpdated: refreshSnapshots,
  })

  const ASSET_CATEGORIES = [
    {
      key: "stock",
      label: "Stocks",
      icon: <Icon icon="solar:chart-linear" width={12} height={12} />,
    },
    {
      key: "crypto",
      label: "Crypto",
      icon: <Icon icon="solar:bitcoin-linear" width={12} height={12} />,
    },
    {
      key: "real_estate",
      label: "Real Estate",
      icon: <Icon icon="solar:home-linear" width={12} height={12} />,
    },
    {
      key: "other",
      label: "Other",
      icon: <Icon icon="solar:box-linear" width={12} height={12} />,
    },
  ]

  const filteredAssets = assets.filter((asset) => asset.entityId === selectedEntityId)
  const filteredAccounts = accounts.filter((account) => account.entityId === selectedEntityId)

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

  const getCategoryTotal = (categoryKey: string): number => {
    return assetsByType[categoryKey].reduce((sum, asset) => sum + getAssetValue(asset), 0)
  }

  const getAssetValue = (asset: Asset): number => {
    let value = 0
    let currency = asset.currency

    if (asset.manualPrice !== null) {
      value = asset.manualPrice * asset.quantity
    } else if (asset.symbol) {
      const priceData = prices[asset.symbol.toLowerCase()] || prices[asset.symbol.toUpperCase()]
      if (priceData && priceData.price > 0) {
        value = priceData.price * asset.quantity
        currency = priceData.currency
      }
    }

    if (currency !== "USD" && exchangeRates[currency]) {
      value = value / exchangeRates[currency]
    }

    if (displayCurrency !== "USD" && exchangeRates[displayCurrency]) {
      return value * exchangeRates[displayCurrency]
    }

    return value
  }

  const getAccountValue = (account: Account): number => {
    let value = account.balance
    if (account.currency !== "USD" && exchangeRates[account.currency]) {
      value = value / exchangeRates[account.currency]
    }
    if (displayCurrency !== "USD" && exchangeRates[displayCurrency]) {
      return value * exchangeRates[displayCurrency]
    }
    return value
  }

  const entityTotals = entities.reduce<Record<number, number>>((acc, entity) => {
    const entityAssets = assets.filter((a) => a.entityId === entity.id)
    const entityAccounts = accounts.filter((a) => a.entityId === entity.id)

    const assetsTotal = entityAssets.reduce((sum, asset) => sum + getAssetValue(asset), 0)
    const accountsTotal = entityAccounts.reduce((sum, account) => sum + getAccountValue(account), 0)

    acc[entity.id] = assetsTotal + accountsTotal
    return acc
  }, {})

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
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 bg-vignette pointer-events-none" />
      <header className="border-b border-border px-6 py-4 relative">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-accent">Fortuna</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1.5 text-muted-foreground hover:text-foreground disabled:opacity-100"
              onClick={handleManualRefresh}
              disabled={isRefreshing || refreshCooldown}
              title="Refresh prices"
            >
              {refreshCooldown && !isRefreshing ? (
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs text-emerald-500">Updated</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Icon
                    icon="solar:refresh-linear"
                    width={16}
                    height={16}
                    className={isRefreshing ? "animate-spin" : ""}
                  />
                  <span className="text-xs">Update</span>
                </span>
              )}
            </Button>
            <CurrencySelector value={displayCurrency} onChange={handleCurrencyChange} />
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setSettingsOpen(true)}
              title="Settings"
            >
              <Icon icon="solar:settings-linear" width={16} height={16} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 relative">
        <Card className="gradient-border bg-primary mb-8 hover:shadow-glow-gold/30">
          <CardContent className="p-6 lg:grid lg:grid-cols-2 gap-8">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">Power Level</p>
              <p className="text-4xl font-bold text-accent font-serif animate-pulse-slow">
                {formatCurrency(netWorth, displayCurrency)}
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                {assets.length} asset{assets.length !== 1 ? "s" : ""} in inventory
              </p>
            </div>
            <div>
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
          selectedEntityId={selectedEntityId}
          onSelect={setSelectedEntityId}
          onAddCompany={() => setEntityFormOpen(true)}
          onEditEntity={handleEditEntity}
          onDeleteEntity={handleDeleteEntityRequest}
          entityTotals={entityTotals}
          displayCurrency={displayCurrency}
        />

        <div className="space-y-6 mb-8">
          <div className="rounded-xl bg-slate-800/40 border border-slate-800/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">My Assets</h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-accent hover:text-accent/80 hover:bg-accent/10"
                onClick={() => setAssetFormOpen(true)}
              >
                <span className="text-xl leading-none">+</span>
              </Button>
            </div>
            {filteredAssets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No assets yet. Click + to add one.</p>
                </CardContent>
              </Card>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full h-auto p-1 bg-slate-800/40 border border-slate-800/50 rounded-lg grid grid-cols-4 gap-1 mb-4">
                  {ASSET_CATEGORIES.map((category) => {
                    const categoryAssets = assetsByType[category.key]
                    const hasAssets = categoryAssets.length > 0
                    const categoryTotal = getCategoryTotal(category.key)
                    const isActive = activeTab === category.key

                    return (
                      <TabsTrigger
                        key={category.key}
                        value={category.key}
                        disabled={!hasAssets}
                        className="relative flex flex-col items-center gap-0.5 py-2 px-1.5 rounded-md border border-transparent transition-all duration-200 ease-out hover:bg-slate-700/30 hover:border-slate-600/50 data-[state=active]:hover:bg-transparent data-[state=active]:hover:border-transparent data-[state=active]:text-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-transparent"
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTabBackground"
                            className="absolute inset-0 bg-slate-700/30 rounded-md border border-slate-600/50"
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                          />
                        )}
                        <div className="relative flex items-center gap-1.5">
                          <span className="text-current">{category.icon}</span>
                          <span className="font-medium text-xs">
                            {category.label}
                            {hasAssets && (
                              <span className="ml-1 text-muted-foreground">
                                ({categoryAssets.length})
                              </span>
                            )}
                          </span>
                        </div>
                        {hasAssets && (
                          <span className="relative text-[10px] text-muted-foreground data-[state=active]:text-accent/80">
                            {formatCurrency(categoryTotal, displayCurrency)}
                          </span>
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
                            No {category.label.toLowerCase()} assets yet.
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
                                onEdit={handleEditAsset}
                                onDelete={handleDeleteAsset}
                                onQuantityChange={handleQuantityChange}
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

          <div className="rounded-xl bg-slate-800/40 border border-slate-800/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Vaults</h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-accent hover:text-accent/80 hover:bg-accent/10"
                onClick={() => setAccountFormOpen(true)}
              >
                <span className="text-xl leading-none">+</span>
              </Button>
            </div>
            {filteredAccounts.length === 0 ? (
              <Card>
                <CardContent className="p-4">
                  <p className="text-muted-foreground text-center py-4">
                    No vaults yet. Click + to add one.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-3">
                {filteredAccounts.map((account) => {
                  const accountFlows = cashFlows.filter((f) => f.accountId === account.id)
                  const flowKey = accountFlows
                    .map((f) => `${f.id}:${f.amount}:${f.frequency}:${f.isActive}:${f.flowType}`)
                    .join(",")
                  const hasActiveFlows = accountFlows.some((f) => f.isActive)

                  const convertToDisplay = (amount: number): number => {
                    let value = amount
                    if (account.currency !== "USD" && exchangeRates[account.currency]) {
                      value = value / exchangeRates[account.currency]
                    }
                    if (displayCurrency !== "USD" && exchangeRates[displayCurrency]) {
                      return value * exchangeRates[displayCurrency]
                    }
                    return value
                  }

                  const monthlyTotals = calculateMonthlyTotals(accountFlows)
                  const monthlyNetDisplay = convertToDisplay(monthlyTotals.net)

                  const currentBalanceDisplay = getAccountValue(account)
                  const projection1M = calculateProjection(account.balance, accountFlows, 1)
                  const projectedBalance =
                    projection1M.length > 0
                      ? projection1M[projection1M.length - 1].balance
                      : account.balance
                  const projectedBalanceDisplay = convertToDisplay(projectedBalance)
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

                  const projColorClass =
                    projectedChange > 0
                      ? "text-emerald-400"
                      : projectedChange < 0
                        ? "text-red-400"
                        : "text-muted-foreground"

                  return (
                    <AccordionItem
                      key={account.id}
                      value={account.id}
                      className="border border-slate-800/50 rounded-lg bg-slate-900/20 overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-800/40">
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
                                  handleEditAccount(account)
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
                                  handleDeleteAccountRequest(account)
                                }}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                              >
                                <Icon icon="solar:trash-bin-trash-linear" width={12} height={12} />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {hasActiveFlows && (
                              <span className={`text-xs font-medium ${netColorClass}`}>
                                {monthlyTotals.net >= 0 ? "+" : ""}
                                {formatCurrency(monthlyNetDisplay, displayCurrency)}
                                <span className="text-muted-foreground">/mo</span>
                              </span>
                            )}
                            <span className="text-sm font-bold text-accent">
                              {formatCurrency(currentBalanceDisplay, displayCurrency)}
                            </span>
                            {hasActiveFlows && (
                              <span
                                className={`text-xs font-medium flex items-center gap-0.5 ${projColorClass}`}
                              >
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
                          </div>
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
                            onEdit={handleEditCashFlow}
                            onDelete={handleDeleteCashFlow}
                            onToggle={handleToggleCashFlow}
                            onAddFlow={() => {
                              setCashFlowAccountId(account.id)
                              setEditingCashFlow(null)
                              setCashFlowFormOpen(true)
                            }}
                          />
                          <VaultProjectionChart
                            currentBalance={getAccountValue(account)}
                            cashFlows={accountFlows}
                            displayCurrency={displayCurrency}
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
          asset={editingAsset}
          open={assetFormOpen}
          onOpenChange={handleAssetFormClose}
          onSubmit={editingAsset ? handleUpdateAsset : handleAddAsset}
        />

        <AccountForm
          account={editingAccount}
          open={accountFormOpen}
          onOpenChange={handleAccountFormClose}
          onSubmit={editingAccount ? handleUpdateAccount : handleAddAccount}
        />

        <CashFlowForm
          cashFlow={editingCashFlow}
          accountId={cashFlowAccountId}
          open={cashFlowFormOpen}
          onOpenChange={handleCashFlowFormClose}
          onSubmit={handleAddCashFlow}
        />

        <EntityForm
          entity={editingEntity}
          open={entityFormOpen}
          onOpenChange={handleEntityFormClose}
          onSubmit={editingEntity ? handleUpdateEntity : handleAddCompany}
        />

        <DeleteEntityDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          entity={entityToDelete}
          associatedAssetCount={
            entityToDelete ? assets.filter((a) => a.entityId === entityToDelete.id).length : 0
          }
          associatedAccountCount={
            entityToDelete ? accounts.filter((a) => a.entityId === entityToDelete.id).length : 0
          }
          onConfirm={handleConfirmDeleteEntity}
        />

        <DeleteAccountDialog
          open={deleteAccountDialogOpen}
          onOpenChange={setDeleteAccountDialogOpen}
          account={accountToDelete}
          associatedCashFlowCount={
            accountToDelete ? cashFlows.filter((f) => f.accountId === accountToDelete.id).length : 0
          }
          onConfirm={handleConfirmDeleteAccount}
        />

        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          isPinEnabled={isPinEnabled}
          onPinStatusChange={setIsPinEnabled}
          onLock={() => setIsLocked(true)}
          onResetAccount={() => setResetDialogOpen(true)}
        />

        <ResetAccountDialog
          open={resetDialogOpen}
          onOpenChange={setResetDialogOpen}
          onConfirm={handleResetAccount}
        />
      </main>

      <LockScreen isLocked={isLocked} onUnlock={() => setIsLocked(false)} />
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
