import { invoke } from '@tauri-apps/api/core';
import type {
  Asset,
  Account,
  Entity,
  Snapshot,
  CreateAssetInput,
  UpdateAssetInput,
  CreateAccountInput,
  UpdateAccountInput,
  CreateEntityInput,
  UpdateEntityInput,
  CreateSnapshotInput,
} from '@/types/database';

export const api = {
  entities: {
    getAll: () => invoke<Entity[]>('get_all_entities'),
    getById: (id: number) => invoke<Entity | null>('get_entity_by_id', { id }),
    create: (input: CreateEntityInput) => invoke<Entity>('create_entity', { input }),
    update: (id: number, input: UpdateEntityInput) =>
      invoke<Entity>('update_entity', { id, input }),
    delete: (id: number) => invoke<void>('delete_entity', { id }),
    ensureIndividual: () => invoke<Entity>('ensure_individual_entity'),
  },

  assets: {
    getAll: () => invoke<Asset[]>('get_all_assets'),
    getByEntity: (entityId: number) => invoke<Asset[]>('get_assets_by_entity', { entityId }),
    getById: (id: string) => invoke<Asset | null>('get_asset_by_id', { id }),
    create: (input: CreateAssetInput) => invoke<Asset>('create_asset', { input }),
    update: (id: string, input: UpdateAssetInput) =>
      invoke<Asset>('update_asset', { id, input }),
    delete: (id: string) => invoke<void>('delete_asset', { id }),
  },

  accounts: {
    getAll: () => invoke<Account[]>('get_all_accounts'),
    getByEntity: (entityId: number) => invoke<Account[]>('get_accounts_by_entity', { entityId }),
    getById: (id: string) => invoke<Account | null>('get_account_by_id', { id }),
    create: (input: CreateAccountInput) => invoke<Account>('create_account', { input }),
    update: (id: string, input: UpdateAccountInput) =>
      invoke<Account>('update_account', { id, input }),
    delete: (id: string) => invoke<void>('delete_account', { id }),
  },

  snapshots: {
    getAll: () => invoke<Snapshot[]>('get_all_snapshots'),
    getToday: () => invoke<Snapshot | null>('get_today_snapshot'),
    getLatest: () => invoke<Snapshot | null>('get_latest_snapshot'),
    create: (input: CreateSnapshotInput) => invoke<Snapshot>('create_snapshot', { input }),
  },

  settings: {
    setPin: (pin: string) => invoke<void>('set_pin', { pin }),
    verifyPin: (pin: string) => invoke<boolean>('verify_pin', { pin }),
    removePin: (currentPin: string) => invoke<void>('remove_pin', { currentPin }),
    isPinEnabled: () => invoke<boolean>('is_pin_enabled'),
  },
};
