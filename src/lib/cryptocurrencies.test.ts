import { describe, it, expect } from "vitest"
import {
  CRYPTOCURRENCIES,
  CRYPTO_BY_ID,
  CRYPTO_BY_SYMBOL,
  getCryptoById,
  getCryptoBySymbol,
  searchCryptos,
} from "./cryptocurrencies"

describe("cryptocurrencies", () => {
  describe("CRYPTOCURRENCIES", () => {
    it("should be a non-empty array", () => {
      expect(CRYPTOCURRENCIES.length).toBeGreaterThan(0)
    })

    it("should contain Bitcoin and Ethereum", () => {
      const symbols = CRYPTOCURRENCIES.map((c) => c.symbol)
      expect(symbols).toContain("BTC")
      expect(symbols).toContain("ETH")
    })

    it("should have valid shape for each entry", () => {
      for (const crypto of CRYPTOCURRENCIES.slice(0, 10)) {
        expect(crypto).toHaveProperty("id")
        expect(crypto).toHaveProperty("symbol")
        expect(crypto).toHaveProperty("name")
        expect(crypto).toHaveProperty("logo")
      }
    })
  })

  describe("CRYPTO_BY_ID", () => {
    it("should have bitcoin entry", () => {
      expect(CRYPTO_BY_ID["bitcoin"]).toBeDefined()
      expect(CRYPTO_BY_ID["bitcoin"].symbol).toBe("BTC")
    })

    it("should have ethereum entry", () => {
      expect(CRYPTO_BY_ID["ethereum"]).toBeDefined()
      expect(CRYPTO_BY_ID["ethereum"].symbol).toBe("ETH")
    })
  })

  describe("CRYPTO_BY_SYMBOL", () => {
    it("should have BTC entry", () => {
      expect(CRYPTO_BY_SYMBOL["BTC"]).toBeDefined()
      expect(CRYPTO_BY_SYMBOL["BTC"].id).toBe("bitcoin")
    })

    it("should use uppercase keys", () => {
      expect(CRYPTO_BY_SYMBOL["BTC"]).toBeDefined()
      expect(CRYPTO_BY_SYMBOL["btc"]).toBeUndefined()
    })
  })

  describe("getCryptoById", () => {
    it("should return crypto for valid id", () => {
      const btc = getCryptoById("bitcoin")
      expect(btc).toBeDefined()
      expect(btc?.symbol).toBe("BTC")
      expect(btc?.name).toBe("Bitcoin")
    })

    it("should return undefined for invalid id", () => {
      expect(getCryptoById("nonexistent")).toBeUndefined()
    })
  })

  describe("getCryptoBySymbol", () => {
    it("should return crypto for valid symbol", () => {
      const eth = getCryptoBySymbol("ETH")
      expect(eth).toBeDefined()
      expect(eth?.id).toBe("ethereum")
      expect(eth?.name).toBe("Ethereum")
    })

    it("should be case-insensitive", () => {
      const eth = getCryptoBySymbol("eth")
      expect(eth).toBeDefined()
      expect(eth?.id).toBe("ethereum")
    })

    it("should return undefined for invalid symbol", () => {
      expect(getCryptoBySymbol("ZZZZZ")).toBeUndefined()
    })
  })

  describe("searchCryptos", () => {
    it("should find crypto by name", () => {
      const results = searchCryptos("Bitcoin")
      expect(results.length).toBeGreaterThan(0)
      expect(results.some((c) => c.symbol === "BTC")).toBe(true)
    })

    it("should find crypto by symbol", () => {
      const results = searchCryptos("ETH")
      expect(results.length).toBeGreaterThan(0)
      expect(results.some((c) => c.id === "ethereum")).toBe(true)
    })

    it("should find crypto by id", () => {
      const results = searchCryptos("solana")
      expect(results.length).toBeGreaterThan(0)
      expect(results.some((c) => c.symbol === "SOL")).toBe(true)
    })

    it("should be case-insensitive", () => {
      const lower = searchCryptos("bitcoin")
      const upper = searchCryptos("BITCOIN")
      expect(lower).toEqual(upper)
    })

    it("should return empty array for no matches", () => {
      const results = searchCryptos("zzzznonexistent")
      expect(results).toEqual([])
    })

    it("should return partial matches", () => {
      const results = searchCryptos("bit")
      expect(results.length).toBeGreaterThan(0)
    })
  })
})
