use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
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
pub fn get_all_snapshots(db: State<DbConnection>) -> Result<Vec<Snapshot>, String> {
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
pub fn create_snapshot(
    db: State<DbConnection>,
    input: CreateSnapshotInput,
) -> Result<Snapshot, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let currency = input.currency.unwrap_or_else(|| "USD".to_string());

    let recent: Option<String> = conn
        .query_row(
            "SELECT id FROM snapshots WHERE recorded_at >= datetime('now', '-5 minutes') ORDER BY recorded_at DESC LIMIT 1",
            [],
            |row| row.get(0),
        )
        .ok();

    if let Some(recent_id) = recent {
        conn.execute(
            "UPDATE snapshots SET total_value = ?, currency = ?, recorded_at = datetime('now') WHERE id = ?",
            params![input.total_value, currency, recent_id],
        )
        .map_err(|e| e.to_string())?;

        return conn
            .query_row(
                "SELECT id, total_value, currency, recorded_at FROM snapshots WHERE id = ?",
                [&recent_id],
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

#[tauri::command]
pub fn prune_old_snapshots(
    db: State<DbConnection>,
) -> Result<u64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let deleted = conn
        .execute(
            "DELETE FROM snapshots WHERE id IN (
                SELECT id FROM (
                    SELECT id, ROW_NUMBER() OVER (
                        PARTITION BY date(recorded_at)
                        ORDER BY recorded_at DESC
                    ) AS rn
                    FROM snapshots
                    WHERE recorded_at < datetime('now', '-30 days')
                )
                WHERE rn > 1
            )",
            [],
        )
        .map_err(|e| e.to_string())?;

    Ok(deleted as u64)
}
