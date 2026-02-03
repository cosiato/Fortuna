import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { api } from './api';
import type {
  Entity,
  Asset,
  Account,
  Snapshot,
  CreateEntityInput,
  UpdateEntityInput,
  CreateAssetInput,
  UpdateAssetInput,
  CreateAccountInput,
  UpdateAccountInput,
  CreateSnapshotInput,
} from '@/types/database';

const mockInvoke = vi.mocked(invoke);

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('entities', () => {
    const mockEntity: Entity = {
      id: 1,
      name: 'Test Entity',
      type: 'individual',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('getAll should invoke get_all_entities', async () => {
      const entities = [mockEntity];
      mockInvoke.mockResolvedValueOnce(entities);

      const result = await api.entities.getAll();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_entities');
      expect(result).toEqual(entities);
    });

    it('getById should invoke get_entity_by_id with correct params', async () => {
      mockInvoke.mockResolvedValueOnce(mockEntity);

      const result = await api.entities.getById(1);

      expect(mockInvoke).toHaveBeenCalledWith('get_entity_by_id', { id: 1 });
      expect(result).toEqual(mockEntity);
    });

    it('getById should return null for non-existent entity', async () => {
      mockInvoke.mockResolvedValueOnce(null);

      const result = await api.entities.getById(999);

      expect(mockInvoke).toHaveBeenCalledWith('get_entity_by_id', { id: 999 });
      expect(result).toBeNull();
    });

    it('create should invoke create_entity with input', async () => {
      const input: CreateEntityInput = { name: 'New Entity', type: 'company' };
      mockInvoke.mockResolvedValueOnce({ ...mockEntity, ...input, id: 2 });

      const result = await api.entities.create(input);

      expect(mockInvoke).toHaveBeenCalledWith('create_entity', { input });
      expect(result.name).toBe('New Entity');
    });

    it('update should invoke update_entity with id and input', async () => {
      const input: UpdateEntityInput = { name: 'Updated Entity' };
      mockInvoke.mockResolvedValueOnce({ ...mockEntity, name: 'Updated Entity' });

      const result = await api.entities.update(1, input);

      expect(mockInvoke).toHaveBeenCalledWith('update_entity', { id: 1, input });
      expect(result.name).toBe('Updated Entity');
    });

    it('delete should invoke delete_entity with id', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await api.entities.delete(1);

      expect(mockInvoke).toHaveBeenCalledWith('delete_entity', { id: 1 });
    });

    it('ensureIndividual should invoke ensure_individual_entity', async () => {
      mockInvoke.mockResolvedValueOnce(mockEntity);

      const result = await api.entities.ensureIndividual();

      expect(mockInvoke).toHaveBeenCalledWith('ensure_individual_entity');
      expect(result).toEqual(mockEntity);
    });
  });

  describe('assets', () => {
    const mockAsset: Asset = {
      id: 'asset-uuid-1',
      name: 'Bitcoin',
      type: 'crypto',
      symbol: 'BTC',
      quantity: 1.5,
      manualPrice: null,
      currency: 'USD',
      entityId: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('getAll should invoke get_all_assets', async () => {
      const assets = [mockAsset];
      mockInvoke.mockResolvedValueOnce(assets);

      const result = await api.assets.getAll();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_assets');
      expect(result).toEqual(assets);
    });

    it('getByEntity should invoke get_assets_by_entity with entityId', async () => {
      const assets = [mockAsset];
      mockInvoke.mockResolvedValueOnce(assets);

      const result = await api.assets.getByEntity(0);

      expect(mockInvoke).toHaveBeenCalledWith('get_assets_by_entity', { entityId: 0 });
      expect(result).toEqual(assets);
    });

    it('getById should invoke get_asset_by_id with id', async () => {
      mockInvoke.mockResolvedValueOnce(mockAsset);

      const result = await api.assets.getById('asset-uuid-1');

      expect(mockInvoke).toHaveBeenCalledWith('get_asset_by_id', { id: 'asset-uuid-1' });
      expect(result).toEqual(mockAsset);
    });

    it('create should invoke create_asset with input', async () => {
      const input: CreateAssetInput = {
        name: 'Ethereum',
        type: 'crypto',
        symbol: 'ETH',
        quantity: 10,
      };
      mockInvoke.mockResolvedValueOnce({ ...mockAsset, ...input, id: 'asset-uuid-2' });

      const result = await api.assets.create(input);

      expect(mockInvoke).toHaveBeenCalledWith('create_asset', { input });
      expect(result.name).toBe('Ethereum');
    });

    it('update should invoke update_asset with id and input', async () => {
      const input: UpdateAssetInput = { quantity: 2.0 };
      mockInvoke.mockResolvedValueOnce({ ...mockAsset, quantity: 2.0 });

      const result = await api.assets.update('asset-uuid-1', input);

      expect(mockInvoke).toHaveBeenCalledWith('update_asset', { id: 'asset-uuid-1', input });
      expect(result.quantity).toBe(2.0);
    });

    it('delete should invoke delete_asset with id', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await api.assets.delete('asset-uuid-1');

      expect(mockInvoke).toHaveBeenCalledWith('delete_asset', { id: 'asset-uuid-1' });
    });
  });

  describe('accounts', () => {
    const mockAccount: Account = {
      id: 'account-uuid-1',
      name: 'Savings Account',
      balance: 10000,
      currency: 'USD',
      countryCode: 'US',
      entityId: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('getAll should invoke get_all_accounts', async () => {
      const accounts = [mockAccount];
      mockInvoke.mockResolvedValueOnce(accounts);

      const result = await api.accounts.getAll();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_accounts');
      expect(result).toEqual(accounts);
    });

    it('getByEntity should invoke get_accounts_by_entity with entityId', async () => {
      const accounts = [mockAccount];
      mockInvoke.mockResolvedValueOnce(accounts);

      const result = await api.accounts.getByEntity(0);

      expect(mockInvoke).toHaveBeenCalledWith('get_accounts_by_entity', { entityId: 0 });
      expect(result).toEqual(accounts);
    });

    it('getById should invoke get_account_by_id with id', async () => {
      mockInvoke.mockResolvedValueOnce(mockAccount);

      const result = await api.accounts.getById('account-uuid-1');

      expect(mockInvoke).toHaveBeenCalledWith('get_account_by_id', { id: 'account-uuid-1' });
      expect(result).toEqual(mockAccount);
    });

    it('create should invoke create_account with input', async () => {
      const input: CreateAccountInput = {
        name: 'Checking Account',
        balance: 5000,
        countryCode: 'US',
      };
      mockInvoke.mockResolvedValueOnce({ ...mockAccount, ...input, id: 'account-uuid-2' });

      const result = await api.accounts.create(input);

      expect(mockInvoke).toHaveBeenCalledWith('create_account', { input });
      expect(result.name).toBe('Checking Account');
    });

    it('update should invoke update_account with id and input', async () => {
      const input: UpdateAccountInput = { balance: 15000 };
      mockInvoke.mockResolvedValueOnce({ ...mockAccount, balance: 15000 });

      const result = await api.accounts.update('account-uuid-1', input);

      expect(mockInvoke).toHaveBeenCalledWith('update_account', { id: 'account-uuid-1', input });
      expect(result.balance).toBe(15000);
    });

    it('delete should invoke delete_account with id', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await api.accounts.delete('account-uuid-1');

      expect(mockInvoke).toHaveBeenCalledWith('delete_account', { id: 'account-uuid-1' });
    });
  });

  describe('snapshots', () => {
    const mockSnapshot: Snapshot = {
      id: 'snapshot-uuid-1',
      totalValue: 50000,
      currency: 'USD',
      recordedAt: '2024-01-01T00:00:00Z',
    };

    it('getAll should invoke get_all_snapshots', async () => {
      const snapshots = [mockSnapshot];
      mockInvoke.mockResolvedValueOnce(snapshots);

      const result = await api.snapshots.getAll();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_snapshots');
      expect(result).toEqual(snapshots);
    });

    it('getToday should invoke get_today_snapshot', async () => {
      mockInvoke.mockResolvedValueOnce(mockSnapshot);

      const result = await api.snapshots.getToday();

      expect(mockInvoke).toHaveBeenCalledWith('get_today_snapshot');
      expect(result).toEqual(mockSnapshot);
    });

    it('getToday should return null when no snapshot exists', async () => {
      mockInvoke.mockResolvedValueOnce(null);

      const result = await api.snapshots.getToday();

      expect(mockInvoke).toHaveBeenCalledWith('get_today_snapshot');
      expect(result).toBeNull();
    });

    it('getLatest should invoke get_latest_snapshot', async () => {
      mockInvoke.mockResolvedValueOnce(mockSnapshot);

      const result = await api.snapshots.getLatest();

      expect(mockInvoke).toHaveBeenCalledWith('get_latest_snapshot');
      expect(result).toEqual(mockSnapshot);
    });

    it('create should invoke create_snapshot with input', async () => {
      const input: CreateSnapshotInput = { totalValue: 60000, currency: 'USD' };
      mockInvoke.mockResolvedValueOnce({ ...mockSnapshot, ...input, id: 'snapshot-uuid-2' });

      const result = await api.snapshots.create(input);

      expect(mockInvoke).toHaveBeenCalledWith('create_snapshot', { input });
      expect(result.totalValue).toBe(60000);
    });
  });

  describe('settings', () => {
    it('setPin should invoke set_pin with pin', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await api.settings.setPin('1234');

      expect(mockInvoke).toHaveBeenCalledWith('set_pin', { pin: '1234' });
    });

    it('verifyPin should invoke verify_pin and return boolean', async () => {
      mockInvoke.mockResolvedValueOnce(true);

      const result = await api.settings.verifyPin('1234');

      expect(mockInvoke).toHaveBeenCalledWith('verify_pin', { pin: '1234' });
      expect(result).toBe(true);
    });

    it('verifyPin should return false for wrong pin', async () => {
      mockInvoke.mockResolvedValueOnce(false);

      const result = await api.settings.verifyPin('0000');

      expect(mockInvoke).toHaveBeenCalledWith('verify_pin', { pin: '0000' });
      expect(result).toBe(false);
    });

    it('removePin should invoke remove_pin with current pin', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await api.settings.removePin('1234');

      expect(mockInvoke).toHaveBeenCalledWith('remove_pin', { currentPin: '1234' });
    });

    it('isPinEnabled should invoke is_pin_enabled', async () => {
      mockInvoke.mockResolvedValueOnce(true);

      const result = await api.settings.isPinEnabled();

      expect(mockInvoke).toHaveBeenCalledWith('is_pin_enabled');
      expect(result).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from invoke', async () => {
      const error = new Error('Database connection failed');
      mockInvoke.mockRejectedValueOnce(error);

      await expect(api.entities.getAll()).rejects.toThrow('Database connection failed');
    });

    it('should propagate Tauri error strings', async () => {
      mockInvoke.mockRejectedValueOnce('Entity not found');

      await expect(api.entities.getById(999)).rejects.toBe('Entity not found');
    });
  });
});
