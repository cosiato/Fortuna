import { PrismaClient, Asset, Snapshot, Account, Entity } from '@/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'fortuna.db');

function createPrismaClient(): PrismaClient {
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export type { Asset, Snapshot, Account, Entity };

export type AssetType = 'stock' | 'crypto' | 'real_estate' | 'cash' | 'other';

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

export async function getAllAssets(): Promise<Asset[]> {
  return prisma.asset.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAssetById(id: string): Promise<Asset | null> {
  return prisma.asset.findUnique({
    where: { id },
  });
}

export async function createAsset(input: CreateAssetInput): Promise<Asset> {
  return prisma.asset.create({
    data: {
      name: input.name,
      type: input.type,
      symbol: input.symbol ?? null,
      quantity: input.quantity ?? 0,
      manualPrice: input.manualPrice ?? null,
      currency: input.currency ?? 'USD',
      entityId: input.entityId ?? 0,
    },
  });
}

export async function updateAsset(
  id: string,
  updates: UpdateAssetInput
): Promise<Asset | null> {
  const existing = await getAssetById(id);
  if (!existing) {
    return null;
  }

  return prisma.asset.update({
    where: { id },
    data: updates,
  });
}

export async function deleteAsset(id: string): Promise<boolean> {
  try {
    await prisma.asset.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

export async function getAllSnapshots(): Promise<Snapshot[]> {
  return prisma.snapshot.findMany({
    orderBy: { recordedAt: 'asc' },
  });
}

export async function createSnapshot(input: {
  totalValue: number;
  currency?: string;
}): Promise<Snapshot> {
  return prisma.snapshot.create({
    data: {
      totalValue: input.totalValue,
      currency: input.currency ?? 'USD',
    },
  });
}

export async function getLatestSnapshot(): Promise<Snapshot | null> {
  return prisma.snapshot.findFirst({
    orderBy: { recordedAt: 'desc' },
  });
}

export async function getTodaySnapshot(): Promise<Snapshot | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.snapshot.findFirst({
    where: {
      recordedAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: { recordedAt: 'desc' },
  });
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

export async function getAllAccounts(): Promise<Account[]> {
  return prisma.account.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAccountById(id: string): Promise<Account | null> {
  return prisma.account.findUnique({
    where: { id },
  });
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  return prisma.account.create({
    data: {
      name: input.name,
      balance: input.balance ?? 0,
      currency: input.currency ?? 'USD',
      countryCode: input.countryCode,
      entityId: input.entityId ?? 0,
    },
  });
}

export async function updateAccount(
  id: string,
  updates: UpdateAccountInput
): Promise<Account | null> {
  const existing = await getAccountById(id);
  if (!existing) {
    return null;
  }

  return prisma.account.update({
    where: { id },
    data: updates,
  });
}

export async function deleteAccount(id: string): Promise<boolean> {
  try {
    await prisma.account.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

export type EntityType = 'individual' | 'company';

export interface CreateEntityInput {
  name: string;
  type: EntityType;
}

export interface UpdateEntityInput {
  name?: string;
  type?: EntityType;
}

export async function getAllEntities(): Promise<Entity[]> {
  return prisma.entity.findMany({
    orderBy: { id: 'asc' },
  });
}

export async function getEntityById(id: number): Promise<Entity | null> {
  return prisma.entity.findUnique({
    where: { id },
  });
}

export async function createEntity(input: CreateEntityInput): Promise<Entity> {
  return prisma.entity.create({
    data: {
      name: input.name,
      type: input.type,
    },
  });
}

export async function updateEntity(
  id: number,
  updates: UpdateEntityInput
): Promise<Entity | null> {
  const existing = await getEntityById(id);
  if (!existing) {
    return null;
  }

  if (id === 0 && updates.type && updates.type !== 'individual') {
    throw new Error('Cannot change type of individual entity');
  }

  return prisma.entity.update({
    where: { id },
    data: updates,
  });
}

export async function deleteEntity(id: number): Promise<boolean> {
  if (id === 0) {
    throw new Error('Cannot delete individual entity');
  }

  try {
    await prisma.entity.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

export async function ensureIndividualEntity(): Promise<Entity> {
  const existing = await prisma.entity.findFirst({
    where: { id: 0 },
  });

  if (existing) {
    return existing;
  }

  await prisma.$executeRawUnsafe(
    `INSERT OR REPLACE INTO entities (id, name, type, created_at, updated_at) VALUES (0, 'Individual', 'individual', datetime('now'), datetime('now'))`
  );

  return prisma.entity.findUniqueOrThrow({ where: { id: 0 } });
}
