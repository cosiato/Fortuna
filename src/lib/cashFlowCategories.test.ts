import { describe, it, expect } from "vitest"
import { CASH_FLOW_CATEGORIES, getCategoriesByType } from "./cashFlowCategories"

describe("CASH_FLOW_CATEGORIES", () => {
  it("contains all expected inflow categories", () => {
    const inflowKeys = Object.entries(CASH_FLOW_CATEGORIES)
      .filter(([, info]) => info.type === "inflow")
      .map(([key]) => key)

    expect(inflowKeys).toContain("salary")
    expect(inflowKeys).toContain("freelance")
    expect(inflowKeys).toContain("investment_income")
    expect(inflowKeys).toContain("rental_income")
    expect(inflowKeys).toContain("other_income")
    expect(inflowKeys).toHaveLength(5)
  })

  it("contains all expected outflow categories", () => {
    const outflowKeys = Object.entries(CASH_FLOW_CATEGORIES)
      .filter(([, info]) => info.type === "outflow")
      .map(([key]) => key)

    expect(outflowKeys).toContain("rent")
    expect(outflowKeys).toContain("mortgage")
    expect(outflowKeys).toContain("subscription")
    expect(outflowKeys).toContain("utilities")
    expect(outflowKeys).toContain("insurance")
    expect(outflowKeys).toContain("groceries")
    expect(outflowKeys).toContain("transport")
    expect(outflowKeys).toContain("entertainment")
    expect(outflowKeys).toContain("savings_transfer")
    expect(outflowKeys).toContain("other_expense")
    expect(outflowKeys).toHaveLength(10)
  })

  it("every category has a label and icon", () => {
    for (const [, info] of Object.entries(CASH_FLOW_CATEGORIES)) {
      expect(info.labelKey).toBeTruthy()
      expect(info.icon).toBeTruthy()
      expect(info.icon).toContain("solar:")
    }
  })
})

describe("getCategoriesByType", () => {
  it("returns only inflow categories when type is inflow", () => {
    const result = getCategoriesByType("inflow")
    expect(result).toHaveLength(5)
    for (const cat of result) {
      expect(CASH_FLOW_CATEGORIES[cat.key].type).toBe("inflow")
    }
  })

  it("returns only outflow categories when type is outflow", () => {
    const result = getCategoriesByType("outflow")
    expect(result).toHaveLength(10)
    for (const cat of result) {
      expect(CASH_FLOW_CATEGORIES[cat.key].type).toBe("outflow")
    }
  })

  it("returns objects with key, label, and icon", () => {
    const result = getCategoriesByType("inflow")
    for (const cat of result) {
      expect(cat).toHaveProperty("key")
      expect(cat).toHaveProperty("label")
      expect(cat).toHaveProperty("icon")
    }
  })
})
