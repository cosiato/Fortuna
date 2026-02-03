export interface Entity {
  id: number;
  name: string;
  type: EntityType;
  createdAt: string;
  updatedAt: string;
}

export type EntityType = 'individual' | 'company';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  symbol: string | null;
  quantity: number;
  manualPrice: number | null;
  currency: string;
  entityId: number;
  createdAt: string;
  updatedAt: string;
}

export type AssetType = 'stock' | 'crypto' | 'real_estate' | 'cash' | 'other';

export interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
  countryCode: string;
  entityId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Snapshot {
  id: string;
  totalValue: number;
  currency: string;
  recordedAt: string;
}

export interface CreateAssetInput {
  name: string;
  type: AssetType;
  symbol?: string | null;
  quantity?: number;
  manualPrice?: number | null;
  currency?: string;
  entityId?: number;
}

export interface UpdateAssetInput {
  name?: string;
  type?: AssetType;
  symbol?: string | null;
  quantity?: number;
  manualPrice?: number | null;
  currency?: string;
  entityId?: number;
}

export interface CreateAccountInput {
  name: string;
  balance?: number;
  currency?: string;
  countryCode: string;
  entityId?: number;
}

export interface UpdateAccountInput {
  name?: string;
  balance?: number;
  currency?: string;
  countryCode?: string;
  entityId?: number;
}

export interface CreateEntityInput {
  name: string;
  type?: EntityType;
}

export interface UpdateEntityInput {
  name?: string;
  type?: EntityType;
}

export interface CreateSnapshotInput {
  totalValue: number;
  currency?: string;
}

export type ActivityAction =
  | 'asset_created'
  | 'asset_increased'
  | 'asset_decreased'
  | 'asset_deleted';

export interface ActivityLogEntry {
  id: string;
  action: ActivityAction;
  assetId: string;
  assetName: string;
  assetType: AssetType;
  entityId: number;
  quantityBefore: number | null;
  quantityAfter: number | null;
  currency: string | null;
  createdAt: string;
}
