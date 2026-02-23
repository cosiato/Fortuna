export interface Entity {
  id: number
  name: string
  type: EntityType
  createdAt: string
  updatedAt: string
}

export type EntityType = "individual" | "company"

export interface Asset {
  id: string
  name: string
  type: AssetType
  symbol: string | null
  quantity: number
  manualPrice: number | null
  currency: string
  entityId: number
  stakedQuantity: number | null
  withdrawalCooldownDays: number | null
  createdAt: string
  updatedAt: string
}

export type AssetType = "stock" | "crypto" | "real_estate" | "cash" | "other"

export interface Account {
  id: string
  name: string
  balance: number
  currency: string
  countryCode: string
  entityId: number
  isLiquid: boolean
  createdAt: string
  updatedAt: string
}

export interface Snapshot {
  id: string
  totalValue: number
  currency: string
  recordedAt: string
}

export interface CreateAssetInput {
  name: string
  type: AssetType
  symbol?: string | null
  quantity?: number
  manualPrice?: number | null
  currency?: string
  entityId?: number
  stakedQuantity?: number | null
  withdrawalCooldownDays?: number | null
}

export interface UpdateAssetInput {
  name?: string
  type?: AssetType
  symbol?: string | null
  quantity?: number
  manualPrice?: number | null
  currency?: string
  entityId?: number
  stakedQuantity?: number | null
  withdrawalCooldownDays?: number | null
}

export interface CreateAccountInput {
  name: string
  balance?: number
  currency?: string
  countryCode: string
  entityId?: number
  isLiquid?: boolean
}

export interface UpdateAccountInput {
  name?: string
  balance?: number
  currency?: string
  countryCode?: string
  entityId?: number
  isLiquid?: boolean
}

export type CashFlowType = "inflow" | "outflow"

export type CashFlowFrequency =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "trimester"
  | "semester"
  | "yearly"

export type CashFlowCategory =
  | "salary"
  | "freelance"
  | "investment_income"
  | "rental_income"
  | "other_income"
  | "rent"
  | "mortgage"
  | "subscription"
  | "utilities"
  | "insurance"
  | "groceries"
  | "transport"
  | "entertainment"
  | "savings_transfer"
  | "other_expense"

export interface CashFlow {
  id: string
  accountId: string
  name: string
  amount: number
  flowType: CashFlowType
  frequency: CashFlowFrequency
  category: CashFlowCategory
  startDate: string
  endDate: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCashFlowInput {
  accountId: string
  name: string
  amount: number
  flowType: CashFlowType
  frequency: CashFlowFrequency
  category: CashFlowCategory
  startDate: string
  endDate?: string | null
  isActive?: boolean
}

export interface UpdateCashFlowInput {
  name?: string
  amount?: number
  flowType?: CashFlowType
  frequency?: CashFlowFrequency
  category?: CashFlowCategory
  startDate?: string
  endDate?: string | null
  isActive?: boolean
}

export interface CreateEntityInput {
  name: string
  type?: EntityType
}

export interface UpdateEntityInput {
  name?: string
  type?: EntityType
}

export interface CreateSnapshotInput {
  totalValue: number
  currency?: string
}

export type ActivityAction =
  | "asset_created"
  | "asset_increased"
  | "asset_decreased"
  | "asset_deleted"

export interface ActivityLogEntry {
  id: string
  action: ActivityAction
  assetId: string
  assetName: string
  assetType: AssetType
  entityId: number
  quantityBefore: number | null
  quantityAfter: number | null
  currency: string | null
  createdAt: string
}
