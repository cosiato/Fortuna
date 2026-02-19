import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/i18n", () => ({
  default: { language: "en" },
}))

import {
  ASSET_CATEGORY_KEYS,
  CATEGORY_BADGE_CONFIG,
  formatCompactValue,
} from "./dashboardUtils"

describe("dashboardUtils", () => {
  describe("ASSET_CATEGORY_KEYS", () => {
    it("should have exactly 4 items", () => {
      expect(ASSET_CATEGORY_KEYS).toHaveLength(4)
    })

    it("should contain stock, crypto, real_estate, other", () => {
      expect(ASSET_CATEGORY_KEYS).toEqual(["stock", "crypto", "real_estate", "other"])
    })
  })

  describe("CATEGORY_BADGE_CONFIG", () => {
    it("should have an entry for each ASSET_CATEGORY_KEY", () => {
      for (const key of ASSET_CATEGORY_KEYS) {
        expect(CATEGORY_BADGE_CONFIG[key]).toBeDefined()
      }
    })

    it("should have bg, text, border, icon string properties on each entry", () => {
      for (const key of ASSET_CATEGORY_KEYS) {
        const config = CATEGORY_BADGE_CONFIG[key]
        expect(typeof config.bg).toBe("string")
        expect(typeof config.text).toBe("string")
        expect(typeof config.border).toBe("string")
        expect(typeof config.icon).toBe("string")
        expect(config.bg.length).toBeGreaterThan(0)
        expect(config.text.length).toBeGreaterThan(0)
        expect(config.border.length).toBeGreaterThan(0)
        expect(config.icon.length).toBeGreaterThan(0)
      }
    })
  })

  describe("formatCompactValue", () => {
    it("should format BTC >= 1 with 2 decimal places", () => {
      const result = formatCompactValue(1.23456789, "BTC")
      expect(result).toBe("1.23 BTC")
    })

    it("should format BTC exactly 1 with 2 decimal places", () => {
      const result = formatCompactValue(1, "BTC")
      expect(result).toBe("1.00 BTC")
    })

    it("should format BTC < 1 with 4 decimal places", () => {
      const result = formatCompactValue(0.56789, "BTC")
      expect(result).toBe("0.5679 BTC")
    })

    it("should format very small BTC with 4 decimal places", () => {
      const result = formatCompactValue(0.00012345, "BTC")
      expect(result).toBe("0.0001 BTC")
    })

    it("should format USD as a compact currency string", () => {
      const result = formatCompactValue(1500, "USD")
      // Intl compact notation for en-US: "$1.5K"
      expect(result).toContain("$")
      expect(result).toMatch(/1\.5/)
    })

    it("should format large USD values with compact notation", () => {
      const result = formatCompactValue(2500000, "USD")
      expect(result).toContain("$")
      expect(result).toMatch(/2\.5/)
    })

    it("should format EUR as a compact currency string", () => {
      const result = formatCompactValue(1500, "EUR")
      // Intl compact notation for en-US with EUR
      expect(result).toMatch(/1\.5/)
      expect(result).toMatch(/EUR|\u20AC/)
    })

    it("should format large EUR values with compact notation", () => {
      const result = formatCompactValue(3000000, "EUR")
      expect(result).toMatch(/3/)
      expect(result).toMatch(/EUR|\u20AC/)
    })
  })
})
