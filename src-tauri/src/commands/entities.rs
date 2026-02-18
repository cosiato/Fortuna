use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, State};

use super::activity_log::log_activity;
use super::settings::{check_not_locked, LockState};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Entity {
    pub id: i64,
    pub name: String,
    #[serde(rename = "type")]
    pub entity_type: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateEntityInput {
    pub name: String,
    #[serde(rename = "type")]
    pub entity_type: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateEntityInput {
    pub name: Option<String>,
    #[serde(rename = "type")]
    pub entity_type: Option<String>,
}

pub struct DbConnection(pub Mutex<Connection>);

const VALID_ENTITY_TYPES: [&str; 2] = ["individual", "company"];

fn validate_entity_type(entity_type: &str) -> Result<(), String> {
    if !VALID_ENTITY_TYPES.contains(&entity_type) {
        return Err(format!(
            "Invalid entity type: {}. Must be one of: {:?}",
            entity_type, VALID_ENTITY_TYPES
        ));
    }
    Ok(())
}

fn validate_name(name: &str) -> Result<(), String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Name cannot be empty".to_string());
    }
    if trimmed.len() > 255 {
        return Err("Name is too long (max 255 characters)".to_string());
    }
    Ok(())
}

#[tauri::command]
pub fn get_all_entities(app: AppHandle, db: State<DbConnection>) -> Result<Vec<Entity>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, type, created_at, updated_at FROM entities ORDER BY id")
        .map_err(|e| e.to_string())?;

    let entities = stmt
        .query_map([], |row| {
            Ok(Entity {
                id: row.get(0)?,
                name: row.get(1)?,
                entity_type: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(entities)
}

#[tauri::command]
pub fn get_entity_by_id(
    app: AppHandle,
    db: State<DbConnection>,
    id: i64,
) -> Result<Option<Entity>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let result = conn.query_row(
        "SELECT id, name, type, created_at, updated_at FROM entities WHERE id = ?",
        [id],
        |row| {
            Ok(Entity {
                id: row.get(0)?,
                name: row.get(1)?,
                entity_type: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        },
    );

    match result {
        Ok(entity) => Ok(Some(entity)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn create_entity(
    app: AppHandle,
    db: State<DbConnection>,
    lock: State<LockState>,
    input: CreateEntityInput,
) -> Result<Entity, String> {
    let _ = app;
    check_not_locked(&lock)?;
    validate_name(&input.name)?;

    let entity_type = input.entity_type.unwrap_or_else(|| "company".to_string());
    validate_entity_type(&entity_type)?;

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO entities (name, type, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))",
        rusqlite::params![input.name, entity_type],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    conn.query_row(
        "SELECT id, name, type, created_at, updated_at FROM entities WHERE id = ?",
        [id],
        |row| {
            Ok(Entity {
                id: row.get(0)?,
                name: row.get(1)?,
                entity_type: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_entity(
    app: AppHandle,
    db: State<DbConnection>,
    lock: State<LockState>,
    id: i64,
    input: UpdateEntityInput,
) -> Result<Entity, String> {
    let _ = app;
    check_not_locked(&lock)?;
    if id == 0 {
        return Err("Cannot modify the Individual entity".to_string());
    }

    if let Some(ref name) = input.name {
        validate_name(name)?;
    }
    if let Some(ref entity_type) = input.entity_type {
        validate_entity_type(entity_type)?;
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut updates = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(ref name) = input.name {
        updates.push("name = ?");
        params.push(Box::new(name.clone()));
    }

    if let Some(ref entity_type) = input.entity_type {
        updates.push("type = ?");
        params.push(Box::new(entity_type.clone()));
    }

    if updates.is_empty() {
        return Err("No fields to update".to_string());
    }

    updates.push("updated_at = datetime('now')");

    let sql = format!(
        "UPDATE entities SET {} WHERE id = ?",
        updates.join(", ")
    );

    params.push(Box::new(id));

    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    conn.execute(&sql, params_refs.as_slice())
        .map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, name, type, created_at, updated_at FROM entities WHERE id = ?",
        [id],
        |row| {
            Ok(Entity {
                id: row.get(0)?,
                name: row.get(1)?,
                entity_type: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_entity(app: AppHandle, db: State<DbConnection>, lock: State<LockState>, id: i64) -> Result<(), String> {
    let _ = app;
    check_not_locked(&lock)?;
    if id == 0 {
        return Err("Cannot delete the Individual entity".to_string());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let affected = conn
        .execute("DELETE FROM entities WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err("Entity not found".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn delete_entity_cascade(
    app: AppHandle,
    db: State<DbConnection>,
    lock: State<LockState>,
    id: i64,
) -> Result<(), String> {
    let _ = app;
    check_not_locked(&lock)?;
    if id == 0 {
        return Err("Cannot delete the Individual entity".to_string());
    }

    let mut conn = db.0.lock().map_err(|e| e.to_string())?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Fetch and log activity for each asset before deletion
    let asset_rows: Vec<(String, String, String, f64, String)> = {
        let mut stmt = tx
            .prepare(
                "SELECT id, name, type, quantity, currency FROM assets WHERE entity_id = ?",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt.query_map(params![id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, f64>(3)?,
                row.get::<_, String>(4)?,
            ))
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
        rows
    };

    for (asset_id, name, asset_type, quantity, currency) in &asset_rows {
        let _ = log_activity(
            &tx,
            "asset_deleted",
            asset_id,
            name,
            asset_type,
            id,
            Some(*quantity),
            None,
            Some(currency),
        );
    }

    tx.execute("DELETE FROM assets WHERE entity_id = ?", params![id])
        .map_err(|e| e.to_string())?;

    // cash_flows cascade via ON DELETE CASCADE on accounts
    tx.execute("DELETE FROM accounts WHERE entity_id = ?", params![id])
        .map_err(|e| e.to_string())?;

    let affected = tx
        .execute("DELETE FROM entities WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err("Entity not found".to_string());
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn ensure_individual_entity(app: AppHandle, db: State<DbConnection>) -> Result<Entity, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM entities WHERE id = 0)",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if !exists {
        conn.execute(
            "INSERT INTO entities (id, name, type, created_at, updated_at) VALUES (0, 'Individual', 'individual', datetime('now'), datetime('now'))",
            [],
        )
        .map_err(|e| e.to_string())?;
    }

    conn.query_row(
        "SELECT id, name, type, created_at, updated_at FROM entities WHERE id = 0",
        [],
        |row| {
            Ok(Entity {
                id: row.get(0)?,
                name: row.get(1)?,
                entity_type: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}
