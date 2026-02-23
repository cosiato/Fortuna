import { describe, it, expect, vi, beforeEach } from "vitest"
import { invoke } from "@tauri-apps/api/core"
import { api } from "./api"
import type {
  Entity,
  Asset,
  Account,
  Snapshot,
  CashFlow,
  CreateEntityInput,
  UpdateEntityInput,
  CreateAssetInput,
  UpdateAssetInput,
  CreateAccountInput,
  UpdateAccountInput,
  CreateSnapshotInput,
  CreateCashFlowInput,
  UpdateCashFlowInput,
} from "@/types/database"

const mockInvoke = vi.mocked(invoke)

describe("api", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("entities", () => {
    const mockEntity: Entity = {
      id: 1,
      name: "Test Entity",
      type: "individual",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    }

    it("getAll should invoke get_all_entities", async () => {
      const entities = [mockEntity]
      mockInvoke.mockResolvedValueOnce(entities)

      const result = await api.entities.getAll()

      expect(mockInvoke).toHaveBeenCalledWith("get_all_entities")
      expect(result).toEqual(entities)
    })

    it("create should invoke create_entity with input", async () => {
      const input: CreateEntityInput = { name: "New Entity", type: "company" }
      mockInvoke.mockResolvedValueOnce({ ...mockEntity, ...input, id: 2 })

      const result = await api.entities.create(input)

      expect(mockInvoke).toHaveBeenCalledWith("create_entity", { input })
      expect(result.name).toBe("New Entity")
    })

    it("update should invoke update_entity with id and input", async () => {
      const input: UpdateEntityInput = { name: "Updated Entity" }
      mockInvoke.mockResolvedValueOnce({ ...mockEntity, name: "Updated Entity" })

      const result = await api.entities.update(1, input)

      expect(mockInvoke).toHaveBeenCalledWith("update_entity", { id: 1, input })
      expect(result.name).toBe("Updated Entity")
    })

    it("ensureIndividual should invoke ensure_individual_entity", async () => {
      mockInvoke.mockResolvedValueOnce(mockEntity)

      const result = await api.entities.ensureIndividual()

      expect(mockInvoke).toHaveBeenCalledWith("ensure_individual_entity")
      expect(result).toEqual(mockEntity)
    })

    it("deleteCascade should invoke delete_entity_cascade with id", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await api.entities.deleteCascade(1)

      expect(mockInvoke).toHaveBeenCalledWith("delete_entity_cascade", { id: 1 })
    })
  })

  describe("assets", () => {
    const mockAsset: Asset = {
      id: "asset-uuid-1",
      name: "Bitcoin",
      type: "crypto",
      symbol: "BTC",
      quantity: 1.5,
      manualPrice: null,
      currency: "USD",
      entityId: 0,
      stakedQuantity: null,
      withdrawalCooldownDays: null,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    }

    it("getAll should invoke get_all_assets", async () => {
      const assets = [mockAsset]
      mockInvoke.mockResolvedValueOnce(assets)

      const result = await api.assets.getAll()

      expect(mockInvoke).toHaveBeenCalledWith("get_all_assets")
      expect(result).toEqual(assets)
    })

    it("create should invoke create_asset with input", async () => {
      const input: CreateAssetInput = {
        name: "Ethereum",
        type: "crypto",
        symbol: "ETH",
        quantity: 10,
      }
      mockInvoke.mockResolvedValueOnce({ ...mockAsset, ...input, id: "asset-uuid-2" })

      const result = await api.assets.create(input)

      expect(mockInvoke).toHaveBeenCalledWith("create_asset", { input })
      expect(result.name).toBe("Ethereum")
    })

    it("update should invoke update_asset with id and input", async () => {
      const input: UpdateAssetInput = { quantity: 2.0 }
      mockInvoke.mockResolvedValueOnce({ ...mockAsset, quantity: 2.0 })

      const result = await api.assets.update("asset-uuid-1", input)

      expect(mockInvoke).toHaveBeenCalledWith("update_asset", { id: "asset-uuid-1", input })
      expect(result.quantity).toBe(2.0)
    })

    it("delete should invoke delete_asset with id", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await api.assets.delete("asset-uuid-1")

      expect(mockInvoke).toHaveBeenCalledWith("delete_asset", { id: "asset-uuid-1" })
    })
  })

  describe("accounts", () => {
    const mockAccount: Account = {
      id: "account-uuid-1",
      name: "Savings Account",
      balance: 10000,
      currency: "USD",
      countryCode: "US",
      entityId: 0,
      isLiquid: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    }

    it("getAll should invoke get_all_accounts", async () => {
      const accounts = [mockAccount]
      mockInvoke.mockResolvedValueOnce(accounts)

      const result = await api.accounts.getAll()

      expect(mockInvoke).toHaveBeenCalledWith("get_all_accounts")
      expect(result).toEqual(accounts)
    })

    it("create should invoke create_account with input", async () => {
      const input: CreateAccountInput = {
        name: "Checking Account",
        balance: 5000,
        countryCode: "US",
      }
      mockInvoke.mockResolvedValueOnce({ ...mockAccount, ...input, id: "account-uuid-2" })

      const result = await api.accounts.create(input)

      expect(mockInvoke).toHaveBeenCalledWith("create_account", { input })
      expect(result.name).toBe("Checking Account")
    })

    it("update should invoke update_account with id and input", async () => {
      const input: UpdateAccountInput = { balance: 15000 }
      mockInvoke.mockResolvedValueOnce({ ...mockAccount, balance: 15000 })

      const result = await api.accounts.update("account-uuid-1", input)

      expect(mockInvoke).toHaveBeenCalledWith("update_account", { id: "account-uuid-1", input })
      expect(result.balance).toBe(15000)
    })

    it("delete should invoke delete_account with id", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await api.accounts.delete("account-uuid-1")

      expect(mockInvoke).toHaveBeenCalledWith("delete_account", { id: "account-uuid-1" })
    })
  })

  describe("snapshots", () => {
    const mockSnapshot: Snapshot = {
      id: "snapshot-uuid-1",
      totalValue: 50000,
      currency: "USD",
      recordedAt: "2024-01-01T00:00:00Z",
    }

    it("getAll should invoke get_all_snapshots", async () => {
      const snapshots = [mockSnapshot]
      mockInvoke.mockResolvedValueOnce(snapshots)

      const result = await api.snapshots.getAll()

      expect(mockInvoke).toHaveBeenCalledWith("get_all_snapshots")
      expect(result).toEqual(snapshots)
    })

    it("create should invoke create_snapshot with input", async () => {
      const input: CreateSnapshotInput = { totalValue: 60000, currency: "USD" }
      mockInvoke.mockResolvedValueOnce({ ...mockSnapshot, ...input, id: "snapshot-uuid-2" })

      const result = await api.snapshots.create(input)

      expect(mockInvoke).toHaveBeenCalledWith("create_snapshot", { input })
      expect(result.totalValue).toBe(60000)
    })

    it("prune should invoke prune_old_snapshots and return count", async () => {
      mockInvoke.mockResolvedValueOnce(5)

      const result = await api.snapshots.prune()

      expect(mockInvoke).toHaveBeenCalledWith("prune_old_snapshots")
      expect(result).toBe(5)
    })
  })

  describe("cashFlows", () => {
    const mockCashFlow: CashFlow = {
      id: "cf-uuid-1",
      accountId: "account-uuid-1",
      name: "Monthly Salary",
      amount: 5000,
      flowType: "inflow",
      frequency: "monthly",
      category: "salary",
      startDate: "2024-01-01",
      endDate: null,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    }

    it("getAll should invoke get_all_cash_flows", async () => {
      const cashFlows = [mockCashFlow]
      mockInvoke.mockResolvedValueOnce(cashFlows)

      const result = await api.cashFlows.getAll()

      expect(mockInvoke).toHaveBeenCalledWith("get_all_cash_flows")
      expect(result).toEqual(cashFlows)
    })

    it("create should invoke create_cash_flow with input", async () => {
      const input: CreateCashFlowInput = {
        accountId: "account-uuid-1",
        name: "Rent Payment",
        amount: 1200,
        flowType: "outflow",
        frequency: "monthly",
        category: "rent",
        startDate: "2024-02-01",
      }
      mockInvoke.mockResolvedValueOnce({ ...mockCashFlow, ...input, id: "cf-uuid-2" })

      const result = await api.cashFlows.create(input)

      expect(mockInvoke).toHaveBeenCalledWith("create_cash_flow", { input })
      expect(result.name).toBe("Rent Payment")
    })

    it("update should invoke update_cash_flow with id and input", async () => {
      const input: UpdateCashFlowInput = { amount: 5500, name: "Updated Salary" }
      mockInvoke.mockResolvedValueOnce({ ...mockCashFlow, ...input })

      const result = await api.cashFlows.update("cf-uuid-1", input)

      expect(mockInvoke).toHaveBeenCalledWith("update_cash_flow", { id: "cf-uuid-1", input })
      expect(result.amount).toBe(5500)
      expect(result.name).toBe("Updated Salary")
    })

    it("delete should invoke delete_cash_flow with id", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await api.cashFlows.delete("cf-uuid-1")

      expect(mockInvoke).toHaveBeenCalledWith("delete_cash_flow", { id: "cf-uuid-1" })
    })
  })

  describe("settings", () => {
    it("setPin should invoke set_pin with pin", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await api.settings.setPin("1234")

      expect(mockInvoke).toHaveBeenCalledWith("set_pin", { pin: "1234" })
    })

    it("verifyPin should invoke verify_pin and return boolean", async () => {
      mockInvoke.mockResolvedValueOnce(true)

      const result = await api.settings.verifyPin("1234")

      expect(mockInvoke).toHaveBeenCalledWith("verify_pin", { pin: "1234" })
      expect(result).toBe(true)
    })

    it("verifyPin should return false for wrong pin", async () => {
      mockInvoke.mockResolvedValueOnce(false)

      const result = await api.settings.verifyPin("0000")

      expect(mockInvoke).toHaveBeenCalledWith("verify_pin", { pin: "0000" })
      expect(result).toBe(false)
    })

    it("removePin should invoke remove_pin with current pin", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await api.settings.removePin("1234")

      expect(mockInvoke).toHaveBeenCalledWith("remove_pin", { currentPin: "1234" })
    })

    it("isPinEnabled should invoke is_pin_enabled", async () => {
      mockInvoke.mockResolvedValueOnce(true)

      const result = await api.settings.isPinEnabled()

      expect(mockInvoke).toHaveBeenCalledWith("is_pin_enabled")
      expect(result).toBe(true)
    })

    it("resetAllData should invoke reset_all_data with pin", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await api.settings.resetAllData("1234")

      expect(mockInvoke).toHaveBeenCalledWith("reset_all_data", { pin: "1234" })
    })

    it("resetAllData should invoke reset_all_data with null when no pin", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await api.settings.resetAllData()

      expect(mockInvoke).toHaveBeenCalledWith("reset_all_data", { pin: null })
    })

    it("lockApp should invoke lock_app", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await api.settings.lockApp()

      expect(mockInvoke).toHaveBeenCalledWith("lock_app")
    })

    it("unlockApp should invoke unlock_app with pin and return boolean", async () => {
      mockInvoke.mockResolvedValueOnce(true)

      const result = await api.settings.unlockApp("1234")

      expect(mockInvoke).toHaveBeenCalledWith("unlock_app", { pin: "1234" })
      expect(result).toBe(true)
    })

    it("getCurrencyPreference should invoke get_currency_preference", async () => {
      mockInvoke.mockResolvedValueOnce("EUR")

      const result = await api.settings.getCurrencyPreference()

      expect(mockInvoke).toHaveBeenCalledWith("get_currency_preference")
      expect(result).toBe("EUR")
    })

    it("setCurrencyPreference should invoke set_currency_preference with currency", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await api.settings.setCurrencyPreference("EUR")

      expect(mockInvoke).toHaveBeenCalledWith("set_currency_preference", { currency: "EUR" })
    })

    it("getLocalePreference should invoke get_locale_preference", async () => {
      mockInvoke.mockResolvedValueOnce("fr")

      const result = await api.settings.getLocalePreference()

      expect(mockInvoke).toHaveBeenCalledWith("get_locale_preference")
      expect(result).toBe("fr")
    })

    it("setLocalePreference should invoke set_locale_preference with locale", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await api.settings.setLocalePreference("fr")

      expect(mockInvoke).toHaveBeenCalledWith("set_locale_preference", { locale: "fr" })
    })

    it("exportDatabase should invoke export_database with destination", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await api.settings.exportDatabase("/tmp/backup.db")

      expect(mockInvoke).toHaveBeenCalledWith("export_database", { destination: "/tmp/backup.db" })
    })

    it("importDatabase should invoke import_database with source and pin", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await api.settings.importDatabase("/tmp/backup.db", "1234")

      expect(mockInvoke).toHaveBeenCalledWith("import_database", {
        source: "/tmp/backup.db",
        pin: "1234",
      })
    })

    it("importDatabase should invoke import_database with null pin when no pin", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await api.settings.importDatabase("/tmp/backup.db")

      expect(mockInvoke).toHaveBeenCalledWith("import_database", {
        source: "/tmp/backup.db",
        pin: null,
      })
    })
  })

  describe("error handling", () => {
    it("should propagate errors from invoke", async () => {
      const error = new Error("Database connection failed")
      mockInvoke.mockRejectedValueOnce(error)

      await expect(api.entities.getAll()).rejects.toThrow("Database connection failed")
    })

    it("should propagate Tauri error strings", async () => {
      mockInvoke.mockRejectedValueOnce("Entity not found")

      await expect(api.entities.getAll()).rejects.toBe("Entity not found")
    })
  })
})
