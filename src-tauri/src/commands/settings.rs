use rand::Rng;
use sha2::{Digest, Sha256};
use std::sync::Mutex;
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
    {
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
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

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
        let stored_data: String = conn
            .query_row(
                "SELECT value FROM settings WHERE key = 'pin_hash'",
                [],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;

        let (salt, stored_hash) =
            decode_pin_data(&stored_data).ok_or("Invalid stored PIN data")?;
        let input_hash = hash_pin_with_salt(&pin, &salt);

        if stored_hash != input_hash {
            return Err("Invalid PIN".to_string());
        }
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
