import { describe, it, expect } from "vitest"
import { COUNTRIES, getCountryByCode, getCountryFlag, getCountryName } from "./countries"

describe("countries", () => {
  describe("COUNTRIES", () => {
    it("should be a non-empty array", () => {
      expect(COUNTRIES.length).toBeGreaterThan(0)
    })

    it("should contain expected countries", () => {
      const codes = COUNTRIES.map((c) => c.code)
      expect(codes).toContain("US")
      expect(codes).toContain("FR")
      expect(codes).toContain("JP")
      expect(codes).toContain("GB")
    })

    it("should have valid shape for each country", () => {
      for (const country of COUNTRIES) {
        expect(country).toHaveProperty("code")
        expect(country).toHaveProperty("name")
        expect(country).toHaveProperty("flag")
        expect(country.code).toBeTruthy()
        expect(country.name).toBeTruthy()
        expect(country.flag).toBeTruthy()
      }
    })

    it("should have unique country codes", () => {
      const codes = COUNTRIES.map((c) => c.code)
      const uniqueCodes = new Set(codes)
      expect(uniqueCodes.size).toBe(codes.length)
    })
  })

  describe("getCountryByCode", () => {
    it("should return country for valid code", () => {
      const us = getCountryByCode("US")
      expect(us).toBeDefined()
      expect(us?.name).toBe("United States")
      expect(us?.code).toBe("US")
    })

    it("should return country for lowercase code", () => {
      const fr = getCountryByCode("fr")
      expect(fr).toBeDefined()
      expect(fr?.name).toBe("France")
    })

    it("should return undefined for invalid code", () => {
      expect(getCountryByCode("XX")).toBeUndefined()
    })

    it("should return undefined for empty string", () => {
      expect(getCountryByCode("")).toBeUndefined()
    })
  })

  describe("getCountryFlag", () => {
    it("should return flag emoji for valid code", () => {
      const flag = getCountryFlag("US")
      expect(flag).toBeTruthy()
      expect(flag.length).toBeGreaterThan(0)
    })

    it("should return empty string for invalid code", () => {
      expect(getCountryFlag("XX")).toBe("")
    })
  })

  describe("getCountryName", () => {
    it("should return country name for valid code", () => {
      expect(getCountryName("US")).toBe("United States")
    })

    it("should return country name case-insensitively", () => {
      expect(getCountryName("jp")).toBe("Japan")
    })

    it("should return the code itself for invalid code", () => {
      expect(getCountryName("XX")).toBe("XX")
    })
  })
})
