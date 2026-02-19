import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { invoke } from "@tauri-apps/api/core"
import { useEntityCrud } from "./useEntityCrud"
import type { Entity } from "@/types/database"

const mockInvoke = vi.mocked(invoke)

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock("@/lib/errorHandling", () => ({
  showErrorToast: vi.fn(),
}))

describe("useEntityCrud", () => {
  const mockFetchDataOnly = vi.fn().mockResolvedValue({ assetsData: [], accountsData: [] })
  const mockRequestSnapshot = vi.fn()

  const defaultOptions = {
    fetchDataOnly: mockFetchDataOnly,
    requestSnapshot: mockRequestSnapshot,
  }

  const mockEntity: Entity = {
    id: 1,
    name: "Test Corp",
    type: "company",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with selectedEntityId 0", () => {
    const { result } = renderHook(() => useEntityCrud(defaultOptions))
    expect(result.current.selectedEntityId).toBe(0)
    expect(result.current.entityFormOpen).toBe(false)
    expect(result.current.editingEntity).toBeNull()
  })

  it("handleAddCompany should create entity and refetch", async () => {
    mockInvoke.mockResolvedValueOnce(mockEntity)

    const { result } = renderHook(() => useEntityCrud(defaultOptions))

    await act(async () => {
      await result.current.handleAddCompany({ name: "Test Corp" })
    })

    expect(mockInvoke).toHaveBeenCalledWith("create_entity", {
      input: { name: "Test Corp", type: "company" },
    })
    expect(result.current.entityFormOpen).toBe(false)
    expect(mockFetchDataOnly).toHaveBeenCalled()
  })

  it("handleEditEntity should set editing state", () => {
    const { result } = renderHook(() => useEntityCrud(defaultOptions))

    act(() => {
      result.current.handleEditEntity(mockEntity)
    })

    expect(result.current.editingEntity).toEqual(mockEntity)
    expect(result.current.entityFormOpen).toBe(true)
  })

  it("handleUpdateEntity should be no-op if editingEntity is null", async () => {
    const { result } = renderHook(() => useEntityCrud(defaultOptions))

    await act(async () => {
      await result.current.handleUpdateEntity({ name: "Updated" })
    })

    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it("handleUpdateEntity should update entity when editing", async () => {
    mockInvoke.mockResolvedValueOnce({ ...mockEntity, name: "Updated" })

    const { result } = renderHook(() => useEntityCrud(defaultOptions))

    act(() => {
      result.current.handleEditEntity(mockEntity)
    })

    await act(async () => {
      await result.current.handleUpdateEntity({ name: "Updated" })
    })

    expect(mockInvoke).toHaveBeenCalledWith("update_entity", {
      id: 1,
      input: { name: "Updated" },
    })
    expect(result.current.entityFormOpen).toBe(false)
    expect(result.current.editingEntity).toBeNull()
  })

  it("handleEntityFormClose should clear editing state when closing", () => {
    const { result } = renderHook(() => useEntityCrud(defaultOptions))

    act(() => {
      result.current.handleEditEntity(mockEntity)
    })

    expect(result.current.editingEntity).not.toBeNull()

    act(() => {
      result.current.handleEntityFormClose(false)
    })

    expect(result.current.entityFormOpen).toBe(false)
    expect(result.current.editingEntity).toBeNull()
  })

  it("handleDeleteEntityRequest should open delete dialog", () => {
    const { result } = renderHook(() => useEntityCrud(defaultOptions))

    act(() => {
      result.current.handleDeleteEntityRequest(mockEntity)
    })

    expect(result.current.deleteDialogOpen).toBe(true)
    expect(result.current.entityToDelete).toEqual(mockEntity)
  })

  it("handleConfirmDeleteEntity should delete and reset selectedEntityId if needed", async () => {
    mockInvoke.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useEntityCrud(defaultOptions))

    act(() => {
      result.current.setSelectedEntityId(1)
    })

    act(() => {
      result.current.handleDeleteEntityRequest(mockEntity)
    })

    await act(async () => {
      await result.current.handleConfirmDeleteEntity()
    })

    expect(mockInvoke).toHaveBeenCalledWith("delete_entity_cascade", { id: 1 })
    expect(result.current.selectedEntityId).toBe(0)
    expect(result.current.deleteDialogOpen).toBe(false)
    expect(mockFetchDataOnly).toHaveBeenCalled()
    expect(mockRequestSnapshot).toHaveBeenCalled()
  })

  it("handleConfirmDeleteEntity should be no-op if entityToDelete is null", async () => {
    const { result } = renderHook(() => useEntityCrud(defaultOptions))

    await act(async () => {
      await result.current.handleConfirmDeleteEntity()
    })

    expect(mockInvoke).not.toHaveBeenCalled()
  })
})
