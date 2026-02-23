import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import React from "react"
import {
  usePrivacyModeState,
  usePrivacyMode,
  PrivacyModeContext,
  HIDDEN_VALUE,
  maskValue,
} from "./usePrivacyMode"

describe("usePrivacyMode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe("HIDDEN_VALUE", () => {
    it("should be ****", () => {
      expect(HIDDEN_VALUE).toBe("****")
    })
  })

  describe("maskValue", () => {
    it("should return HIDDEN_VALUE when isPrivate is true", () => {
      expect(maskValue(true, "$1,234.56")).toBe("****")
    })

    it("should return the formatted value when isPrivate is false", () => {
      expect(maskValue(false, "$1,234.56")).toBe("$1,234.56")
    })
  })

  describe("usePrivacyModeState", () => {
    it("should default to not private when localStorage is empty", () => {
      const { result } = renderHook(() => usePrivacyModeState())
      expect(result.current.isPrivate).toBe(false)
    })

    it("should read persisted private state from localStorage", () => {
      localStorage.setItem("fortuna_privacy_mode", "true")
      const { result } = renderHook(() => usePrivacyModeState())
      expect(result.current.isPrivate).toBe(true)
    })

    it("should persist state to localStorage on toggle", () => {
      const { result } = renderHook(() => usePrivacyModeState())

      act(() => {
        result.current.togglePrivacy()
      })

      expect(localStorage.setItem).toHaveBeenCalledWith("fortuna_privacy_mode", "true")
    })

    it("togglePrivacy should invert isPrivate", () => {
      const { result } = renderHook(() => usePrivacyModeState())

      expect(result.current.isPrivate).toBe(false)

      act(() => {
        result.current.togglePrivacy()
      })

      expect(result.current.isPrivate).toBe(true)

      act(() => {
        result.current.togglePrivacy()
      })

      expect(result.current.isPrivate).toBe(false)
    })

    it("should handle localStorage read errors gracefully", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError")
      })

      const { result } = renderHook(() => usePrivacyModeState())
      expect(result.current.isPrivate).toBe(false)
    })

    it("should handle localStorage write errors gracefully", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError")
      })

      const { result } = renderHook(() => usePrivacyModeState())

      act(() => {
        result.current.togglePrivacy()
      })

      expect(result.current.isPrivate).toBe(true)
    })

    it("Cmd+Shift+H should toggle privacy mode", () => {
      const { result } = renderHook(() => usePrivacyModeState())

      expect(result.current.isPrivate).toBe(false)

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "h", metaKey: true, shiftKey: true }),
        )
      })

      expect(result.current.isPrivate).toBe(true)
    })

    it("Ctrl+Shift+H should toggle privacy mode", () => {
      const { result } = renderHook(() => usePrivacyModeState())

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "h", ctrlKey: true, shiftKey: true }),
        )
      })

      expect(result.current.isPrivate).toBe(true)
    })

    it("Cmd+Shift+H should not toggle when input is focused", () => {
      const { result } = renderHook(() => usePrivacyModeState())

      const input = document.createElement("input")
      document.body.appendChild(input)
      input.focus()

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "h", metaKey: true, shiftKey: true }),
        )
      })

      expect(result.current.isPrivate).toBe(false)

      document.body.removeChild(input)
    })

    it("Cmd+H without Shift should not toggle privacy mode", () => {
      const { result } = renderHook(() => usePrivacyModeState())

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "h", metaKey: true }))
      })

      expect(result.current.isPrivate).toBe(false)
    })
  })

  describe("usePrivacyMode (context consumer)", () => {
    it("should return context values from provider", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          PrivacyModeContext.Provider,
          { value: { isPrivate: true, togglePrivacy: vi.fn() } },
          children,
        )

      const { result } = renderHook(() => usePrivacyMode(), { wrapper })
      expect(result.current.isPrivate).toBe(true)
    })

    it("should call togglePrivacy from context", () => {
      const mockToggle = vi.fn()
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          PrivacyModeContext.Provider,
          { value: { isPrivate: false, togglePrivacy: mockToggle } },
          children,
        )

      const { result } = renderHook(() => usePrivacyMode(), { wrapper })
      result.current.togglePrivacy()
      expect(mockToggle).toHaveBeenCalledTimes(1)
    })
  })
})
