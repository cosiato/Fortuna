use rand::Rng;
use sha2::{Digest, Sha256};
use std::sync::Mutex;
use std::time::Duration;
use tauri::State;

use super::entities::DbConnection;

pub struct LockState(pub Mutex<bool>);

const SALT_LENGTH: usize = 16;
const MAX_FAILED_ATTEMPTS: i32 = 5;
const LOCKOUT_DURATION_SECS: i64 = 300; // 5 minutes

fn hash_pin_with_salt(pin: &str, salt: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(salt);
    hasher.update(pin.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn generate_salt() -> Vec<u8> {
    let mut rng = rand::thread_rng();
    let mut salt = vec![0u8; SALT_LENGTH];
    rng.fill(&mut salt[..]);
    salt
}

fn encode_pin_data(salt: &[u8], hash: &str) -> String {
    let salt_hex = hex::encode(salt);
    format!("{}:{}", salt_hex, hash)
}

fn decode_pin_data(data: &str) -> Option<(Vec<u8>, String)> {
    let parts: Vec<&str> = data.split(':').collect();
    if parts.len() != 2 {
        return None;
    }
    let salt = hex::decode(parts[0]).ok()?;
    let hash = parts[1].to_string();
    Some((salt, hash))
}

fn get_failed_attempts(conn: &rusqlite::Connection) -> i32 {
    conn.query_row(
        "SELECT value FROM settings WHERE key = 'pin_failed_attempts'",
        [],
        |row| row.get::<_, String>(0),
    )
    .ok()
    .and_then(|v| v.parse().ok())
    .unwrap_or(0)
}

fn get_lockout_until(conn: &rusqlite::Connection) -> Option<i64> {
    conn.query_row(
        "SELECT value FROM settings WHERE key = 'pin_lockout_until'",
        [],
        |row| row.get::<_, String>(0),
    )
    .ok()
    .and_then(|v| v.parse().ok())
}

fn set_failed_attempts(conn: &rusqlite::Connection, attempts: i32) -> Result<(), String> {
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('pin_failed_attempts', ?)",
        [attempts.to_string()],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn set_lockout_until(conn: &rusqlite::Connection, timestamp: i64) -> Result<(), String> {
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('pin_lockout_until', ?)",
        [timestamp.to_string()],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn clear_lockout_data(conn: &rusqlite::Connection) -> Result<(), String> {
    conn.execute(
        "DELETE FROM settings WHERE key IN ('pin_failed_attempts', 'pin_lockout_until')",
        [],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn verify_pin_with_rate_limit(conn: &rusqlite::Connection, pin: &str) -> Result<(), String> {
    if let Some(lockout_until) = get_lockout_until(conn) {
        let now = current_timestamp();
        if now < lockout_until {
            let remaining = lockout_until - now;
            return Err(format!(
                "Too many failed attempts. Try again in {} seconds.",
                remaining
            ));
        }
    }

    let stored_data: String = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'pin_hash'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let (salt, stored_hash) =
        decode_pin_data(&stored_data).ok_or("Invalid stored PIN data")?;
    let input_hash = hash_pin_with_salt(pin, &salt);

    if stored_hash != input_hash {
        let attempts = get_failed_attempts(conn) + 1;
        set_failed_attempts(conn, attempts)?;

        if attempts >= MAX_FAILED_ATTEMPTS {
            let lockout_time = current_timestamp() + LOCKOUT_DURATION_SECS;
            set_lockout_until(conn, lockout_time)?;
            set_failed_attempts(conn, 0)?;
        }

        return Err("Invalid PIN".to_string());
    }

    clear_lockout_data(conn)?;
    Ok(())
}

fn current_timestamp() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("System clock is before UNIX epoch")
        .as_secs() as i64
}

#[tauri::command]
pub fn set_pin(db: State<DbConnection>, pin: String) -> Result<(), String> {
    if pin.len() != 4 || !pin.chars().all(|c| c.is_ascii_digit()) {
        return Err("PIN must be exactly 4 digits".to_string());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let salt = generate_salt();
    let hash = hash_pin_with_salt(&pin, &salt);
    let pin_data = encode_pin_data(&salt, &hash);

    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('pin_hash', ?)",
        [&pin_data],
    )
    .map_err(|e| e.to_string())?;

    clear_lockout_data(&conn)?;

    Ok(())
}

#[tauri::command]
pub fn verify_pin(db: State<DbConnection>, pin: String) -> Result<bool, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    if let Some(lockout_until) = get_lockout_until(&conn) {
        let now = current_timestamp();
        if now < lockout_until {
            let remaining = lockout_until - now;
            return Err(format!(
                "Too many failed attempts. Try again in {} seconds.",
                remaining
            ));
        }
    }

    let result = conn.query_row(
        "SELECT value FROM settings WHERE key = 'pin_hash'",
        [],
        |row| row.get::<_, String>(0),
    );

    match result {
        Ok(stored_data) => {
            let (salt, stored_hash) = decode_pin_data(&stored_data)
                .ok_or_else(|| "Invalid stored PIN data".to_string())?;

            let input_hash = hash_pin_with_salt(&pin, &salt);
            let is_valid = stored_hash == input_hash;

            if is_valid {
                clear_lockout_data(&conn)?;
            } else {
                let attempts = get_failed_attempts(&conn) + 1;
                set_failed_attempts(&conn, attempts)?;

                if attempts >= MAX_FAILED_ATTEMPTS {
                    let lockout_time = current_timestamp() + LOCKOUT_DURATION_SECS;
                    set_lockout_until(&conn, lockout_time)?;
                    set_failed_attempts(&conn, 0)?;
                }
            }

            Ok(is_valid)
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(false),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn remove_pin(db: State<DbConnection>, current_pin: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let result = conn.query_row(
        "SELECT value FROM settings WHERE key = 'pin_hash'",
        [],
        |row| row.get::<_, String>(0),
    );

    match result {
        Ok(stored_data) => {
            let (salt, stored_hash) = decode_pin_data(&stored_data)
                .ok_or_else(|| "Invalid stored PIN data".to_string())?;

            let input_hash = hash_pin_with_salt(&current_pin, &salt);
            if stored_hash != input_hash {
                return Err("Invalid current PIN".to_string());
            }
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            return Ok(());
        }
        Err(e) => return Err(e.to_string()),
    }

    conn.execute("DELETE FROM settings WHERE key = 'pin_hash'", [])
        .map_err(|e| e.to_string())?;

    clear_lockout_data(&conn)?;

    Ok(())
}

#[tauri::command]
pub fn is_pin_enabled(db: State<DbConnection>) -> Result<bool, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM settings WHERE key = 'pin_hash')",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(exists)
}

#[tauri::command]
pub fn reset_all_data(db: State<DbConnection>, lock: State<LockState>, pin: Option<String>) -> Result<(), String> {
    check_not_locked(&lock)?;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let pin_enabled: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM settings WHERE key = 'pin_hash')",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if pin_enabled {
        let pin = pin.ok_or("PIN required to reset data")?;
        verify_pin_with_rate_limit(&conn, &pin)?;
    }

    conn.execute_batch(
        "BEGIN TRANSACTION;
         DELETE FROM cash_flows;
         DELETE FROM activity_log;
         DELETE FROM snapshots;
         DELETE FROM accounts;
         DELETE FROM assets;
         DELETE FROM entities WHERE id != 0;
         DELETE FROM settings;
         UPDATE entities SET name = 'Individual', updated_at = datetime('now') WHERE id = 0;
         COMMIT;",
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn check_not_locked(lock: &State<LockState>) -> Result<(), String> {
    let locked = lock.0.lock().map_err(|e| e.to_string())?;
    if *locked {
        return Err("App is locked".to_string());
    }
    Ok(())
}

#[tauri::command]
pub fn lock_app(lock: State<LockState>) -> Result<(), String> {
    let mut locked = lock.0.lock().map_err(|e| e.to_string())?;
    *locked = true;
    Ok(())
}

#[tauri::command]
pub fn unlock_app(
    db: State<DbConnection>,
    lock: State<LockState>,
    pin: String,
) -> Result<bool, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let result = conn.query_row(
        "SELECT value FROM settings WHERE key = 'pin_hash'",
        [],
        |row| row.get::<_, String>(0),
    );

    match result {
        Ok(stored_data) => {
            let (salt, stored_hash) = decode_pin_data(&stored_data)
                .ok_or_else(|| "Invalid stored PIN data".to_string())?;

            let input_hash = hash_pin_with_salt(&pin, &salt);
            if stored_hash == input_hash {
                let mut locked = lock.0.lock().map_err(|e| e.to_string())?;
                *locked = false;
                Ok(true)
            } else {
                Ok(false)
            }
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            let mut locked = lock.0.lock().map_err(|e| e.to_string())?;
            *locked = false;
            Ok(true)
        }
        Err(e) => Err(e.to_string()),
    }
}

const ALLOWED_LOCALES: &[&str] = &["en", "fr", "es", "pt"];

#[tauri::command]
pub fn get_locale_preference(db: State<DbConnection>) -> Result<String, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let result = conn.query_row(
        "SELECT value FROM settings WHERE key = 'display_locale'",
        [],
        |row| row.get::<_, String>(0),
    );

    match result {
        Ok(locale) => Ok(locale),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok("en".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn set_locale_preference(db: State<DbConnection>, locale: String) -> Result<(), String> {
    if !ALLOWED_LOCALES.contains(&locale.as_str()) {
        return Err(format!("Unsupported locale: {}", locale));
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('display_locale', ?1)",
        [&locale],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

// Keep in sync with SUPPORTED_CURRENCIES in src/lib/currency.ts
pub const ALLOWED_CURRENCIES: &[&str] = &[
    // North America
    "USD", "CAD", "MXN",
    // South America
    "BRL", "ARS", "CLP", "COP", "PEN", "PYG",
    // Europe
    "EUR", "GBP", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RON", "RUB", "ISK",
    // Asia
    "JPY", "CNY", "HKD", "SGD", "KRW", "INR", "IDR", "MYR", "THB", "PHP", "VND", "TWD",
    "TRY", "AED", "SAR", "QAR", "KWD", "ILS", "PKR",
    // Africa
    "ZAR", "NGN", "EGP", "KES", "MAD", "GHS", "TZS",
    // Oceania
    "AUD", "NZD", "FJD",
    // Digital
    "BTC",
];

pub fn validate_currency(currency: &str) -> Result<(), String> {
    if !ALLOWED_CURRENCIES.contains(&currency) {
        return Err(format!(
            "Unsupported currency: {}. Must be a valid ISO 4217 code",
            currency
        ));
    }
    Ok(())
}

#[tauri::command]
pub fn get_currency_preference(db: State<DbConnection>) -> Result<String, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let result = conn.query_row(
        "SELECT value FROM settings WHERE key = 'display_currency'",
        [],
        |row| row.get::<_, String>(0),
    );

    match result {
        Ok(currency) => Ok(currency),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok("USD".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn set_currency_preference(db: State<DbConnection>, currency: String) -> Result<(), String> {
    if !ALLOWED_CURRENCIES.contains(&currency.as_str()) {
        return Err(format!("Unsupported currency: {}", currency));
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('display_currency', ?1)",
        [&currency],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn export_database(
    db: State<DbConnection>,
    lock: State<LockState>,
    destination: String,
) -> Result<(), String> {
    check_not_locked(&lock)?;

    let dest_path = std::path::Path::new(&destination);

    match dest_path.extension().and_then(|e| e.to_str()) {
        Some("db") => {}
        _ => return Err("Export path must have a .db extension".to_string()),
    }

    let parent = dest_path
        .parent()
        .ok_or("Invalid destination path")?;
    let canonical_parent = parent
        .canonicalize()
        .map_err(|e| format!("Invalid destination directory: {}", e))?;
    let dest_path = canonical_parent.join(
        dest_path
            .file_name()
            .ok_or("Invalid destination file name")?,
    );
    let destination = dest_path
        .to_str()
        .ok_or("Destination path contains invalid characters")?
        .to_string();

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    if dest_path.exists() {
        std::fs::remove_file(dest_path)
            .map_err(|e| format!("Failed to overwrite existing file: {}", e))?;
    }

    conn.execute("VACUUM INTO ?1", [&destination])
        .map_err(|e| format!("Failed to export database: {}", e))?;

    Ok(())
}

const REQUIRED_TABLES: &[&str] = &[
    "entities",
    "assets",
    "accounts",
    "settings",
    "snapshots",
    "activity_log",
    "cash_flows",
];

#[tauri::command]
pub fn import_database(
    db: State<DbConnection>,
    lock: State<LockState>,
    source: String,
    pin: Option<String>,
) -> Result<(), String> {
    check_not_locked(&lock)?;

    let mut conn = db.0.lock().map_err(|e| e.to_string())?;

    let pin_enabled: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM settings WHERE key = 'pin_hash')",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if pin_enabled {
        let pin = pin.ok_or("PIN required to restore data")?;
        verify_pin_with_rate_limit(&conn, &pin)?;
    }

    let source_path = std::path::Path::new(&source)
        .canonicalize()
        .map_err(|e| format!("Invalid backup path: {}", e))?;

    match source_path.extension().and_then(|e| e.to_str()) {
        Some("db") => {}
        _ => return Err("Backup file must have a .db extension".to_string()),
    }

    // Reject excessively large files (> 500 MB)
    let file_size = std::fs::metadata(&source_path)
        .map_err(|e| format!("Failed to read backup file metadata: {}", e))?
        .len();
    if file_size > 500 * 1024 * 1024 {
        return Err("Backup file is too large (max 500 MB)".to_string());
    }

    let source_conn = rusqlite::Connection::open_with_flags(
        &source_path,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
    )
    .map_err(|e| format!("Failed to open backup file: {}", e))?;

    // Verify database integrity before restoring
    let integrity: String = source_conn
        .query_row("PRAGMA integrity_check", [], |row| row.get(0))
        .map_err(|e| format!("Integrity check failed: {}", e))?;
    if integrity != "ok" {
        return Err(format!("Backup file is corrupt: {}", integrity));
    }

    let missing_tables: Vec<&str> = REQUIRED_TABLES
        .iter()
        .filter(|table| {
            source_conn
                .query_row(
                    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?1",
                    [**table],
                    |row| row.get::<_, i32>(0),
                )
                .unwrap_or(0)
                == 0
        })
        .copied()
        .collect();

    if !missing_tables.is_empty() {
        return Err(format!(
            "Invalid backup: missing tables: {}",
            missing_tables.join(", ")
        ));
    }

    let backup = rusqlite::backup::Backup::new(&source_conn, &mut *conn)
        .map_err(|e| format!("Failed to initialize restore: {}", e))?;

    backup
        .run_to_completion(5, Duration::from_millis(250), None)
        .map_err(|e| format!("Failed to restore database: {}", e))?;

    // Drop backup to release the mutable borrow on conn
    drop(backup);

    // Verify foreign key integrity after restore
    let fk_count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_foreign_key_check",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Foreign key check failed: {}", e))?;
    if fk_count > 0 {
        return Err(format!(
            "Restored database has {} foreign key violation(s)",
            fk_count
        ));
    }

    Ok(())
}
