import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"
import PrivacyToggle from "./PrivacyToggle"
import { PrivacyModeContext } from "@/hooks/usePrivacyMode"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock("@iconify/react", () => ({
  Icon: ({ icon, ...props }: { icon: string; [key: string]: unknown }) =>
    React.createElement("span", { "data-testid": "icon", "data-icon": icon, ...props }),
}))

describe("PrivacyToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render eye-linear icon when not private", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        PrivacyModeContext.Provider,
        { value: { isPrivate: false, togglePrivacy: vi.fn() } },
        children,
      )

    render(React.createElement(PrivacyToggle), { wrapper })

    const icon = screen.getByTestId("icon")
    expect(icon.getAttribute("data-icon")).toBe("solar:eye-linear")
  })

  it("should render eye-closed-linear icon when private", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        PrivacyModeContext.Provider,
        { value: { isPrivate: true, togglePrivacy: vi.fn() } },
        children,
      )

    render(React.createElement(PrivacyToggle), { wrapper })

    const icon = screen.getByTestId("icon")
    expect(icon.getAttribute("data-icon")).toBe("solar:eye-closed-linear")
  })

  it("should call togglePrivacy on click", () => {
    const mockToggle = vi.fn()
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        PrivacyModeContext.Provider,
        { value: { isPrivate: false, togglePrivacy: mockToggle } },
        children,
      )

    render(React.createElement(PrivacyToggle), { wrapper })

    const button = screen.getByRole("button")
    fireEvent.click(button)
    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  it("should have accessible aria-label and aria-pressed=false when visible", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        PrivacyModeContext.Provider,
        { value: { isPrivate: false, togglePrivacy: vi.fn() } },
        children,
      )

    render(React.createElement(PrivacyToggle), { wrapper })

    const button = screen.getByRole("button")
    expect(button.getAttribute("aria-label")).toBe("hideAmounts")
    expect(button.getAttribute("aria-pressed")).toBe("false")
  })

  it("should have accessible aria-label and aria-pressed=true when hidden", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        PrivacyModeContext.Provider,
        { value: { isPrivate: true, togglePrivacy: vi.fn() } },
        children,
      )

    render(React.createElement(PrivacyToggle), { wrapper })

    const button = screen.getByRole("button")
    expect(button.getAttribute("aria-label")).toBe("showAmounts")
    expect(button.getAttribute("aria-pressed")).toBe("true")
  })
})
