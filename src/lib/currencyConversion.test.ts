import { describe, it, expect } from "vitest"
import {
  getAssetValueInUsd,
  toUsd,
  fromUsd,
  toDisplayCurrency,
} from "./currencyConversion"
import type { PriceResult } from "./prices"

const rates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  BTC: 0.000024,
}

const prices: Record<string, PriceResult> = {
  aapl: { symbol: "AAPL", price: 175.5, currency: "USD" },
  AAPL: { symbol: "AAPL", price: 175.5, currency: "USD" },
  "ric.pa": { symbol: "RIC.PA", price: 50, currency: "EUR" },
  "RIC.PA": { symbol: "RIC.PA", price: 50, currency: "EUR" },
  btc: { symbol: "BTC", price: 42000, currency: "USD" },
  BTC: { symbol: "BTC", price: 42000, currency: "USD" },
}

describe("currencyConversion", () => {
  describe("toUsd", () => {
    it("should return amount unchanged for USD", () => {
      expect(toUsd(100, "USD", rates)).toBe(100)
    })

    it("should convert EUR to USD", () => {
      expect(toUsd(92, "EUR", rates)).toBeCloseTo(100, 0)
    })

    it("should convert GBP to USD", () => {
      expect(toUsd(79, "GBP", rates)).toBeCloseTo(100, 0)
    })

    it("should return amount unchanged for unknown currency", () => {
      expect(toUsd(100, "XYZ", rates)).toBe(100)
    })
  })

  describe("fromUsd", () => {
    it("should return amount unchanged for USD", () => {
      expect(fromUsd(100, "USD", rates)).toBe(100)
    })

    it("should convert USD to EUR", () => {
      expect(fromUsd(100, "EUR", rates)).toBeCloseTo(92, 0)
    })

    it("should convert USD to JPY", () => {
      expect(fromUsd(100, "JPY", rates)).toBeCloseTo(14950, 0)
    })

    it("should return amount unchanged for unknown currency", () => {
      expect(fromUsd(100, "XYZ", rates)).toBe(100)
    })
  })

  describe("toDisplayCurrency", () => {
    it("should convert EUR to JPY via USD", () => {
      const result = toDisplayCurrency(100, "EUR", "JPY", rates)
      const expected = (100 / 0.92) * 149.5
      expect(result).toBeCloseTo(expected, 0)
    })

    it("should return same value when source equals display", () => {
      expect(toDisplayCurrency(100, "EUR", "EUR", rates)).toBe(100)
    })

    it("should convert USD to EUR", () => {
      expect(toDisplayCurrency(100, "USD", "EUR", rates)).toBeCloseTo(92, 0)
    })
  })

  describe("getAssetValueInUsd", () => {
    it("should use manual price for manual-priced asset", () => {
      const asset = {
        symbol: null,
        quantity: 10,
        manualPrice: 50,
        currency: "EUR",
      }
      // 10 * 50 = 500 EUR -> 500 / 0.92 ~ 543.48 USD
      const result = getAssetValueInUsd(asset, prices, rates)
      expect(result).toBeCloseTo(500 / 0.92, 1)
    })

    it("should use market price for stock asset", () => {
      const asset = {
        symbol: "AAPL",
        quantity: 2,
        manualPrice: null,
        currency: "USD",
      }
      // 2 * 175.5 = 351 USD
      expect(getAssetValueInUsd(asset, prices, rates)).toBeCloseTo(351, 1)
    })

    it("should convert market price currency to USD", () => {
      const asset = {
        symbol: "RIC.PA",
        quantity: 3,
        manualPrice: null,
        currency: "EUR",
      }
      // 3 * 50 = 150 EUR -> 150 / 0.92 ~ 163.04 USD
      const result = getAssetValueInUsd(asset, prices, rates)
      expect(result).toBeCloseTo(150 / 0.92, 1)
    })

    it("should return 0 for asset with no price data", () => {
      const asset = {
        symbol: "UNKNOWN",
        quantity: 5,
        manualPrice: null,
        currency: "USD",
      }
      expect(getAssetValueInUsd(asset, prices, rates)).toBe(0)
    })

    it("should return 0 when symbol is null and no manual price", () => {
      const asset = {
        symbol: null,
        quantity: 5,
        manualPrice: null,
        currency: "USD",
      }
      expect(getAssetValueInUsd(asset, prices, rates)).toBe(0)
    })
  })
})
