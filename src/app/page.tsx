"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import CurrencySelector from "@/components/CurrencySelector"
import NetWorthChart from "@/components/NetWorthChart"
import AssetForm from "@/components/AssetForm"
import AccountForm from "@/components/AccountForm"
import AccountCard from "@/components/AccountCard"
import { Asset, Snapshot, Account } from "@/lib/db"
import { PriceResult } from "@/lib/prices"
import { SupportedCurrency, formatCurrency } from "@/lib/currency"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AssetTile, { CATEGORY_STYLES } from "@/components/AssetTile"
import { motion } from "framer-motion"

export default function Dashboard() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
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
  const [personalFormOpen, setPersonalFormOpen] = useState(false)
  const [businessFormOpen, setBusinessFormOpen] = useState(false)

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
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        setAssetFormOpen(false)
        fetchData()
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
      const response = await fetch(`/api/assets/${editingAsset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        setAssetFormOpen(false)
        setEditingAsset(null)
        fetchData()
      }
    } catch (error) {
      console.error("Error updating asset:", error)
    }
  }

  const handleDeleteAsset = async (id: string) => {
    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error deleting asset:", error)
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
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        setPersonalFormOpen(false)
        setBusinessFormOpen(false)
        fetchData()
      }
    } catch (error) {
      console.error("Error creating account:", error)
    }
  }

  const fetchData = useCallback(async () => {
    try {
      const [assetsRes, snapshotsRes, ratesRes, accountsRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/snapshots"),
        fetch("/api/exchange-rates"),
        fetch("/api/accounts"),
      ])

      const assetsData = await assetsRes.json()
      const snapshotsData = await snapshotsRes.json()
      const ratesData = await ratesRes.json()
      const accountsData = await accountsRes.json()

      setAssets(Array.isArray(assetsData) ? assetsData : [])
      setSnapshots(Array.isArray(snapshotsData) ? snapshotsData : [])
      setAccounts(Array.isArray(accountsData) ? accountsData : [])
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
        const stockSymbols = tradeableAssets
          .filter((a: Asset) => a.type === "stock")
          .map((a: Asset) => a.symbol)
        const cryptoSymbols = tradeableAssets
          .filter((a: Asset) => a.type === "crypto")
          .map((a: Asset) => a.symbol)

        const pricePromises: Promise<Response>[] = []

        if (stockSymbols.length > 0) {
          pricePromises.push(fetch(`/api/prices?symbols=${stockSymbols.join(",")}&type=stock`))
        }
        if (cryptoSymbols.length > 0) {
          pricePromises.push(fetch(`/api/prices?symbols=${cryptoSymbols.join(",")}&type=crypto`))
        }

        const priceResponses = await Promise.all(pricePromises)
        const pricesMap: { [symbol: string]: PriceResult } = {}

        for (const res of priceResponses) {
          const data = await res.json()
          if (data.prices) {
            for (const p of data.prices) {
              pricesMap[p.symbol.toLowerCase()] = p
              pricesMap[p.symbol.toUpperCase()] = p
            }
          }
        }

        setPrices(pricesMap)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          <path d="m13 13 6 6" />
        </svg>
      ),
    },
    {
      key: "crypto",
      label: "Crypto",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      ),
    },
    {
      key: "real_estate",
      label: "Real Estate",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      key: "other",
      label: "Other",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      ),
    },
  ]

  const assetsByType = ASSET_CATEGORIES.reduce<Record<string, Asset[]>>((acc, category) => {
    acc[category.key] = assets.filter((asset) => asset.type === category.key)
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

  useEffect(() => {
    if (!loading && assets.length > 0) {
      const recordSnapshot = async () => {
        try {
          await fetch("/api/snapshots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              totalValue: netWorth,
              currency: "USD",
            }),
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
            <CurrencySelector value={displayCurrency} onChange={handleCurrencyChange} />
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

        <div className="space-y-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Assets</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-accent hover:text-accent/80 hover:bg-accent/10"
                  onClick={() => setAssetFormOpen(true)}
                >
                  <span className="text-xl leading-none">+</span>
                </Button>
              </div>
              {assets.length === 0 ? (
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
                            <span className="font-medium text-xs">{category.label}</span>
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Vaults</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-accent hover:text-accent/80 hover:bg-accent/10"
                  onClick={() => setPersonalFormOpen(true)}
                >
                  <span className="text-xl leading-none">+</span>
                </Button>
              </div>
              <div className="space-y-3">
                {accounts.filter((a) => a.accountType === "personal").length === 0 ? (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-muted-foreground text-sm text-center py-4">
                        No vaults yet. Click + to add one.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  accounts
                    .filter((a) => a.accountType === "personal")
                    .map((account) => (
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
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Factories</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-purple-400 hover:text-purple-400/80 hover:bg-purple-400/10"
                  onClick={() => setBusinessFormOpen(true)}
                >
                  <span className="text-xl leading-none">+</span>
                </Button>
              </div>
              <div className="space-y-3">
                {accounts.filter((a) => a.accountType === "business").length === 0 ? (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-muted-foreground text-sm text-center py-4">
                        No factories yet. Click + to add one.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  accounts
                    .filter((a) => a.accountType === "business")
                    .map((account) => (
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
        </div>

        <AssetForm
          asset={editingAsset}
          open={assetFormOpen}
          onOpenChange={handleAssetFormClose}
          onSubmit={editingAsset ? handleUpdateAsset : handleAddAsset}
        />

        <AccountForm
          open={personalFormOpen}
          onOpenChange={setPersonalFormOpen}
          onSubmit={handleAddAccount}
          defaultType="personal"
        />

        <AccountForm
          open={businessFormOpen}
          onOpenChange={setBusinessFormOpen}
          onSubmit={handleAddAccount}
          defaultType="business"
        />
      </main>
    </div>
  )
}
