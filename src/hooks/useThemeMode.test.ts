import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import React from "react"
import { useThemeModeState, useThemeMode, ThemeModeContext, ThemePreference } from "./useThemeMode"

const { mockSetThemePreference } = vi.hoisted(() => ({
  mockSetThemePreference: vi.fn(() => Promise.resolve()),
}))

vi.mock("@/lib/api", () => ({
  api: {
    settings: {
      setThemePreference: mockSetThemePreference,
    },
  },
}))

// Helper to check the dark class on documentElement
function hasDarkClass(): boolean {
  return document.documentElement.classList.contains("dark")
}

describe("useThemeMode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.classList.remove("dark")
  })

  describe("useThemeModeState", () => {
    it("should initialize with the provided initial preference", () => {
      const { result } = renderHook(() => useThemeModeState("dark"))
      expect(result.current.preference).toBe("dark")
      expect(result.current.resolvedTheme).toBe("dark")
    })

    it("should apply dark class when initial is dark", () => {
      renderHook(() => useThemeModeState("dark"))
      expect(hasDarkClass()).toBe(true)
    })

    it("should not apply dark class when initial is light", () => {
      renderHook(() => useThemeModeState("light"))
      expect(hasDarkClass()).toBe(false)
    })

    it("should persist preference to localStorage", () => {
      renderHook(() => useThemeModeState("dark"))
      expect(localStorage.setItem).toHaveBeenCalledWith("fortuna_theme_preference", "dark")
    })

    it("setTheme should change preference and resolved theme", () => {
      const { result } = renderHook(() => useThemeModeState("dark"))

      act(() => {
        result.current.setTheme("light")
      })

      expect(result.current.preference).toBe("light")
      expect(result.current.resolvedTheme).toBe("light")
      expect(hasDarkClass()).toBe(false)
    })

    it("setTheme should persist to DB via API", () => {
      const { result } = renderHook(() => useThemeModeState("dark"))

      act(() => {
        result.current.setTheme("light")
      })

      expect(mockSetThemePreference).toHaveBeenCalledWith("light")
    })

    it("setTheme should mirror to localStorage", () => {
      const { result } = renderHook(() => useThemeModeState("dark"))

      act(() => {
        result.current.setTheme("light")
      })

      expect(localStorage.setItem).toHaveBeenCalledWith("fortuna_theme_preference", "light")
    })

    it("should handle localStorage write errors gracefully", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError")
      })

      const { result } = renderHook(() => useThemeModeState("dark"))

      act(() => {
        result.current.setTheme("light")
      })

      // Should still update in-memory state even if storage fails
      expect(result.current.preference).toBe("light")
    })

    it("should reconcile when initial prop changes", () => {
      const { result, rerender } = renderHook(
        ({ initial }: { initial: ThemePreference }) => useThemeModeState(initial),
        { initialProps: { initial: "dark" as ThemePreference } },
      )

      expect(result.current.preference).toBe("dark")

      rerender({ initial: "light" })

      expect(result.current.preference).toBe("light")
      expect(result.current.resolvedTheme).toBe("light")
    })

    it("should not reconcile when initial prop is the same", () => {
      const { result, rerender } = renderHook(
        ({ initial }: { initial: ThemePreference }) => useThemeModeState(initial),
        { initialProps: { initial: "dark" as ThemePreference } },
      )

      // Change to light first
      act(() => {
        result.current.setTheme("light")
      })

      // Re-render with same initial -- should NOT reset to dark
      rerender({ initial: "dark" })

      // preference stays light because initial didn't change from the ref's perspective
      // (initial was "dark" on first render, still "dark" on rerender => no change)
      expect(result.current.preference).toBe("light")
    })

    it("should resolve system preference based on OS theme", () => {
      // Mock OS to prefer light
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === "(prefers-color-scheme: dark)" ? false : true,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      const { result } = renderHook(() => useThemeModeState("system"))

      expect(result.current.preference).toBe("system")
      expect(result.current.resolvedTheme).toBe("light")
      expect(hasDarkClass()).toBe(false)
    })
  })

  describe("keyboard shortcut", () => {
    it("Cmd+Shift+T should cycle dark -> light -> system", () => {
      const { result } = renderHook(() => useThemeModeState("dark"))

      expect(result.current.preference).toBe("dark")

      // dark -> light
      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "T", metaKey: true, shiftKey: true }),
        )
      })

      expect(result.current.preference).toBe("light")

      // light -> system
      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "T", metaKey: true, shiftKey: true }),
        )
      })

      expect(result.current.preference).toBe("system")

      // system -> dark
      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "T", metaKey: true, shiftKey: true }),
        )
      })

      expect(result.current.preference).toBe("dark")
    })

    it("Ctrl+Shift+T should also cycle themes", () => {
      const { result } = renderHook(() => useThemeModeState("dark"))

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "T", ctrlKey: true, shiftKey: true }),
        )
      })

      expect(result.current.preference).toBe("light")
    })

    it("should persist each cycle step to DB", () => {
      renderHook(() => useThemeModeState("dark"))

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "T", metaKey: true, shiftKey: true }),
        )
      })

      expect(mockSetThemePreference).toHaveBeenCalledWith("light")
    })

    it("should not cycle when input is focused", () => {
      const { result } = renderHook(() => useThemeModeState("dark"))

      const input = document.createElement("input")
      document.body.appendChild(input)
      input.focus()

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "T", metaKey: true, shiftKey: true }),
        )
      })

      expect(result.current.preference).toBe("dark")

      document.body.removeChild(input)
    })

    it("should not cycle when textarea is focused", () => {
      const { result } = renderHook(() => useThemeModeState("dark"))

      const textarea = document.createElement("textarea")
      document.body.appendChild(textarea)
      textarea.focus()

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "T", metaKey: true, shiftKey: true }),
        )
      })

      expect(result.current.preference).toBe("dark")

      document.body.removeChild(textarea)
    })

    it("Cmd+T without Shift should not cycle themes", () => {
      const { result } = renderHook(() => useThemeModeState("dark"))

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "T", metaKey: true }))
      })

      expect(result.current.preference).toBe("dark")
    })
  })

  describe("useThemeMode (context consumer)", () => {
    it("should return context values from provider", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          ThemeModeContext.Provider,
          { value: { preference: "light", resolvedTheme: "light", setTheme: vi.fn() } },
          children,
        )

      const { result } = renderHook(() => useThemeMode(), { wrapper })
      expect(result.current.preference).toBe("light")
      expect(result.current.resolvedTheme).toBe("light")
    })

    it("should call setTheme from context", () => {
      const mockSetTheme = vi.fn()
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          ThemeModeContext.Provider,
          { value: { preference: "dark", resolvedTheme: "dark", setTheme: mockSetTheme } },
          children,
        )

      const { result } = renderHook(() => useThemeMode(), { wrapper })
      result.current.setTheme("light")
      expect(mockSetTheme).toHaveBeenCalledWith("light")
    })

    it("should return default context values when no provider", () => {
      const { result } = renderHook(() => useThemeMode())
      expect(result.current.preference).toBe("dark")
      expect(result.current.resolvedTheme).toBe("dark")
    })
  })
})
