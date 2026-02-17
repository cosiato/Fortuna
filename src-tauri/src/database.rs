use rusqlite::{Connection, Result};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub fn get_db_path(app: &AppHandle) -> PathBuf {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .expect("Failed to get app data directory");
    std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data directory");
    app_data_dir.join("fortuna.db")
}

pub fn init_database(app: &AppHandle) -> Result<()> {
    let db_path = get_db_path(app);
    let conn = Connection::open(&db_path)?;

    conn.execute_batch("PRAGMA foreign_keys = ON;")?;

    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS entities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('individual', 'company')),
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS assets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('stock', 'crypto', 'real_estate', 'cash', 'other')),
            symbol TEXT,
            quantity REAL NOT NULL DEFAULT 0,
            manual_price REAL,
            currency TEXT NOT NULL DEFAULT 'USD',
            entity_id INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (entity_id) REFERENCES entities(id)
        );

        CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
        CREATE INDEX IF NOT EXISTS idx_assets_entity_id ON assets(entity_id);

        CREATE TABLE IF NOT EXISTS snapshots (
            id TEXT PRIMARY KEY,
            total_value REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'USD',
            recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_snapshots_recorded_at ON snapshots(recorded_at);

        CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            balance REAL NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'USD',
            country_code TEXT NOT NULL,
            entity_id INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (entity_id) REFERENCES entities(id)
        );

        CREATE INDEX IF NOT EXISTS idx_accounts_entity_id ON accounts(entity_id);

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS activity_log (
            id TEXT PRIMARY KEY,
            action TEXT NOT NULL CHECK(action IN ('asset_created','asset_increased','asset_decreased','asset_deleted')),
            asset_id TEXT NOT NULL,
            asset_name TEXT NOT NULL,
            asset_type TEXT NOT NULL,
            entity_id INTEGER NOT NULL DEFAULT 0,
            quantity_before REAL,
            quantity_after REAL,
            currency TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
        CREATE INDEX IF NOT EXISTS idx_activity_log_asset_id ON activity_log(asset_id);
        CREATE INDEX IF NOT EXISTS idx_activity_log_entity_id ON activity_log(entity_id);
        CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

        CREATE TABLE IF NOT EXISTS cash_flows (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL CHECK(amount > 0),
            flow_type TEXT NOT NULL CHECK(flow_type IN ('inflow', 'outflow')),
            frequency TEXT NOT NULL CHECK(frequency IN ('none', 'daily', 'weekly', 'monthly', 'quarterly', 'trimester', 'semester', 'yearly')),
            category TEXT NOT NULL CHECK(category IN (
                'salary', 'freelance', 'investment_income', 'rental_income', 'other_income',
                'rent', 'mortgage', 'subscription', 'utilities', 'insurance',
                'groceries', 'transport', 'entertainment', 'savings_transfer', 'other_expense'
            )),
            start_date TEXT NOT NULL,
            end_date TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_cash_flows_account_id ON cash_flows(account_id);
        CREATE INDEX IF NOT EXISTS idx_cash_flows_flow_type ON cash_flows(flow_type);
        CREATE INDEX IF NOT EXISTS idx_cash_flows_is_active ON cash_flows(is_active);
        ",
    )?;

    ensure_individual_entity(&conn)?;
    migrate_cash_flow_frequencies(&conn)?;

    Ok(())
}

fn migrate_cash_flow_frequencies(conn: &Connection) -> Result<()> {
    let needs_migration: bool = conn.query_row(
        "SELECT sql LIKE '%daily%weekly%monthly%yearly%' AND sql NOT LIKE '%none%'
         FROM sqlite_master WHERE type='table' AND name='cash_flows'",
        [],
        |row| row.get(0),
    ).unwrap_or(false);

    if !needs_migration {
        return Ok(());
    }

    // SQLite requires foreign_keys OFF for table-swap migrations.
    // Must be set outside a transaction.
    conn.execute_batch("PRAGMA foreign_keys = OFF;")?;

    let tx = conn.unchecked_transaction()?;

    tx.execute_batch(
        "
        CREATE TABLE cash_flows_new (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL CHECK(amount > 0),
            flow_type TEXT NOT NULL CHECK(flow_type IN ('inflow', 'outflow')),
            frequency TEXT NOT NULL CHECK(frequency IN ('none', 'daily', 'weekly', 'monthly', 'quarterly', 'trimester', 'semester', 'yearly')),
            category TEXT NOT NULL CHECK(category IN (
                'salary', 'freelance', 'investment_income', 'rental_income', 'other_income',
                'rent', 'mortgage', 'subscription', 'utilities', 'insurance',
                'groceries', 'transport', 'entertainment', 'savings_transfer', 'other_expense'
            )),
            start_date TEXT NOT NULL,
            end_date TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
        );

        INSERT INTO cash_flows_new SELECT * FROM cash_flows;
        DROP TABLE cash_flows;
        ALTER TABLE cash_flows_new RENAME TO cash_flows;

        CREATE INDEX IF NOT EXISTS idx_cash_flows_account_id ON cash_flows(account_id);
        CREATE INDEX IF NOT EXISTS idx_cash_flows_flow_type ON cash_flows(flow_type);
        CREATE INDEX IF NOT EXISTS idx_cash_flows_is_active ON cash_flows(is_active);
        ",
    )?;

    tx.execute_batch("PRAGMA foreign_key_check;")?;
    tx.commit()?;

    conn.execute_batch("PRAGMA foreign_keys = ON;")?;

    Ok(())
}

fn ensure_individual_entity(conn: &Connection) -> Result<()> {
    let exists: bool = conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM entities WHERE id = 0)",
        [],
        |row| row.get(0),
    )?;

    if !exists {
        conn.execute(
            "INSERT INTO entities (id, name, type, created_at, updated_at) VALUES (0, 'Individual', 'individual', datetime('now'), datetime('now'))",
            [],
        )?;
    }

    Ok(())
}
