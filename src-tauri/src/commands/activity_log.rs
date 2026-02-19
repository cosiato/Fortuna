use rusqlite::{params, Connection};
use serde::Serialize;
use uuid::Uuid;

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
