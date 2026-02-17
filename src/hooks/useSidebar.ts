import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "fortuna_sidebar_collapsed"

function readPersistedState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(readPersistedState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed))
  }, [isCollapsed])

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  const expand = useCallback(() => {
    setIsCollapsed(false)
  }, [])

  const collapse = useCallback(() => {
    setIsCollapsed(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault()
        toggle()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggle])

  return { isCollapsed, toggle, expand, collapse }
}
