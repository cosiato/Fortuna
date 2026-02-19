import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"

const { mockCheck, mockRelaunch } = vi.hoisted(() => ({
  mockCheck: vi.fn(),
  mockRelaunch: vi.fn(),
}))

vi.mock("@tauri-apps/plugin-updater", () => ({
  check: (...args: unknown[]) => mockCheck(...args),
}))

vi.mock("@tauri-apps/plugin-process", () => ({
  relaunch: (...args: unknown[]) => mockRelaunch(...args),
}))

import { useUpdater } from "./useUpdater"

describe("useUpdater", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with idle status and null updateInfo", () => {
    mockCheck.mockReturnValue(new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useUpdater())
    expect(result.current.updateInfo).toBeNull()
    expect(result.current.progress).toEqual({ downloaded: 0, total: 0 })
  })

  it("should set status to available when update is found", async () => {
    const mockUpdate = {
      version: "1.2.0",
      body: "New features",
      downloadAndInstall: vi.fn(),
    }
    mockCheck.mockResolvedValueOnce(mockUpdate)

    const { result } = renderHook(() => useUpdater())

    await waitFor(() => {
      expect(result.current.status).toBe("available")
    })

    expect(result.current.updateInfo).toEqual({
      version: "1.2.0",
      body: "New features",
    })
  })

  it("should set status to idle when no update available", async () => {
    mockCheck.mockResolvedValueOnce(null)

    const { result } = renderHook(() => useUpdater())

    await waitFor(() => {
      expect(result.current.status).toBe("idle")
    })

    expect(result.current.updateInfo).toBeNull()
  })

  it("should set status to error when check fails", async () => {
    mockCheck.mockRejectedValueOnce(new Error("Network error"))

    const { result } = renderHook(() => useUpdater())

    await waitFor(() => {
      expect(result.current.status).toBe("error")
    })
  })

  it("should handle update with null body", async () => {
    const mockUpdate = {
      version: "1.3.0",
      body: null,
      downloadAndInstall: vi.fn(),
    }
    mockCheck.mockResolvedValueOnce(mockUpdate)

    const { result } = renderHook(() => useUpdater())

    await waitFor(() => {
      expect(result.current.status).toBe("available")
    })

    expect(result.current.updateInfo).toEqual({
      version: "1.3.0",
      body: "",
    })
  })

  it("dismiss should reset state to idle", async () => {
    const mockUpdate = {
      version: "1.2.0",
      body: "Changes",
      downloadAndInstall: vi.fn(),
    }
    mockCheck.mockResolvedValueOnce(mockUpdate)

    const { result } = renderHook(() => useUpdater())

    await waitFor(() => {
      expect(result.current.status).toBe("available")
    })

    act(() => {
      result.current.dismiss()
    })

    expect(result.current.status).toBe("idle")
    expect(result.current.updateInfo).toBeNull()
  })

  it("downloadAndInstall should be no-op if no update ref", async () => {
    mockCheck.mockResolvedValueOnce(null)

    const { result } = renderHook(() => useUpdater())

    await waitFor(() => {
      expect(result.current.status).toBe("idle")
    })

    await act(async () => {
      await result.current.downloadAndInstall()
    })

    expect(mockRelaunch).not.toHaveBeenCalled()
  })

  it("downloadAndInstall should call update.downloadAndInstall and relaunch", async () => {
    const mockDownloadAndInstall = vi.fn().mockResolvedValue(undefined)
    const mockUpdate = {
      version: "1.2.0",
      body: "Changes",
      downloadAndInstall: mockDownloadAndInstall,
    }
    mockCheck.mockResolvedValueOnce(mockUpdate)
    mockRelaunch.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useUpdater())

    await waitFor(() => {
      expect(result.current.status).toBe("available")
    })

    await act(async () => {
      await result.current.downloadAndInstall()
    })

    expect(mockDownloadAndInstall).toHaveBeenCalled()
    expect(mockRelaunch).toHaveBeenCalled()
  })

  it("downloadAndInstall should set error on failure", async () => {
    const mockDownloadAndInstall = vi.fn().mockRejectedValue(new Error("Download failed"))
    const mockUpdate = {
      version: "1.2.0",
      body: "Changes",
      downloadAndInstall: mockDownloadAndInstall,
    }
    mockCheck.mockResolvedValueOnce(mockUpdate)

    const { result } = renderHook(() => useUpdater())

    await waitFor(() => {
      expect(result.current.status).toBe("available")
    })

    await act(async () => {
      await result.current.downloadAndInstall()
    })

    expect(result.current.status).toBe("error")
    expect(mockRelaunch).not.toHaveBeenCalled()
  })
})
