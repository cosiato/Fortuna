import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useSidebar } from "./useSidebar"

describe("useSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("should default to expanded when localStorage is empty", () => {
    const { result } = renderHook(() => useSidebar())
    expect(result.current.isCollapsed).toBe(false)
  })

  it("should read persisted collapsed state from localStorage", () => {
    localStorage.setItem("fortuna_sidebar_collapsed", "true")
    const { result } = renderHook(() => useSidebar())
    expect(result.current.isCollapsed).toBe(true)
  })

  it("should persist state to localStorage on change", () => {
    const { result } = renderHook(() => useSidebar())

    act(() => {
      result.current.collapse()
    })

    expect(localStorage.setItem).toHaveBeenCalledWith("fortuna_sidebar_collapsed", "true")
  })

  it("toggle should invert isCollapsed", () => {
    const { result } = renderHook(() => useSidebar())

    expect(result.current.isCollapsed).toBe(false)

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isCollapsed).toBe(true)

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isCollapsed).toBe(false)
  })

  it("expand should set isCollapsed to false", () => {
    localStorage.setItem("fortuna_sidebar_collapsed", "true")
    const { result } = renderHook(() => useSidebar())

    expect(result.current.isCollapsed).toBe(true)

    act(() => {
      result.current.expand()
    })

    expect(result.current.isCollapsed).toBe(false)
  })

  it("collapse should set isCollapsed to true", () => {
    const { result } = renderHook(() => useSidebar())

    act(() => {
      result.current.collapse()
    })

    expect(result.current.isCollapsed).toBe(true)
  })

  it("Cmd+B should toggle sidebar", () => {
    const { result } = renderHook(() => useSidebar())

    expect(result.current.isCollapsed).toBe(false)

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "b", metaKey: true }),
      )
    })

    expect(result.current.isCollapsed).toBe(true)
  })

  it("Ctrl+B should toggle sidebar", () => {
    const { result } = renderHook(() => useSidebar())

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "b", ctrlKey: true }),
      )
    })

    expect(result.current.isCollapsed).toBe(true)
  })

  it("Cmd+B should not toggle when input is focused", () => {
    const { result } = renderHook(() => useSidebar())

    const input = document.createElement("input")
    document.body.appendChild(input)
    input.focus()

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "b", metaKey: true }),
      )
    })

    expect(result.current.isCollapsed).toBe(false)

    document.body.removeChild(input)
  })
})
