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
