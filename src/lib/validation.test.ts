import { describe, it, expect } from "vitest"
import {
  createAssetSchema,
  createAccountSchema,
  createEntitySchema,
  createCashFlowSchema,
  validateSchema,
} from "./validation"

describe("validation", () => {
  describe("createAssetSchema", () => {
    const schema = createAssetSchema()

    it("should accept valid asset input", () => {
      const result = schema.safeParse({
        name: "Bitcoin",
        type: "crypto",
        symbol: "BTC",
        quantity: 1.5,
        manualPrice: null,
        currency: "USD",
      })
      expect(result.success).toBe(true)
    })

    it("should reject empty name", () => {
      const result = schema.safeParse({
        name: "",
        type: "stock",
        quantity: 10,
        currency: "USD",
      })
      expect(result.success).toBe(false)
    })

    it("should reject name longer than 255 characters", () => {
      const result = schema.safeParse({
        name: "a".repeat(256),
        type: "stock",
        quantity: 10,
        currency: "USD",
      })
      expect(result.success).toBe(false)
    })

    it("should reject negative quantity", () => {
      const result = schema.safeParse({
        name: "Apple",
        type: "stock",
        quantity: -1,
        currency: "USD",
      })
      expect(result.success).toBe(false)
    })

    it("should accept zero quantity", () => {
      const result = schema.safeParse({
        name: "Apple",
        type: "stock",
        quantity: 0,
        currency: "USD",
      })
      expect(result.success).toBe(true)
    })

    it("should reject invalid asset type", () => {
      const result = schema.safeParse({
        name: "Test",
        type: "invalid",
        quantity: 1,
        currency: "USD",
      })
      expect(result.success).toBe(false)
    })

    it("should accept all valid asset types", () => {
      const types = ["stock", "crypto", "real_estate", "cash", "other"]
      for (const type of types) {
        const result = schema.safeParse({
          name: "Test",
          type,
          quantity: 1,
          currency: "USD",
        })
        expect(result.success).toBe(true)
      }
    })

    it("should reject invalid currency code length", () => {
      const result = schema.safeParse({
        name: "Test",
        type: "stock",
        quantity: 1,
        currency: "US",
      })
      expect(result.success).toBe(false)
    })

    it("should accept optional symbol as null", () => {
      const result = schema.safeParse({
        name: "House",
        type: "real_estate",
        quantity: 1,
        manualPrice: 500000,
        currency: "USD",
        symbol: null,
      })
      expect(result.success).toBe(true)
    })

    it("should reject negative manual price", () => {
      const result = schema.safeParse({
        name: "House",
        type: "real_estate",
        quantity: 1,
        manualPrice: -100,
        currency: "USD",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("createAccountSchema", () => {
    const schema = createAccountSchema()

    it("should accept valid account input", () => {
      const result = schema.safeParse({
        name: "Savings",
        balance: 10000,
        currency: "USD",
        countryCode: "US",
      })
      expect(result.success).toBe(true)
    })

    it("should reject empty name", () => {
      const result = schema.safeParse({
        name: "",
        balance: 1000,
        currency: "USD",
        countryCode: "US",
      })
      expect(result.success).toBe(false)
    })

    it("should reject negative balance", () => {
      const result = schema.safeParse({
        name: "Savings",
        balance: -100,
        currency: "USD",
        countryCode: "US",
      })
      expect(result.success).toBe(false)
    })

    it("should reject invalid country code format", () => {
      const result = schema.safeParse({
        name: "Savings",
        balance: 1000,
        currency: "USD",
        countryCode: "us",
      })
      expect(result.success).toBe(false)
    })

    it("should reject country code with wrong length", () => {
      const result = schema.safeParse({
        name: "Savings",
        balance: 1000,
        currency: "USD",
        countryCode: "USA",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("createEntitySchema", () => {
    const schema = createEntitySchema()

    it("should accept valid entity input", () => {
      const result = schema.safeParse({ name: "My Company" })
      expect(result.success).toBe(true)
    })

    it("should reject empty name", () => {
      const result = schema.safeParse({ name: "" })
      expect(result.success).toBe(false)
    })

    it("should reject name longer than 255 characters", () => {
      const result = schema.safeParse({ name: "x".repeat(256) })
      expect(result.success).toBe(false)
    })
  })

  describe("createCashFlowSchema", () => {
    const schema = createCashFlowSchema()

    it("should accept valid cash flow input", () => {
      const result = schema.safeParse({
        name: "Salary",
        amount: 5000,
        flowType: "inflow",
        frequency: "monthly",
        category: "salary",
        startDate: "2024-01-01",
        endDate: null,
      })
      expect(result.success).toBe(true)
    })

    it("should reject zero amount", () => {
      const result = schema.safeParse({
        name: "Rent",
        amount: 0,
        flowType: "outflow",
        frequency: "monthly",
        category: "housing",
        startDate: "2024-01-01",
      })
      expect(result.success).toBe(false)
    })

    it("should reject negative amount", () => {
      const result = schema.safeParse({
        name: "Rent",
        amount: -500,
        flowType: "outflow",
        frequency: "monthly",
        category: "housing",
        startDate: "2024-01-01",
      })
      expect(result.success).toBe(false)
    })

    it("should reject invalid flow type", () => {
      const result = schema.safeParse({
        name: "Test",
        amount: 100,
        flowType: "transfer",
        frequency: "monthly",
        category: "other",
        startDate: "2024-01-01",
      })
      expect(result.success).toBe(false)
    })

    it("should accept all valid frequencies", () => {
      const frequencies = [
        "none",
        "daily",
        "weekly",
        "monthly",
        "quarterly",
        "trimester",
        "semester",
        "yearly",
      ]
      for (const frequency of frequencies) {
        const result = schema.safeParse({
          name: "Test",
          amount: 100,
          flowType: "inflow",
          frequency,
          category: "other",
          startDate: "2024-01-01",
        })
        expect(result.success).toBe(true)
      }
    })

    it("should reject end date before start date", () => {
      const result = schema.safeParse({
        name: "Test",
        amount: 100,
        flowType: "inflow",
        frequency: "monthly",
        category: "other",
        startDate: "2024-06-01",
        endDate: "2024-01-01",
      })
      expect(result.success).toBe(false)
    })

    it("should accept end date equal to start date", () => {
      const result = schema.safeParse({
        name: "Test",
        amount: 100,
        flowType: "inflow",
        frequency: "none",
        category: "other",
        startDate: "2024-01-01",
        endDate: "2024-01-01",
      })
      expect(result.success).toBe(true)
    })

    it("should reject empty category", () => {
      const result = schema.safeParse({
        name: "Test",
        amount: 100,
        flowType: "inflow",
        frequency: "monthly",
        category: "",
        startDate: "2024-01-01",
      })
      expect(result.success).toBe(false)
    })

    it("should reject empty start date", () => {
      const result = schema.safeParse({
        name: "Test",
        amount: 100,
        flowType: "inflow",
        frequency: "monthly",
        category: "other",
        startDate: "",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("validateSchema", () => {
    it("should return success with parsed data for valid input", () => {
      const schema = createEntitySchema()
      const result = validateSchema(schema, { name: "Test" })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ name: "Test" })
      }
    })

    it("should return error with message for invalid input", () => {
      const schema = createEntitySchema()
      const result = validateSchema(schema, { name: "" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(typeof result.error).toBe("string")
        expect(result.error.length).toBeGreaterThan(0)
      }
    })

    it("should return first error message when multiple fields fail", () => {
      const schema = createAssetSchema()
      const result = validateSchema(schema, {})
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(typeof result.error).toBe("string")
      }
    })
  })
})
