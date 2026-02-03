use rusqlite::{params, Connection};
use serde::Serialize;
use tauri::{AppHandle, State};
use uuid::Uuid;

use super::entities::DbConnection;

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ActivityLogEntry {
    pub id: String,
    pub action: String,
    pub asset_id: String,
    pub asset_name: String,
    pub asset_type: String,
    pub entity_id: i64,
    pub quantity_before: Option<f64>,
    pub quantity_after: Option<f64>,
    pub currency: Option<String>,
    pub created_at: String,
}

pub fn log_activity(
    conn: &Connection,
    action: &str,
    asset_id: &str,
    asset_name: &str,
    asset_type: &str,
    entity_id: i64,
    quantity_before: Option<f64>,
    quantity_after: Option<f64>,
    currency: Option<&str>,
) -> Result<(), String> {
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO activity_log (id, action, asset_id, asset_name, asset_type, entity_id, quantity_before, quantity_after, currency)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            id,
            action,
            asset_id,
            asset_name,
            asset_type,
            entity_id,
            quantity_before,
            quantity_after,
            currency,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn row_to_entry(row: &rusqlite::Row) -> rusqlite::Result<ActivityLogEntry> {
    Ok(ActivityLogEntry {
        id: row.get(0)?,
        action: row.get(1)?,
        asset_id: row.get(2)?,
        asset_name: row.get(3)?,
        asset_type: row.get(4)?,
        entity_id: row.get(5)?,
        quantity_before: row.get(6)?,
        quantity_after: row.get(7)?,
        currency: row.get(8)?,
        created_at: row.get(9)?,
    })
}

#[tauri::command]
pub fn get_activity_log(
    app: AppHandle,
    db: State<DbConnection>,
) -> Result<Vec<ActivityLogEntry>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, action, asset_id, asset_name, asset_type, entity_id, quantity_before, quantity_after, currency, created_at
             FROM activity_log ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let entries = stmt
        .query_map([], |row| row_to_entry(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(entries)
}

#[tauri::command]
pub fn get_activity_log_by_asset(
    app: AppHandle,
    db: State<DbConnection>,
    asset_id: String,
) -> Result<Vec<ActivityLogEntry>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, action, asset_id, asset_name, asset_type, entity_id, quantity_before, quantity_after, currency, created_at
             FROM activity_log WHERE asset_id = ? ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let entries = stmt
        .query_map([&asset_id], |row| row_to_entry(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(entries)
}

#[tauri::command]
pub fn get_activity_log_by_entity(
    app: AppHandle,
    db: State<DbConnection>,
    entity_id: i64,
) -> Result<Vec<ActivityLogEntry>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, action, asset_id, asset_name, asset_type, entity_id, quantity_before, quantity_after, currency, created_at
             FROM activity_log WHERE entity_id = ? ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let entries = stmt
        .query_map([entity_id], |row| row_to_entry(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(entries)
}
