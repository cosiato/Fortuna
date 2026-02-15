import { useEffect, useState, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import i18n from "@/lib/i18n"
import type { Asset, Snapshot, Account, Entity, CashFlow } from "@/types/database"
import { api } from "@/lib/api"
import { PriceResult, getMultiplePrices, forceRefreshPrices } from "@/lib/prices"
import {
  SUPPORTED_CURRENCIES,
  SupportedCurrency,
  FALLBACK_RATES,
  getExchangeRates,
  forceRefreshExchangeRates,
} from "@/lib/currency"
import { showErrorToast } from "@/lib/errorHandling"

const REFRESH_COOLDOWN = 2 * 60 * 1000 // 2 minutes

export interface AppDataState {
  assets: Asset[]
  accounts: Account[]
  snapshots: Snapshot[]
  entities: Entity[]
  cashFlows: CashFlow[]
  prices: Record<string, PriceResult>
  exchangeRates: Record<string, number>
  loading: boolean
  isRefreshing: boolean
  refreshCooldown: boolean
}

export interface AppInitMetadata {
  displayCurrency: SupportedCurrency
  isPinEnabled: boolean
  shouldLock: boolean
  showOnboarding: boolean
}

export interface AppDataActions {
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>
  setSnapshots: React.Dispatch<React.SetStateAction<Snapshot[]>>
  setCashFlows: React.Dispatch<React.SetStateAction<CashFlow[]>>
  setPrices: React.Dispatch<React.SetStateAction<Record<string, PriceResult>>>
  setExchangeRates: React.Dispatch<React.SetStateAction<Record<string, number>>>
  fetchDataOnly: () => Promise<{ assetsData: Asset[]; accountsData: Account[] }>
  handleManualRefresh: () => Promise<void>
  refreshSnapshots: () => Promise<void>
}

export function useAppData(): {
  state: AppDataState
  actions: AppDataActions
  initMetadata: AppInitMetadata | null
} {
  const [assets, setAssets] = useState<Asset[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([])
  const [prices, setPrices] = useState<Record<string, PriceResult>>({})
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(FALLBACK_RATES)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshCooldown, setRefreshCooldown] = useState(false)
  const [initMetadata, setInitMetadata] = useState<AppInitMetadata | null>(null)

  const { t } = useTranslation(["errors"])
  const tRef = useRef(t)
  tRef.current = t

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
      showErrorToast(error, tRef.current("errors:failedToLoadData"))
      return { assetsData: [] as Asset[], accountsData: [] as Account[] }
    }
  }, [])

  const refreshPrices = useCallback(async (assetsData: Asset[]) => {
    try {
      const ratesData = await getExchangeRates()
      setExchangeRates(ratesData.rates || FALLBACK_RATES)

      const tradeableAssets = assetsData.filter(
        (a: Asset) => (a.type === "stock" || a.type === "crypto") && a.symbol,
      )

      if (tradeableAssets.length > 0) {
        const symbolsWithTypes = tradeableAssets.map((a: Asset) => ({
          symbol: a.symbol!,
          type: a.type as "stock" | "crypto",
        }))

        const pricesArray = await getMultiplePrices(symbolsWithTypes)

        const pricesMap: Record<string, PriceResult> = {}

        for (const p of pricesArray) {
          pricesMap[p.symbol.toLowerCase()] = p
          pricesMap[p.symbol.toUpperCase()] = p
        }

        setPrices((prev) => ({ ...prev, ...pricesMap }))
      }
    } catch (error) {
      showErrorToast(error, tRef.current("errors:failedToRefreshPrices"))
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
              const pricesMap: Record<string, PriceResult> = {}
              for (const p of pricesArray) {
                pricesMap[p.symbol.toLowerCase()] = p
                pricesMap[p.symbol.toUpperCase()] = p
              }
              setPrices((prev) => ({ ...prev, ...pricesMap }))
            })
          : Promise.resolve(),
      ])

      setExchangeRates(ratesData.rates || FALLBACK_RATES)
    } catch (error) {
      showErrorToast(error, tRef.current("errors:failedToRefreshPrices"))
    } finally {
      setIsRefreshing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, refreshCooldown])

  const refreshSnapshots = useCallback(async () => {
    try {
      const updated = await api.snapshots.getAll()
      setSnapshots(updated)
    } catch {
      // Snapshot refresh is best-effort
    }
  }, [])

  useEffect(() => {
    const initializeApp = async () => {
      const { assetsData, accountsData } = await fetchDataOnly()
      await refreshPrices(assetsData)

      let displayCurrency: SupportedCurrency = "USD"
      try {
        const savedCurrency = await api.settings.getCurrencyPreference()
        if (SUPPORTED_CURRENCIES.includes(savedCurrency as SupportedCurrency)) {
          displayCurrency = savedCurrency as SupportedCurrency
        }
      } catch {
        // Currency preference load failed, keep default USD
      }

      try {
        const savedLocale = await api.settings.getLocalePreference()
        if (savedLocale && savedLocale !== i18n.language) {
          await i18n.changeLanguage(savedLocale)
        }
      } catch {
        // Locale preference load failed, keep default 'en'
      }

      let isPinEnabled = false
      let shouldLock = false
      try {
        isPinEnabled = await api.settings.isPinEnabled()
        shouldLock = isPinEnabled
      } catch {
        // PIN check failed, continue without lock
      }

      const onboardingCompleted = localStorage.getItem("fortuna_onboarding_completed")
      const showOnboarding =
        !onboardingCompleted && assetsData.length === 0 && accountsData.length === 0

      setInitMetadata({ displayCurrency, isPinEnabled, shouldLock, showOnboarding })
      setLoading(false)
    }
    initializeApp()
  }, [fetchDataOnly, refreshPrices])

  return {
    state: {
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
    },
    actions: {
      setAssets,
      setAccounts,
      setSnapshots,
      setCashFlows,
      setPrices,
      setExchangeRates,
      fetchDataOnly,
      handleManualRefresh,
      refreshSnapshots,
    },
    initMetadata,
  }
}
