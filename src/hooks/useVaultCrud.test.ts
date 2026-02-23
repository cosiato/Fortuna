import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { invoke } from "@tauri-apps/api/core"
import { useVaultCrud } from "./useVaultCrud"
import type { Account, CashFlow } from "@/types/database"

const mockInvoke = vi.mocked(invoke)

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock("@/lib/errorHandling", () => ({
  showErrorToast: vi.fn(),
}))

describe("useVaultCrud", () => {
  const mockFetchDataOnly = vi.fn().mockResolvedValue({ assetsData: [], accountsData: [] })
  const mockRequestSnapshot = vi.fn()
  const mockSetCashFlows = vi.fn()

  const mockCashFlow: CashFlow = {
    id: "cf-1",
    accountId: "acc-1",
    name: "Salary",
    amount: 5000,
    flowType: "inflow",
    frequency: "monthly",
    category: "salary",
    startDate: "2024-01-01",
    endDate: null,
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  }

  const mockAccount: Account = {
    id: "acc-1",
    name: "Checking",
    balance: 10000,
    currency: "USD",
    countryCode: "US",
    entityId: 0,
    isLiquid: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  }

  const defaultOptions = {
    selectedEntityId: 0,
    cashFlows: [mockCashFlow],
    setCashFlows: mockSetCashFlows,
    fetchDataOnly: mockFetchDataOnly,
    requestSnapshot: mockRequestSnapshot,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with all forms closed", () => {
    const { result } = renderHook(() => useVaultCrud(defaultOptions))
    expect(result.current.accountFormOpen).toBe(false)
    expect(result.current.editingAccount).toBeNull()
    expect(result.current.cashFlowFormOpen).toBe(false)
    expect(result.current.editingCashFlow).toBeNull()
  })

  it("handleAddAccount should create account and refetch", async () => {
    mockInvoke.mockResolvedValueOnce(mockAccount)

    const { result } = renderHook(() => useVaultCrud(defaultOptions))

    await act(async () => {
      await result.current.handleAddAccount({
        name: "Checking",
        balance: 10000,
        currency: "USD",
        countryCode: "US",
      })
    })

    expect(mockInvoke).toHaveBeenCalledWith("create_account", {
      input: expect.objectContaining({ name: "Checking" }),
    })
    expect(result.current.accountFormOpen).toBe(false)
    expect(mockFetchDataOnly).toHaveBeenCalled()
    expect(mockRequestSnapshot).toHaveBeenCalled()
  })

  it("handleEditAccount should set editing state", () => {
    const { result } = renderHook(() => useVaultCrud(defaultOptions))

    act(() => {
      result.current.handleEditAccount(mockAccount)
    })

    expect(result.current.editingAccount).toEqual(mockAccount)
    expect(result.current.accountFormOpen).toBe(true)
  })

  it("handleUpdateAccount should be no-op if editingAccount is null", async () => {
    const { result } = renderHook(() => useVaultCrud(defaultOptions))

    await act(async () => {
      await result.current.handleUpdateAccount({ name: "Updated" })
    })

    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it("handleUpdateAccount should update and refetch", async () => {
    mockInvoke.mockResolvedValueOnce({ ...mockAccount, name: "Updated" })

    const { result } = renderHook(() => useVaultCrud(defaultOptions))

    act(() => {
      result.current.handleEditAccount(mockAccount)
    })

    await act(async () => {
      await result.current.handleUpdateAccount({ name: "Updated" })
    })

    expect(mockInvoke).toHaveBeenCalledWith("update_account", {
      id: "acc-1",
      input: expect.objectContaining({ name: "Updated" }),
    })
    expect(result.current.accountFormOpen).toBe(false)
    expect(result.current.editingAccount).toBeNull()
  })

  it("handleDeleteAccountRequest should open delete dialog", () => {
    const { result } = renderHook(() => useVaultCrud(defaultOptions))

    act(() => {
      result.current.handleDeleteAccountRequest(mockAccount)
    })

    expect(result.current.deleteAccountDialogOpen).toBe(true)
    expect(result.current.accountToDelete).toEqual(mockAccount)
  })

  it("handleConfirmDeleteAccount should delete and refresh cash flows", async () => {
    mockInvoke
      .mockResolvedValueOnce(undefined) // delete_account
      .mockResolvedValueOnce([]) // get_all_cash_flows

    const { result } = renderHook(() => useVaultCrud(defaultOptions))

    act(() => {
      result.current.handleDeleteAccountRequest(mockAccount)
    })

    await act(async () => {
      await result.current.handleConfirmDeleteAccount()
    })

    expect(mockInvoke).toHaveBeenCalledWith("delete_account", { id: "acc-1" })
    expect(result.current.deleteAccountDialogOpen).toBe(false)
    expect(mockFetchDataOnly).toHaveBeenCalled()
    expect(mockRequestSnapshot).toHaveBeenCalled()
    expect(mockSetCashFlows).toHaveBeenCalledWith([])
  })

  it("handleAddCashFlow should create new cash flow", async () => {
    mockInvoke
      .mockResolvedValueOnce(mockCashFlow) // create_cash_flow
      .mockResolvedValueOnce([mockCashFlow]) // get_all_cash_flows

    const { result } = renderHook(() => useVaultCrud(defaultOptions))

    await act(async () => {
      await result.current.handleAddCashFlow(
        {
          accountId: "acc-1",
          name: "Salary",
          amount: 5000,
          flowType: "inflow",
          frequency: "monthly",
          category: "salary",
          startDate: "2024-01-01",
        },
        false,
      )
    })

    expect(mockInvoke).toHaveBeenCalledWith("create_cash_flow", {
      input: expect.objectContaining({ name: "Salary" }),
    })
    expect(result.current.cashFlowFormOpen).toBe(false)
  })

  it("handleAddCashFlow should update when isEdit is true", async () => {
    mockInvoke
      .mockResolvedValueOnce({ ...mockCashFlow, amount: 6000 }) // update_cash_flow
      .mockResolvedValueOnce([{ ...mockCashFlow, amount: 6000 }]) // get_all_cash_flows

    const { result } = renderHook(() => useVaultCrud(defaultOptions))

    // Set editing state
    act(() => {
      result.current.handleEditCashFlow("cf-1")
    })

    await act(async () => {
      await result.current.handleAddCashFlow({ amount: 6000 }, true)
    })

    expect(mockInvoke).toHaveBeenCalledWith("update_cash_flow", {
      id: "cf-1",
      input: { amount: 6000 },
    })
  })

  it("handleEditCashFlow should set editing state from cashFlows", () => {
    const { result } = renderHook(() => useVaultCrud(defaultOptions))

    act(() => {
      result.current.handleEditCashFlow("cf-1")
    })

    expect(result.current.editingCashFlow).toEqual(mockCashFlow)
    expect(result.current.cashFlowAccountId).toBe("acc-1")
    expect(result.current.cashFlowFormOpen).toBe(true)
  })

  it("handleEditCashFlow should be no-op for unknown id", () => {
    const { result } = renderHook(() => useVaultCrud(defaultOptions))

    act(() => {
      result.current.handleEditCashFlow("unknown-id")
    })

    expect(result.current.editingCashFlow).toBeNull()
    expect(result.current.cashFlowFormOpen).toBe(false)
  })

  it("handleDeleteCashFlow should delete and refresh", async () => {
    mockInvoke
      .mockResolvedValueOnce(undefined) // delete_cash_flow
      .mockResolvedValueOnce([]) // get_all_cash_flows

    const { result } = renderHook(() => useVaultCrud(defaultOptions))

    await act(async () => {
      await result.current.handleDeleteCashFlow("cf-1")
    })

    expect(mockInvoke).toHaveBeenCalledWith("delete_cash_flow", { id: "cf-1" })
    expect(mockSetCashFlows).toHaveBeenCalledWith([])
  })

  it("handleToggleCashFlow should invert isActive", async () => {
    mockInvoke
      .mockResolvedValueOnce({ ...mockCashFlow, isActive: false }) // update_cash_flow
      .mockResolvedValueOnce([{ ...mockCashFlow, isActive: false }]) // get_all_cash_flows

    const { result } = renderHook(() => useVaultCrud(defaultOptions))

    await act(async () => {
      await result.current.handleToggleCashFlow("cf-1")
    })

    expect(mockInvoke).toHaveBeenCalledWith("update_cash_flow", {
      id: "cf-1",
      input: { isActive: false },
    })
  })

  it("handleToggleCashFlow should be no-op for unknown id", async () => {
    const { result } = renderHook(() => useVaultCrud(defaultOptions))

    await act(async () => {
      await result.current.handleToggleCashFlow("unknown-id")
    })

    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it("openAddFlow should set correct state", () => {
    const { result } = renderHook(() => useVaultCrud(defaultOptions))

    act(() => {
      result.current.openAddFlow("acc-1", "outflow")
    })

    expect(result.current.cashFlowAccountId).toBe("acc-1")
    expect(result.current.defaultFlowType).toBe("outflow")
    expect(result.current.editingCashFlow).toBeNull()
    expect(result.current.cashFlowFormOpen).toBe(true)
  })

  it("handleCashFlowFormClose should clear state", () => {
    const { result } = renderHook(() => useVaultCrud(defaultOptions))

    act(() => {
      result.current.openAddFlow("acc-1", "inflow")
    })

    act(() => {
      result.current.handleCashFlowFormClose(false)
    })

    expect(result.current.cashFlowFormOpen).toBe(false)
    expect(result.current.editingCashFlow).toBeNull()
    expect(result.current.defaultFlowType).toBeUndefined()
  })
})
