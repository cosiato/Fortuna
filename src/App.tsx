import { useEffect, useState, useCallback } from "react"
import { Icon } from "@iconify/react"
import CurrencySelector from "@/components/CurrencySelector"
import NetWorthChart from "@/components/NetWorthChart"
import AssetForm from "@/components/AssetForm"
import AccountForm from "@/components/AccountForm"
import AccountCard from "@/components/AccountCard"
import type { Asset, Snapshot, Account, Entity } from "@/types/database"
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
import LockScreen from "@/components/LockScreen"
import SettingsDialog from "@/components/SettingsDialog"
import { motion } from "framer-motion"

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
  const [entityFormOpen, setEntityFormOpen] = useState(false)
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshCooldown, setRefreshCooldown] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [isPinEnabled, setIsPinEnabled] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
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
      console.error("Error creating asset:", error)
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
      console.error("Error updating asset:", error)
    }
  }

  const handleDeleteAsset = async (id: string) => {
    try {
      await api.assets.delete(id)
      await fetchDataOnly()
    } catch (error) {
      console.error("Error deleting asset:", error)
    }
  }

  const handleQuantityChange = async (id: string, newQuantity: number) => {
    try {
      await api.assets.update(id, { quantity: newQuantity })
      setAssets((prev) =>
        prev.map((asset) => (asset.id === id ? { ...asset, quantity: newQuantity } : asset)),
      )
    } catch (error) {
      console.error("Error updating quantity:", error)
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
    } catch (error) {
      console.error("Error creating account:", error)
    }
  }

  const handleAddCompany = async (data: { name: string }) => {
    try {
      await api.entities.create({ name: data.name, type: "company" })
      setEntityFormOpen(false)
      await fetchDataOnly()
    } catch (error) {
      console.error("Error creating entity:", error)
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
      console.error("Error updating entity:", error)
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
    } catch (error) {
      console.error("Error deleting entity:", error)
    }
  }

  const fetchDataOnly = useCallback(async () => {
    try {
      await api.entities.ensureIndividual()

      const [assetsData, snapshotsData, accountsData, entitiesData] = await Promise.all([
        api.assets.getAll(),
        api.snapshots.getAll(),
        api.accounts.getAll(),
        api.entities.getAll(),
      ])

      setAssets(assetsData)
      setSnapshots(snapshotsData)
      setAccounts(accountsData)
      setEntities(entitiesData)

      return assetsData
    } catch (error) {
      console.error("Error fetching data:", error)
      return []
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
      console.error("Error refreshing prices:", error)
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
    } catch (error) {
      console.error("Error during manual refresh:", error)
    } finally {
      setIsRefreshing(false)
    }
  }, [assets, refreshCooldown])

  useEffect(() => {
    const initializeApp = async () => {
      const assetsData = await fetchDataOnly()
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

  const calculateNetWorth = () => {
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

    if (displayCurrency !== "USD" && exchangeRates[displayCurrency]) {
      return totalInUsd * exchangeRates[displayCurrency]
    }

    return totalInUsd
  }

  const netWorth = calculateNetWorth()

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
      } else if (asset.type === "crypto" || asset.type === "stock") {
        console.error(
          `[DEBUG] No price found for ${asset.symbol}. Available keys:`,
          Object.keys(prices),
        )
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
    if (!loading && assets.length > 0) {
      const recordSnapshot = async () => {
        try {
          await api.snapshots.create({
            totalValue: netWorth,
            currency: "USD",
          })
        } catch (error) {
          console.error("Error recording snapshot:", error)
        }
      }
      recordSnapshot()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, assets.length])

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
                <TabsList className="w-full h-auto p-1 bg-card/50 border border-border/50 rounded-lg grid grid-cols-4 gap-1 mb-4">
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
                        className="relative flex flex-col items-center gap-0.5 py-2 px-1.5 rounded-md transition-colors duration-200 ease-out hover:bg-slate-700/20 data-[state=active]:hover:bg-transparent data-[state=active]:text-accent disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTabBackground"
                            className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/5 rounded-md shadow-sm"
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

          <div className="rounded-xl bg-amber-950/20 border border-amber-900/30 p-5">
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
            <div className="space-y-3">
              {filteredAccounts.length === 0 ? (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No vaults yet. Click + to add one.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    displayCurrency={displayCurrency}
                    exchangeRates={exchangeRates}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <AssetForm
          asset={editingAsset}
          open={assetFormOpen}
          onOpenChange={handleAssetFormClose}
          onSubmit={editingAsset ? handleUpdateAsset : handleAddAsset}
        />

        <AccountForm
          open={accountFormOpen}
          onOpenChange={setAccountFormOpen}
          onSubmit={handleAddAccount}
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

        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          isPinEnabled={isPinEnabled}
          onPinStatusChange={setIsPinEnabled}
          onLock={() => setIsLocked(true)}
        />
      </main>

      <LockScreen isLocked={isLocked} onUnlock={() => setIsLocked(false)} />
    </div>
  )
}
