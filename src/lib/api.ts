import { invoke } from "@tauri-apps/api/core"
import type {
  Asset,
  Account,
  Entity,
  Snapshot,
  CashFlow,
  CreateAssetInput,
  UpdateAssetInput,
  CreateAccountInput,
  UpdateAccountInput,
  CreateEntityInput,
  UpdateEntityInput,
  CreateSnapshotInput,
  CreateCashFlowInput,
  UpdateCashFlowInput,
} from "@/types/database"

export const api = {
  entities: {
    getAll: () => invoke<Entity[]>("get_all_entities"),
    create: (input: CreateEntityInput) => invoke<Entity>("create_entity", { input }),
    update: (id: number, input: UpdateEntityInput) =>
      invoke<Entity>("update_entity", { id, input }),
    deleteCascade: (id: number) => invoke<void>("delete_entity_cascade", { id }),
    ensureIndividual: () => invoke<Entity>("ensure_individual_entity"),
  },

  assets: {
    getAll: () => invoke<Asset[]>("get_all_assets"),
    create: (input: CreateAssetInput) => invoke<Asset>("create_asset", { input }),
    update: (id: string, input: UpdateAssetInput) => invoke<Asset>("update_asset", { id, input }),
    delete: (id: string) => invoke<void>("delete_asset", { id }),
  },

  accounts: {
    getAll: () => invoke<Account[]>("get_all_accounts"),
    create: (input: CreateAccountInput) => invoke<Account>("create_account", { input }),
    update: (id: string, input: UpdateAccountInput) =>
      invoke<Account>("update_account", { id, input }),
    delete: (id: string) => invoke<void>("delete_account", { id }),
  },

  snapshots: {
    getAll: () => invoke<Snapshot[]>("get_all_snapshots"),
    create: (input: CreateSnapshotInput) => invoke<Snapshot>("create_snapshot", { input }),
    prune: () => invoke<number>("prune_old_snapshots"),
  },

  cashFlows: {
    getAll: () => invoke<CashFlow[]>("get_all_cash_flows"),
    create: (input: CreateCashFlowInput) => invoke<CashFlow>("create_cash_flow", { input }),
    update: (id: string, input: UpdateCashFlowInput) =>
      invoke<CashFlow>("update_cash_flow", { id, input }),
    delete: (id: string) => invoke<void>("delete_cash_flow", { id }),
  },

  settings: {
    setPin: (pin: string) => invoke<void>("set_pin", { pin }),
    verifyPin: (pin: string) => invoke<boolean>("verify_pin", { pin }),
    removePin: (currentPin: string) => invoke<void>("remove_pin", { currentPin }),
    isPinEnabled: () => invoke<boolean>("is_pin_enabled"),
    resetAllData: (pin?: string) => invoke<void>("reset_all_data", { pin: pin || null }),
    lockApp: () => invoke<void>("lock_app"),
    unlockApp: (pin: string) => invoke<boolean>("unlock_app", { pin }),
    getCurrencyPreference: () => invoke<string>("get_currency_preference"),
    setCurrencyPreference: (currency: string) =>
      invoke<void>("set_currency_preference", { currency }),
    getLocalePreference: () => invoke<string>("get_locale_preference"),
    setLocalePreference: (locale: string) => invoke<void>("set_locale_preference", { locale }),
  },
}
