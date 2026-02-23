import { createContext, useContext, useState, useEffect, useCallback } from "react"

export const HIDDEN_VALUE = "****"

const STORAGE_KEY = "fortuna_privacy_mode"

interface PrivacyModeContextValue {
  isPrivate: boolean
  togglePrivacy: () => void
}

export const PrivacyModeContext = createContext<PrivacyModeContextValue>({
  isPrivate: false,
  togglePrivacy: () => {},
})

function readPersistedState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

export function usePrivacyModeState(): PrivacyModeContextValue {
  const [isPrivate, setIsPrivate] = useState(readPersistedState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isPrivate))
    } catch {
      // Storage unavailable; privacy mode still works in-memory
    }
  }, [isPrivate])

  const togglePrivacy = useCallback(() => {
    setIsPrivate((prev) => !prev)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "h" || e.key === "H")) {
        e.preventDefault()
        togglePrivacy()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [togglePrivacy])

  return { isPrivate, togglePrivacy }
}

export function usePrivacyMode(): PrivacyModeContextValue {
  return useContext(PrivacyModeContext)
}

export function maskValue(isPrivate: boolean, formattedValue: string): string {
  return isPrivate ? HIDDEN_VALUE : formattedValue
}
