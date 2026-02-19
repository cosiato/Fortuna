use rusqlite::{params, Connection};
use uuid::Uuid;

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
