import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"

const {
  mockApi,
  mockGetMultiplePrices,
  mockGetExchangeRates,
  mockShowErrorToast,
} = vi.hoisted(() => ({
  mockApi: {
    entities: {
      ensureIndividual: vi.fn().mockResolvedValue({ id: 0, name: "Individual" }),
      getAll: vi.fn().mockResolvedValue([]),
    },
    assets: {
      getAll: vi.fn().mockResolvedValue([]),
    },
    accounts: {
      getAll: vi.fn().mockResolvedValue([]),
    },
    snapshots: {
      getAll: vi.fn().mockResolvedValue([]),
    },
    cashFlows: {
      getAll: vi.fn().mockResolvedValue([]),
    },
    settings: {
      getCurrencyPreference: vi.fn().mockResolvedValue("USD"),
      getLocalePreference: vi.fn().mockResolvedValue("en"),
      isPinEnabled: vi.fn().mockResolvedValue(false),
    },
  },
  mockGetMultiplePrices: vi.fn().mockResolvedValue([]),
  mockGetExchangeRates: vi.fn().mockResolvedValue({ rates: { USD: 1, EUR: 0.92 } }),
  mockShowErrorToast: vi.fn(),
}))

vi.mock("@/lib/api", () => ({
  api: mockApi,
}))

vi.mock("@/lib/prices", () => ({
  getMultiplePrices: (...args: unknown[]) => mockGetMultiplePrices(...args),
  forceRefreshPrices: vi.fn().mockResolvedValue([]),
}))

vi.mock("@/lib/currency", () => ({
  SUPPORTED_CURRENCIES: ["USD", "EUR", "GBP", "BTC"],
  FALLBACK_RATES: { USD: 1, EUR: 0.92, GBP: 0.79, BTC: 0.000016 },
  getExchangeRates: (...args: unknown[]) => mockGetExchangeRates(...args),
  forceRefreshExchangeRates: vi.fn().mockResolvedValue({ rates: { USD: 1, EUR: 0.92 } }),
}))

