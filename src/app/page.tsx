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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function Dashboard() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [prices, setPrices] = useState<{ [symbol: string]: PriceResult }>({})
  const [exchangeRates, setExchangeRates] = useState<{ [currency: string]: number }>({
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.50,
    CHF: 0.88,
    HKD: 7.82,
    SGD: 1.34,
    AED: 3.67,
    BTC: 0.000024,
  })
  const [displayCurrency, setDisplayCurrency] = useState<SupportedCurrency>("USD")
  const [loading, setLoading] = useState(true)
  const [assetFormOpen, setAssetFormOpen] = useState(false)
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
      setExchangeRates(ratesData.rates || { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.50, CHF: 0.88, HKD: 7.82, SGD: 1.34, AED: 3.67, BTC: 0.000024 })

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

  const ASSET_TYPE_LABELS: Record<string, string> = {
    crypto: "Crypto",
    stock: "Stocks",
    real_estate: "Real Estate",
    other: "Other",
  }

  const assetsByType = assets.reduce<Record<string, Asset[]>>((acc, asset) => {
    const type = asset.type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(asset)
    return acc
  }, {})

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div>
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
            <Card>
              <CardContent className="p-4">
                {Object.keys(assetsByType).length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No assets yet. Click + to add one.
                  </p>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(assetsByType).map(([type, typeAssets]) => (
                      <AccordionItem key={type} value={type} className="border-border">
                        <AccordionTrigger className="hover:no-underline hover:text-accent">
                          <span className="flex items-center justify-between w-full pr-2">
                            <span className="flex items-center gap-2">
                              {ASSET_TYPE_LABELS[type] || type}
                              <span className="text-xs text-muted-foreground">
                                ({typeAssets.length})
                              </span>
                            </span>
                            <span className="text-sm font-medium text-accent">
                              {formatCurrency(
                                typeAssets.reduce((sum, asset) => sum + getAssetValue(asset), 0),
                                displayCurrency,
                              )}
                            </span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {typeAssets.map((asset) => (
                              <div
                                key={asset.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
                              >
                                <div>
                                  <p className="font-medium text-foreground">{asset.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {asset.quantity}{" "}
                                    {asset.symbol ? `(${asset.symbol.toUpperCase()})` : "units"}
                                  </p>
                                </div>
                                <p className="text-sm font-medium text-accent">
                                  {formatCurrency(getAssetValue(asset), displayCurrency)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>
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

        <AssetForm open={assetFormOpen} onOpenChange={setAssetFormOpen} onSubmit={handleAddAsset} />

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
