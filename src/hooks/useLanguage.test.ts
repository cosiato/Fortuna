import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { invoke } from "@tauri-apps/api/core"
import { useLanguage } from "./useLanguage"

const mockInvoke = vi.mocked(invoke)

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: {
      language: "en",
      changeLanguage: vi.fn().mockResolvedValue(undefined),
    },
  }),
}))

describe("useLanguage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return currentLanguage from i18n", () => {
    const { result } = renderHook(() => useLanguage())
    expect(result.current.currentLanguage).toBe("en")
  })

  it("changeLanguage should call i18n.changeLanguage and backend", async () => {
    mockInvoke.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useLanguage())

    await act(async () => {
      await result.current.changeLanguage("fr")
    })

    expect(mockInvoke).toHaveBeenCalledWith("set_locale_preference", { locale: "fr" })
  })

  it("changeLanguage should not throw if backend fails", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("Backend error"))

    const { result } = renderHook(() => useLanguage())

    await act(async () => {
      await result.current.changeLanguage("es")
    })

    // Should not throw - backend save is best-effort
  })
})