vi.mock("@/lib/errorHandling", () => ({
  showErrorToast: (...args: unknown[]) => mockShowErrorToast(...args),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock("@/lib/i18n", () => ({
  default: {
    language: "en",
    changeLanguage: vi.fn().mockResolvedValue(undefined),
  },
}))

import { useAppData } from "./useAppData"

describe("useAppData", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockApi.entities.ensureIndividual.mockResolvedValue({ id: 0, name: "Individual" })
    mockApi.entities.getAll.mockResolvedValue([])
    mockApi.assets.getAll.mockResolvedValue([])
    mockApi.accounts.getAll.mockResolvedValue([])
    mockApi.snapshots.getAll.mockResolvedValue([])
    mockApi.cashFlows.getAll.mockResolvedValue([])
    mockApi.settings.getCurrencyPreference.mockResolvedValue("USD")
    mockApi.settings.getLocalePreference.mockResolvedValue("en")
    mockApi.settings.isPinEnabled.mockResolvedValue(false)
    mockGetExchangeRates.mockResolvedValue({ rates: { USD: 1, EUR: 0.92 } })
    mockGetMultiplePrices.mockResolvedValue([])
  })

  it("should start with loading true", () => {
    const { result } = renderHook(() => useAppData())
    expect(result.current.state.loading).toBe(true)
  })

  it("should initialize with empty data arrays", () => {
    const { result } = renderHook(() => useAppData())
    expect(result.current.state.assets).toEqual([])
    expect(result.current.state.accounts).toEqual([])
    expect(result.current.state.snapshots).toEqual([])
    expect(result.current.state.entities).toEqual([])
    expect(result.current.state.cashFlows).toEqual([])
  })

  it("should load data on initialization and set loading false", async () => {
    const mockAssets = [
      {
        id: "a1",
        name: "BTC",
        type: "crypto",
        symbol: "BTC",
        quantity: 1,
        manualPrice: null,
        currency: "USD",
        entityId: 0,
        stakedQuantity: null,
        withdrawalCooldownDays: null,
        createdAt: "",
        updatedAt: "",
      },
    ]
    const mockAccounts = [
      {
        id: "acc1",
        name: "Checking",
        balance: 5000,
        currency: "USD",
        countryCode: "US",
        entityId: 0,
        createdAt: "",
        updatedAt: "",
      },
    ]

    mockApi.assets.getAll.mockResolvedValue(mockAssets)
    mockApi.accounts.getAll.mockResolvedValue(mockAccounts)
    mockGetMultiplePrices.mockResolvedValue([
      { symbol: "BTC", price: 50000, currency: "USD" },
    ])

    const { result } = renderHook(() => useAppData())

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false)
    })

    expect(result.current.state.assets).toEqual(mockAssets)
    expect(result.current.state.accounts).toEqual(mockAccounts)
    expect(mockApi.entities.ensureIndividual).toHaveBeenCalled()
    expect(mockGetExchangeRates).toHaveBeenCalled()
  })

  it("should set initMetadata after initialization", async () => {
    const { result } = renderHook(() => useAppData())

    await waitFor(() => {
      expect(result.current.initMetadata).not.toBeNull()
    })

    expect(result.current.initMetadata?.displayCurrency).toBe("USD")
    expect(result.current.initMetadata?.isPinEnabled).toBe(false)
    expect(result.current.initMetadata?.shouldLock).toBe(false)
  })

  it("should detect PIN enabled and shouldLock", async () => {
    mockApi.settings.isPinEnabled.mockResolvedValue(true)

    const { result } = renderHook(() => useAppData())

    await waitFor(() => {
      expect(result.current.initMetadata).not.toBeNull()
    })

    expect(result.current.initMetadata?.isPinEnabled).toBe(true)
    expect(result.current.initMetadata?.shouldLock).toBe(true)
  })

  it("should show onboarding when no data and not completed", async () => {
    const { result } = renderHook(() => useAppData())

    await waitFor(() => {
      expect(result.current.initMetadata).not.toBeNull()
    })

    expect(result.current.initMetadata?.showOnboarding).toBe(true)
  })

  it("should not show onboarding when onboarding completed in localStorage", async () => {
    localStorage.setItem("fortuna_onboarding_completed", "true")

    const { result } = renderHook(() => useAppData())

    await waitFor(() => {
      expect(result.current.initMetadata).not.toBeNull()
    })

    expect(result.current.initMetadata?.showOnboarding).toBe(false)
  })

  it("should not show onboarding when data exists", async () => {
    mockApi.assets.getAll.mockResolvedValue([
      {
        id: "a1",
        name: "BTC",
        type: "crypto",
        symbol: "BTC",
        quantity: 1,
        manualPrice: null,
        currency: "USD",
        entityId: 0,
        stakedQuantity: null,
        withdrawalCooldownDays: null,
        createdAt: "",
        updatedAt: "",
      },
    ])

    const { result } = renderHook(() => useAppData())

    await waitFor(() => {
      expect(result.current.initMetadata).not.toBeNull()
    })

    expect(result.current.initMetadata?.showOnboarding).toBe(false)
  })

  it("fetchDataOnly should return assets and accounts data", async () => {
    const { result } = renderHook(() => useAppData())

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false)
    })

    vi.clearAllMocks()
    mockApi.entities.ensureIndividual.mockResolvedValue({ id: 0 })
    mockApi.assets.getAll.mockResolvedValue([])
    mockApi.accounts.getAll.mockResolvedValue([])
    mockApi.snapshots.getAll.mockResolvedValue([])
    mockApi.entities.getAll.mockResolvedValue([])
    mockApi.cashFlows.getAll.mockResolvedValue([])

    let fetchResult: { assetsData: unknown[]; accountsData: unknown[] } | undefined
    await act(async () => {
      fetchResult = await result.current.actions.fetchDataOnly()
    })

    expect(fetchResult).toBeDefined()
    expect(mockApi.entities.ensureIndividual).toHaveBeenCalled()
  })

  it("fetchDataOnly should handle errors gracefully", async () => {
    const { result } = renderHook(() => useAppData())

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false)
    })

    vi.clearAllMocks()
    mockApi.entities.ensureIndividual.mockRejectedValue(new Error("DB error"))

    let fetchResult: { assetsData: unknown[]; accountsData: unknown[] } | undefined
    await act(async () => {
      fetchResult = await result.current.actions.fetchDataOnly()
    })

    expect(fetchResult).toEqual({ assetsData: [], accountsData: [] })
    expect(mockShowErrorToast).toHaveBeenCalled()
  })

  it("refreshSnapshots should update snapshots state", async () => {
    const { result } = renderHook(() => useAppData())

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false)
    })

    const newSnapshots = [
      { id: "s1", totalValue: 100000, currency: "USD", recordedAt: "2024-06-01" },
    ]
    mockApi.snapshots.getAll.mockResolvedValue(newSnapshots)

    await act(async () => {
      await result.current.actions.refreshSnapshots()
    })

    expect(result.current.state.snapshots).toEqual(newSnapshots)
  })

  it("refreshSnapshots should swallow errors", async () => {
    const { result } = renderHook(() => useAppData())

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false)
    })

    mockApi.snapshots.getAll.mockRejectedValue(new Error("Snapshot error"))

    await act(async () => {
      await result.current.actions.refreshSnapshots()
    })
  })

  it("should handle currency preference load failure gracefully", async () => {
    mockApi.settings.getCurrencyPreference.mockRejectedValue(new Error("Failed"))

    const { result } = renderHook(() => useAppData())

    await waitFor(() => {
      expect(result.current.initMetadata).not.toBeNull()
    })

    expect(result.current.initMetadata?.displayCurrency).toBe("USD")
  })

  it("should handle locale preference load failure gracefully", async () => {
    mockApi.settings.getLocalePreference.mockRejectedValue(new Error("Failed"))

    const { result } = renderHook(() => useAppData())

    await waitFor(() => {
      expect(result.current.initMetadata).not.toBeNull()
    })

    expect(result.current.state.loading).toBe(false)
  })

  it("should handle PIN check failure gracefully", async () => {
    mockApi.settings.isPinEnabled.mockRejectedValue(new Error("Failed"))

    const { result } = renderHook(() => useAppData())

    await waitFor(() => {
      expect(result.current.initMetadata).not.toBeNull()
    })

    expect(result.current.initMetadata?.isPinEnabled).toBe(false)
    expect(result.current.initMetadata?.shouldLock).toBe(false)
  })
})
