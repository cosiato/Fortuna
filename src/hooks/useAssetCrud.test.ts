import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { invoke } from "@tauri-apps/api/core"
import { useAssetCrud } from "./useAssetCrud"
import type { Asset } from "@/types/database"

const mockInvoke = vi.mocked(invoke)

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock("@/lib/errorHandling", () => ({
  showErrorToast: vi.fn(),
}))

vi.mock("@/lib/prices", () => ({
  fetchSinglePrice: vi.fn().mockResolvedValue({ symbol: "BTC", price: 50000, currency: "USD" }),
}))

describe("useAssetCrud", () => {
  const mockFetchDataOnly = vi.fn().mockResolvedValue({ assetsData: [], accountsData: [] })
  const mockRequestSnapshot = vi.fn()
  const mockSetAssets = vi.fn()
  const mockSetPrices = vi.fn()

  const defaultOptions = {
    selectedEntityId: 0,
    fetchDataOnly: mockFetchDataOnly,
    requestSnapshot: mockRequestSnapshot,
    setAssets: mockSetAssets,
    setPrices: mockSetPrices,
  }

  const mockAsset: Asset = {
    id: "asset-1",
    name: "Bitcoin",
    type: "crypto",
    symbol: "BTC",
    quantity: 1.5,
    manualPrice: null,
    currency: "USD",
    entityId: 0,
    stakedQuantity: null,
    withdrawalCooldownDays: null,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with form closed and no editing asset", () => {
    const { result } = renderHook(() => useAssetCrud(defaultOptions))
    expect(result.current.assetFormOpen).toBe(false)
    expect(result.current.editingAsset).toBeNull()
  })

  it("handleAddAsset should create asset and refetch", async () => {
    mockInvoke.mockResolvedValueOnce(mockAsset) // create_asset
    mockInvoke.mockResolvedValueOnce(undefined) // update currency (fetchPriceAndSyncCurrency)

    const { result } = renderHook(() => useAssetCrud(defaultOptions))

    await act(async () => {
      await result.current.handleAddAsset({
        name: "Bitcoin",
        type: "crypto",
        symbol: "BTC",
        quantity: 1.5,
        currency: "USD",
      })
    })

    expect(mockInvoke).toHaveBeenCalledWith("create_asset", {
      input: expect.objectContaining({ name: "Bitcoin", type: "crypto" }),
    })
    expect(result.current.assetFormOpen).toBe(false)
    expect(mockFetchDataOnly).toHaveBeenCalled()
    expect(mockRequestSnapshot).toHaveBeenCalled()
  })

  it("handleEditAsset should set editing state", () => {
    const { result } = renderHook(() => useAssetCrud(defaultOptions))

    act(() => {
      result.current.handleEditAsset(mockAsset)
    })

    expect(result.current.editingAsset).toEqual(mockAsset)
    expect(result.current.assetFormOpen).toBe(true)
  })

  it("handleUpdateAsset should be no-op if editingAsset is null", async () => {
    const { result } = renderHook(() => useAssetCrud(defaultOptions))

    await act(async () => {
      await result.current.handleUpdateAsset({ name: "Updated" })
    })

    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it("handleUpdateAsset should update when editing", async () => {
    mockInvoke.mockResolvedValueOnce({ ...mockAsset, name: "Updated BTC" })

    const { result } = renderHook(() => useAssetCrud(defaultOptions))

    act(() => {
      result.current.handleEditAsset(mockAsset)
    })

    await act(async () => {
      await result.current.handleUpdateAsset({
        name: "Updated BTC",
        type: "crypto",
        symbol: "BTC",
        quantity: 2,
      })
    })

    expect(mockInvoke).toHaveBeenCalledWith("update_asset", {
      id: "asset-1",
      input: expect.objectContaining({ name: "Updated BTC" }),
    })
    expect(result.current.assetFormOpen).toBe(false)
    expect(result.current.editingAsset).toBeNull()
  })

  it("handleDeleteAsset should delete and refetch", async () => {
    mockInvoke.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useAssetCrud(defaultOptions))

    await act(async () => {
      await result.current.handleDeleteAsset("asset-1")
    })

    expect(mockInvoke).toHaveBeenCalledWith("delete_asset", { id: "asset-1" })
    expect(mockFetchDataOnly).toHaveBeenCalled()
    expect(mockRequestSnapshot).toHaveBeenCalled()
  })

  it("handleQuantityChange should update optimistically", async () => {
    mockInvoke.mockResolvedValueOnce({ ...mockAsset, quantity: 3 })

    const { result } = renderHook(() => useAssetCrud(defaultOptions))

    await act(async () => {
      await result.current.handleQuantityChange("asset-1", 3)
    })

    expect(mockInvoke).toHaveBeenCalledWith("update_asset", {
      id: "asset-1",
      input: { quantity: 3 },
    })
    expect(mockSetAssets).toHaveBeenCalled()
    expect(mockRequestSnapshot).toHaveBeenCalled()
  })

  it("handleAssetFormClose should clear editing state", () => {
    const { result } = renderHook(() => useAssetCrud(defaultOptions))

    act(() => {
      result.current.handleEditAsset(mockAsset)
    })

    act(() => {
      result.current.handleAssetFormClose(false)
    })

    expect(result.current.assetFormOpen).toBe(false)
    expect(result.current.editingAsset).toBeNull()
  })
})
