import { useEffect, useState, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import i18n from "@/lib/i18n"
import type { Asset, Snapshot, Account, Entity, CashFlow } from "@/types/database"
import { api } from "@/lib/api"
import type { PriceResult } from "@/lib/prices"
import { getMultiplePrices, forceRefreshPrices } from "@/lib/prices"
import {
  SUPPORTED_CURRENCIES,
  SupportedCurrency,
  FALLBACK_RATES,
  getExchangeRates,
  forceRefreshExchangeRates,
} from "@/lib/currency"
import { showErrorToast } from "@/lib/errorHandling"

const REFRESH_COOLDOWN = 2 * 60 * 1000 // 2 minutes

function getTradeableAssets(assets: readonly Asset[]): Asset[] {
  return assets.filter((a: Asset) => (a.type === "stock" || a.type === "crypto") && a.symbol)
}

function buildPriceMap(pricesArray: readonly PriceResult[]): Record<string, PriceResult> {
  return Object.fromEntries(
    pricesArray.flatMap((p) => [
      [p.symbol.toLowerCase(), p],
      [p.symbol.toUpperCase(), p],
    ]),
  )
}

export interface PreCheckResult {
  isPinEnabled: boolean
  displayCurrency: SupportedCurrency
}

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

export interface AppDataActions {
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>
  setCashFlows: React.Dispatch<React.SetStateAction<CashFlow[]>>
  setPrices: React.Dispatch<React.SetStateAction<Record<string, PriceResult>>>
  fetchDataOnly: () => Promise<{ assetsData: Asset[]; accountsData: Account[] }>
  handleManualRefresh: () => Promise<void>
  refreshSnapshots: () => Promise<void>
  startLoading: () => void
  resetForLock: () => void
}

export interface ShowOnboardingResult {
  showOnboarding: boolean
}

export function useAppData(): {
  state: AppDataState
  actions: AppDataActions
  preCheck: PreCheckResult | null
  onboardingResult: ShowOnboardingResult | null
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
  const [preCheck, setPreCheck] = useState<PreCheckResult | null>(null)
  const [onboardingResult, setOnboardingResult] = useState<ShowOnboardingResult | null>(null)
  const [loadingTriggered, setLoadingTriggered] = useState(false)
  const preCheckStartedRef = useRef(false)
  const loadingStartedRef = useRef(false)

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

      const tradeableAssets = getTradeableAssets(assetsData)

      if (tradeableAssets.length > 0) {
        const symbolsWithTypes = tradeableAssets.map((a: Asset) => ({
          symbol: a.symbol!,
          type: a.type as "stock" | "crypto",
        }))

        const pricesArray = await getMultiplePrices(symbolsWithTypes)
        setPrices((prev) => ({ ...prev, ...buildPriceMap(pricesArray) }))
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
      const tradeableAssets = getTradeableAssets(assets)

      const [ratesData] = await Promise.all([
        forceRefreshExchangeRates(),
        tradeableAssets.length > 0
          ? forceRefreshPrices(
              tradeableAssets.map((a: Asset) => ({
                symbol: a.symbol!,
                type: a.type as "stock" | "crypto",
              })),
            ).then((pricesArray) => {
              setPrices((prev) => ({ ...prev, ...buildPriceMap(pricesArray) }))
            })
          : Promise.resolve(),
      ])

      setExchangeRates(ratesData.rates || FALLBACK_RATES)
    } catch (error) {
      showErrorToast(error, tRef.current("errors:failedToRefreshPrices"))
    } finally {
      setIsRefreshing(false)
    }
  }, [assets, refreshCooldown])

  const refreshSnapshots = useCallback(async () => {
    try {
      const updated = await api.snapshots.getAll()
      setSnapshots(updated)
    } catch {
      // Snapshot refresh is best-effort
    }
  }, [])

  const startLoading = useCallback(() => {
    setLoadingTriggered(true)
  }, [])

  const resetForLock = useCallback(() => {
    setLoadingTriggered(false)
    setLoading(true)
    setOnboardingResult(null)
    loadingStartedRef.current = false
  }, [])

  // Phase 1: Fast pre-check (PIN status + locale + currency preference)
  useEffect(() => {
    if (preCheckStartedRef.current) return
    preCheckStartedRef.current = true

    const runPreCheck = async () => {
      try {
        const savedLocale = await api.settings.getLocalePreference()
        if (savedLocale && savedLocale !== i18n.language) {
          await i18n.changeLanguage(savedLocale)
        }
      } catch {
        // Locale preference load failed, keep default 'en'
      }

      let displayCurrency: SupportedCurrency = "USD"
      try {
        const savedCurrency = await api.settings.getCurrencyPreference()
        if (SUPPORTED_CURRENCIES.includes(savedCurrency as SupportedCurrency)) {
          displayCurrency = savedCurrency as SupportedCurrency
        }
      } catch {
        // Currency preference load failed, keep default USD
      }

      let isPinEnabled = false
      try {
        isPinEnabled = await api.settings.isPinEnabled()
      } catch {
        // PIN check failed, continue without lock
      }

      setPreCheck({ isPinEnabled, displayCurrency })
    }
    runPreCheck()
  }, [])

  // Phase 2: Full data loading (only runs after startLoading is called)
  useEffect(() => {
    if (!loadingTriggered) return
    if (loadingStartedRef.current) return
    loadingStartedRef.current = true

    const loadData = async () => {
      const { assetsData, accountsData } = await fetchDataOnly()
      await refreshPrices(assetsData)

      const onboardingCompleted = localStorage.getItem("fortuna_onboarding_completed")
      const showOnboarding =
        !onboardingCompleted && assetsData.length === 0 && accountsData.length === 0

      setOnboardingResult({ showOnboarding })
      setLoading(false)
    }
    loadData()
  }, [loadingTriggered, fetchDataOnly, refreshPrices])

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
      setCashFlows,
      setPrices,
      fetchDataOnly,
      handleManualRefresh,
      refreshSnapshots,
      startLoading,
      resetForLock,
    },
    preCheck,
    onboardingResult,
  }
}
