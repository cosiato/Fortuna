import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { api } from "@/lib/api"

export type ThemePreference = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

const STORAGE_KEY = "fortuna_theme_preference"
const CYCLE_ORDER: ThemePreference[] = ["dark", "light", "system"]

interface ThemeModeContextValue {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemePreference) => void
}

export const ThemeModeContext = createContext<ThemeModeContextValue>({
  preference: "dark",
  resolvedTheme: "dark",
  setTheme: () => {},
})

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") return getSystemTheme()
  return preference
}

function applyThemeClass(resolved: ResolvedTheme) {
  if (resolved === "dark") {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }
}

export function useThemeModeState(initial: ThemePreference): ThemeModeContextValue {
  const [preference, setPreference] = useState<ThemePreference>(initial)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(initial))
  const initialPreferenceRef = useRef(initial)

  // Sync when initial preference changes (reconciliation with DB value from pre-check)
  useEffect(() => {
    if (initial !== initialPreferenceRef.current) {
      initialPreferenceRef.current = initial
      setPreference(initial)
    }
  }, [initial])

  // Apply dark class and mirror to localStorage whenever preference changes
  useEffect(() => {
    const resolved = resolveTheme(preference)
    setResolvedTheme(resolved)
    applyThemeClass(resolved)

    try {
      localStorage.setItem(STORAGE_KEY, preference)
    } catch {
      // Storage unavailable; theme still works in-memory
    }
  }, [preference])

  // Listen to OS preference changes when in "system" mode
  useEffect(() => {
    if (preference !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      const resolved = resolveTheme("system")
      setResolvedTheme(resolved)
      applyThemeClass(resolved)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [preference])

  const setTheme = useCallback((theme: ThemePreference) => {
    setPreference(theme)
    // Best-effort persist to DB
    api.settings.setThemePreference(theme).catch(() => {})
  }, [])

  // Keyboard shortcut: Cmd/Ctrl+Shift+T to cycle through modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "T") {
        e.preventDefault()
        setPreference((prev) => {
          const currentIndex = CYCLE_ORDER.indexOf(prev)
          const next = CYCLE_ORDER[(currentIndex + 1) % CYCLE_ORDER.length]
          api.settings.setThemePreference(next).catch(() => {})
          return next
        })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return { preference, resolvedTheme, setTheme }
}

export function useThemeMode(): ThemeModeContextValue {
  return useContext(ThemeModeContext)
}
