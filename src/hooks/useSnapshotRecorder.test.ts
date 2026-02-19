import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { invoke } from "@tauri-apps/api/core"
import { useSnapshotRecorder } from "./useSnapshotRecorder"

const mockInvoke = vi.mocked(invoke)

describe("useSnapshotRecorder", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const defaultOptions = {
    netWorth: 50000,
    currency: "USD",
    enabled: true,
    onSnapshotsUpdated: vi.fn(),
  }

  it("requestSnapshot should debounce and record after delay", async () => {
    mockInvoke.mockResolvedValueOnce({
      id: "1",
      totalValue: 50000,
      currency: "USD",
      recordedAt: "",
    })

    const { result } = renderHook(() => useSnapshotRecorder(defaultOptions))

    act(() => {
      result.current.requestSnapshot()
    })

    // Should not have called yet
    expect(mockInvoke).not.toHaveBeenCalled()

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(10_000)
    })

    expect(mockInvoke).toHaveBeenCalledWith("create_snapshot", {
      input: { totalValue: 50000, currency: "USD" },
    })
  })

  it("recordSnapshotNow should bypass debounce", async () => {
    mockInvoke.mockResolvedValueOnce({
      id: "1",
      totalValue: 50000,
      currency: "USD",
      recordedAt: "",
    })

    const { result } = renderHook(() => useSnapshotRecorder(defaultOptions))

    await act(async () => {
      result.current.recordSnapshotNow()
    })

    expect(mockInvoke).toHaveBeenCalledWith("create_snapshot", {
      input: { totalValue: 50000, currency: "USD" },
    })
    expect(defaultOptions.onSnapshotsUpdated).toHaveBeenCalled()
  })

  it("should not record when disabled", async () => {
    const { result } = renderHook(() => useSnapshotRecorder({ ...defaultOptions, enabled: false }))

    await act(async () => {
      result.current.recordSnapshotNow()
    })

    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it("should not record when disabled via requestSnapshot", () => {
    const { result } = renderHook(() => useSnapshotRecorder({ ...defaultOptions, enabled: false }))

    act(() => {
      result.current.requestSnapshot()
    })

    vi.advanceTimersByTime(10_000)
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it("recordSnapshotNow should cancel pending debounced request", async () => {
    mockInvoke.mockResolvedValue({ id: "1", totalValue: 50000, currency: "USD", recordedAt: "" })

    const { result } = renderHook(() => useSnapshotRecorder(defaultOptions))

    act(() => {
      result.current.requestSnapshot()
    })

    await act(async () => {
      result.current.recordSnapshotNow()
    })

    // Advance past the original debounce - should not trigger a second call
    await act(async () => {
      vi.advanceTimersByTime(10_000)
    })

    // Only the recordSnapshotNow call should have happened
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })

  it("should not re-record the same value", async () => {
    mockInvoke.mockResolvedValue({ id: "1", totalValue: 50000, currency: "USD", recordedAt: "" })

    const { result } = renderHook(() => useSnapshotRecorder(defaultOptions))

    await act(async () => {
      result.current.recordSnapshotNow()
    })

    await act(async () => {
      result.current.recordSnapshotNow()
    })

    // Second call is skipped because value hasn't changed
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })

  it("should swallow errors gracefully", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("DB error"))

    const { result } = renderHook(() => useSnapshotRecorder(defaultOptions))

    await act(async () => {
      result.current.recordSnapshotNow()
    })

    // Should not throw
    expect(defaultOptions.onSnapshotsUpdated).not.toHaveBeenCalled()
  })
})
