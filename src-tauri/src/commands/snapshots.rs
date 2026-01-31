use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use uuid::Uuid;

use super::entities::DbConnection;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub id: String,
    pub total_value: f64,
    pub currency: String,
    pub recorded_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSnapshotInput {
    pub total_value: f64,
    pub currency: Option<String>,
}

#[tauri::command]
pub fn get_all_snapshots(app: AppHandle, db: State<DbConnection>) -> Result<Vec<Snapshot>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, total_value, currency, recorded_at
             FROM snapshots ORDER BY recorded_at ASC",
        )
        .map_err(|e| e.to_string())?;

    let snapshots = stmt
        .query_map([], |row| {
            Ok(Snapshot {
                id: row.get(0)?,
                total_value: row.get(1)?,
                currency: row.get(2)?,
                recorded_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(snapshots)
}

#[tauri::command]
pub fn get_today_snapshot(
    app: AppHandle,
    db: State<DbConnection>,
) -> Result<Option<Snapshot>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let result = conn.query_row(
        "SELECT id, total_value, currency, recorded_at
         FROM snapshots
         WHERE date(recorded_at) = date('now')
         ORDER BY recorded_at DESC
         LIMIT 1",
        [],
        |row| {
            Ok(Snapshot {
                id: row.get(0)?,
                total_value: row.get(1)?,
                currency: row.get(2)?,
                recorded_at: row.get(3)?,
            })
        },
    );

    match result {
        Ok(snapshot) => Ok(Some(snapshot)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn get_latest_snapshot(
    app: AppHandle,
    db: State<DbConnection>,
) -> Result<Option<Snapshot>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let result = conn.query_row(
        "SELECT id, total_value, currency, recorded_at
         FROM snapshots
         ORDER BY recorded_at DESC
         LIMIT 1",
        [],
        |row| {
            Ok(Snapshot {
                id: row.get(0)?,
                total_value: row.get(1)?,
                currency: row.get(2)?,
                recorded_at: row.get(3)?,
            })
        },
    );

    match result {
        Ok(snapshot) => Ok(Some(snapshot)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn create_snapshot(
    app: AppHandle,
    db: State<DbConnection>,
    input: CreateSnapshotInput,
) -> Result<Snapshot, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let existing: Option<String> = conn
        .query_row(
            "SELECT id FROM snapshots WHERE date(recorded_at) = date('now') LIMIT 1",
            [],
            |row| row.get(0),
        )
        .ok();

    if let Some(existing_id) = existing {
        return conn
            .query_row(
                "SELECT id, total_value, currency, recorded_at FROM snapshots WHERE id = ?",
                [&existing_id],
                |row| {
                    Ok(Snapshot {
                        id: row.get(0)?,
                        total_value: row.get(1)?,
                        currency: row.get(2)?,
                        recorded_at: row.get(3)?,
                    })
                },
            )
            .map_err(|e| e.to_string());
    }

    let id = Uuid::new_v4().to_string();
    let currency = input.currency.unwrap_or_else(|| "USD".to_string());

    conn.execute(
        "INSERT INTO snapshots (id, total_value, currency, recorded_at)
         VALUES (?, ?, ?, datetime('now'))",
        params![id, input.total_value, currency],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, total_value, currency, recorded_at FROM snapshots WHERE id = ?",
        [&id],
        |row| {
            Ok(Snapshot {
                id: row.get(0)?,
                total_value: row.get(1)?,
                currency: row.get(2)?,
                recorded_at: row.get(3)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}
