import { PrismaClient, Asset, Snapshot } from '@/generated/prisma/client';
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

export type { Asset, Snapshot };

export type AssetType = 'stock' | 'crypto' | 'real_estate' | 'cash' | 'other';

export interface CreateAssetInput {
  name: string;
  type: AssetType;
  symbol?: string | null;
  quantity?: number;
  manualPrice?: number | null;
  currency?: string;
}

export interface UpdateAssetInput {
  name?: string;
  type?: AssetType;
  symbol?: string | null;
  quantity?: number;
  manualPrice?: number | null;
  currency?: string;
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
