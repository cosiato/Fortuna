import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'fortuna.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initTables(db);
  }
  return db;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('stock', 'crypto', 'real_estate', 'cash', 'other')),
      symbol TEXT,
      quantity REAL NOT NULL DEFAULT 0,
      manual_price REAL,
      currency TEXT NOT NULL DEFAULT 'USD',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      id TEXT PRIMARY KEY,
      total_value REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
    CREATE INDEX IF NOT EXISTS idx_snapshots_recorded_at ON snapshots(recorded_at);
  `);
}

export interface Asset {
  id: string;
  name: string;
  type: 'stock' | 'crypto' | 'real_estate' | 'cash' | 'other';
  symbol: string | null;
  quantity: number;
  manual_price: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Snapshot {
  id: string;
  total_value: number;
  currency: string;
  recorded_at: string;
}

export function getAllAssets(): Asset[] {
  const db = getDb();
  return db.prepare('SELECT * FROM assets ORDER BY created_at DESC').all() as Asset[];
}

export function getAssetById(id: string): Asset | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as Asset | undefined;
}

export function createAsset(asset: Omit<Asset, 'created_at' | 'updated_at'>): Asset {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO assets (id, name, type, symbol, quantity, manual_price, currency, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    asset.id,
    asset.name,
    asset.type,
    asset.symbol,
    asset.quantity,
    asset.manual_price,
    asset.currency,
    now,
    now
  );
  return getAssetById(asset.id)!;
}

export function updateAsset(id: string, updates: Partial<Omit<Asset, 'id' | 'created_at'>>): Asset | undefined {
  const db = getDb();
  const existing = getAssetById(id);
  if (!existing) return undefined;

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }
  if (updates.symbol !== undefined) {
    fields.push('symbol = ?');
    values.push(updates.symbol);
  }
  if (updates.quantity !== undefined) {
    fields.push('quantity = ?');
    values.push(updates.quantity);
  }
  if (updates.manual_price !== undefined) {
    fields.push('manual_price = ?');
    values.push(updates.manual_price);
  }
  if (updates.currency !== undefined) {
    fields.push('currency = ?');
    values.push(updates.currency);
  }

  if (fields.length === 0) return existing;

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const stmt = db.prepare(`UPDATE assets SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getAssetById(id);
}

export function deleteAsset(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM assets WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getAllSnapshots(): Snapshot[] {
  const db = getDb();
  return db.prepare('SELECT * FROM snapshots ORDER BY recorded_at ASC').all() as Snapshot[];
}

export function createSnapshot(snapshot: Omit<Snapshot, 'recorded_at'>): Snapshot {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO snapshots (id, total_value, currency, recorded_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(snapshot.id, snapshot.total_value, snapshot.currency, now);
  return db.prepare('SELECT * FROM snapshots WHERE id = ?').get(snapshot.id) as Snapshot;
}

export function getLatestSnapshot(): Snapshot | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM snapshots ORDER BY recorded_at DESC LIMIT 1').get() as Snapshot | undefined;
}

export function getTodaySnapshot(): Snapshot | undefined {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  return db.prepare(`
    SELECT * FROM snapshots
    WHERE date(recorded_at) = date(?)
    ORDER BY recorded_at DESC
    LIMIT 1
  `).get(today) as Snapshot | undefined;
}
