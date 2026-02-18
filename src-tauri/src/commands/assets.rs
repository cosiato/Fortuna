use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use uuid::Uuid;

use super::activity_log::log_activity;
use super::entities::DbConnection;
use super::settings::{check_not_locked, validate_currency, LockState};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Asset {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub asset_type: String,
    pub symbol: Option<String>,
    pub quantity: f64,
    pub manual_price: Option<f64>,
    pub currency: String,
    pub entity_id: i64,
    pub staked_quantity: Option<f64>,
    pub withdrawal_cooldown_days: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAssetInput {
    pub name: String,
    #[serde(rename = "type")]
    pub asset_type: String,
    pub symbol: Option<String>,
    pub quantity: Option<f64>,
    pub manual_price: Option<f64>,
    pub currency: Option<String>,
    pub entity_id: Option<i64>,
    pub staked_quantity: Option<f64>,
    pub withdrawal_cooldown_days: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAssetInput {
    pub name: Option<String>,
    #[serde(rename = "type")]
    pub asset_type: Option<String>,
    pub symbol: Option<String>,
    pub quantity: Option<f64>,
    pub manual_price: Option<f64>,
    pub currency: Option<String>,
    pub entity_id: Option<i64>,
    pub staked_quantity: Option<f64>,
    pub withdrawal_cooldown_days: Option<i64>,
}

fn validate_staking_fields(
    staked_quantity: Option<f64>,
    withdrawal_cooldown_days: Option<i64>,
    quantity: f64,
    asset_type: &str,
) -> Result<(Option<f64>, Option<i64>), String> {
    if asset_type != "crypto" {
        return Ok((None, None));
    }

    if let Some(sq) = staked_quantity {
        if sq < 0.0 {
            return Err("Staked quantity must be >= 0".to_string());
        }
        if sq > quantity {
            return Err("Staked quantity cannot exceed total quantity".to_string());
        }
    }

    if let Some(cd) = withdrawal_cooldown_days {
        if cd < 0 {
            return Err("Withdrawal cooldown days must be >= 0".to_string());
        }
    }

    Ok((staked_quantity, withdrawal_cooldown_days))
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

const VALID_ASSET_TYPES: [&str; 5] = ["stock", "crypto", "real_estate", "cash", "other"];

const ASSET_SELECT_COLUMNS: &str =
    "id, name, type, symbol, quantity, manual_price, currency, entity_id, created_at, updated_at, staked_quantity, withdrawal_cooldown_days";

fn asset_from_row(row: &rusqlite::Row) -> rusqlite::Result<Asset> {
    Ok(Asset {
        id: row.get(0)?,
        name: row.get(1)?,
        asset_type: row.get(2)?,
        symbol: row.get(3)?,
        quantity: row.get(4)?,
        manual_price: row.get(5)?,
        currency: row.get(6)?,
        entity_id: row.get(7)?,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
        staked_quantity: row.get(10)?,
        withdrawal_cooldown_days: row.get(11)?,
    })
}

fn validate_asset_type(asset_type: &str) -> Result<(), String> {
    if !VALID_ASSET_TYPES.contains(&asset_type) {
        return Err(format!(
            "Invalid asset type: {}. Must be one of: {:?}",
            asset_type, VALID_ASSET_TYPES
        ));
    }
    Ok(())
}

#[tauri::command]
pub fn get_all_assets(app: AppHandle, db: State<DbConnection>) -> Result<Vec<Asset>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let sql = format!(
        "SELECT {} FROM assets ORDER BY created_at DESC",
        ASSET_SELECT_COLUMNS
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let assets = stmt
        .query_map([], asset_from_row)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(assets)
}

#[tauri::command]
pub fn get_assets_by_entity(
    app: AppHandle,
    db: State<DbConnection>,
    entity_id: i64,
) -> Result<Vec<Asset>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let sql = format!(
        "SELECT {} FROM assets WHERE entity_id = ? ORDER BY created_at DESC",
        ASSET_SELECT_COLUMNS
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let assets = stmt
        .query_map([entity_id], asset_from_row)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(assets)
}

#[tauri::command]
pub fn get_asset_by_id(
    app: AppHandle,
    db: State<DbConnection>,
    id: String,
) -> Result<Option<Asset>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let sql = format!("SELECT {} FROM assets WHERE id = ?", ASSET_SELECT_COLUMNS);
    let result = conn.query_row(&sql, [&id], asset_from_row);

    match result {
        Ok(asset) => Ok(Some(asset)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn create_asset(
    app: AppHandle,
    db: State<DbConnection>,
    lock: State<LockState>,
    input: CreateAssetInput,
) -> Result<Asset, String> {
    let _ = app;
    check_not_locked(&lock)?;
    validate_name(&input.name)?;
    validate_asset_type(&input.asset_type)?;
    if let Some(ref currency) = input.currency {
        validate_currency(currency)?;
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    if input.asset_type == "stock" || input.asset_type == "crypto" {
        if let Some(ref symbol) = input.symbol {
            let exists: bool = conn
                .query_row(
                    "SELECT EXISTS(SELECT 1 FROM assets WHERE symbol = ? AND type = ? AND entity_id = ?)",
                    params![symbol, input.asset_type, input.entity_id.unwrap_or(0)],
                    |row| row.get(0),
                )
                .map_err(|e| e.to_string())?;

            if exists {
                return Err(format!(
                    "A {} asset with ticker '{}' already exists",
                    input.asset_type, symbol
                ));
            }
        }
    }

    let id = Uuid::new_v4().to_string();
    let quantity = input.quantity.unwrap_or(0.0);
    let currency = input.currency.unwrap_or_else(|| "USD".to_string());
    let entity_id = input.entity_id.unwrap_or(0);

    let (staked_qty, cooldown) = validate_staking_fields(
        input.staked_quantity,
        input.withdrawal_cooldown_days,
        quantity,
        &input.asset_type,
    )?;

    conn.execute(
        "INSERT INTO assets (id, name, type, symbol, quantity, manual_price, currency, entity_id, staked_quantity, withdrawal_cooldown_days, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
        params![
            id,
            input.name,
            input.asset_type,
            input.symbol,
            quantity,
            input.manual_price,
            currency,
            entity_id,
            staked_qty,
            cooldown
        ],
    )
    .map_err(|e| e.to_string())?;

    let select_sql = format!("SELECT {} FROM assets WHERE id = ?", ASSET_SELECT_COLUMNS);
    let asset = conn
        .query_row(&select_sql, [&id], asset_from_row)
        .map_err(|e| e.to_string())?;

    let _ = log_activity(
        &conn,
        "asset_created",
        &asset.id,
        &asset.name,
        &asset.asset_type,
        asset.entity_id,
        None,
        Some(asset.quantity),
        Some(&asset.currency),
    );

    Ok(asset)
}

#[tauri::command]
pub fn update_asset(
    app: AppHandle,
    db: State<DbConnection>,
    lock: State<LockState>,
    id: String,
    input: UpdateAssetInput,
) -> Result<Asset, String> {
    let _ = app;
    check_not_locked(&lock)?;
    if let Some(ref name) = input.name {
        validate_name(name)?;
    }
    if let Some(ref asset_type) = input.asset_type {
        validate_asset_type(asset_type)?;
    }
    if let Some(ref currency) = input.currency {
        validate_currency(currency)?;
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let old_quantity = if input.quantity.is_some() {
        conn.query_row(
            "SELECT quantity FROM assets WHERE id = ?",
            [&id],
            |row| row.get::<_, f64>(0),
        )
        .ok()
    } else {
        None
    };

    let mut updates = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(ref name) = input.name {
        updates.push("name = ?");
        params.push(Box::new(name.clone()));
    }

    if let Some(ref asset_type) = input.asset_type {
        updates.push("type = ?");
        params.push(Box::new(asset_type.clone()));
    }

    if let Some(ref symbol) = input.symbol {
        updates.push("symbol = ?");
        params.push(Box::new(symbol.clone()));
    }

    if let Some(quantity) = input.quantity {
        updates.push("quantity = ?");
        params.push(Box::new(quantity));
    }

    if let Some(manual_price) = input.manual_price {
        updates.push("manual_price = ?");
        params.push(Box::new(manual_price));
    }

    if let Some(ref currency) = input.currency {
        updates.push("currency = ?");
        params.push(Box::new(currency.clone()));
    }

    if let Some(entity_id) = input.entity_id {
        updates.push("entity_id = ?");
        params.push(Box::new(entity_id));
    }

    // Clear staking fields when type changes away from crypto
    let changing_away_from_crypto = matches!(input.asset_type.as_deref(), Some(t) if t != "crypto");
    let needs_staking = input.staked_quantity.is_some() || input.withdrawal_cooldown_days.is_some();

    if changing_away_from_crypto {
        updates.push("staked_quantity = ?");
        params.push(Box::new(None::<f64>));
        updates.push("withdrawal_cooldown_days = ?");
        params.push(Box::new(None::<i64>));
    } else if needs_staking {
        let (current_type, current_qty): (String, f64) = conn
            .query_row(
                "SELECT type, quantity FROM assets WHERE id = ?",
                [&id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .map_err(|e| e.to_string())?;

        let asset_type = input.asset_type.as_deref().unwrap_or(&current_type);
        let qty = input.quantity.unwrap_or(current_qty);

        let (staked_qty, cooldown) = validate_staking_fields(
            input.staked_quantity,
            input.withdrawal_cooldown_days,
            qty,
            asset_type,
        )?;

        updates.push("staked_quantity = ?");
        params.push(Box::new(staked_qty));
        updates.push("withdrawal_cooldown_days = ?");
        params.push(Box::new(cooldown));
    }

    if updates.is_empty() {
        return Err("No fields to update".to_string());
    }

    updates.push("updated_at = datetime('now')");

    let sql = format!("UPDATE assets SET {} WHERE id = ?", updates.join(", "));

    params.push(Box::new(id.clone()));

    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let affected = conn
        .execute(&sql, params_refs.as_slice())
        .map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err("Asset not found".to_string());
    }

    let select_sql = format!("SELECT {} FROM assets WHERE id = ?", ASSET_SELECT_COLUMNS);
    let asset = conn
        .query_row(&select_sql, [&id], asset_from_row)
        .map_err(|e| e.to_string())?;

    if let Some(old_qty) = old_quantity {
        let new_qty = asset.quantity;
        if (new_qty - old_qty).abs() > f64::EPSILON {
            let action = if new_qty > old_qty {
                "asset_increased"
            } else {
                "asset_decreased"
            };
            let _ = log_activity(
                &conn,
                action,
                &asset.id,
                &asset.name,
                &asset.asset_type,
                asset.entity_id,
                Some(old_qty),
                Some(new_qty),
                Some(&asset.currency),
            );
        }
    }

    Ok(asset)
}

#[tauri::command]
pub fn delete_asset(app: AppHandle, db: State<DbConnection>, lock: State<LockState>, id: String) -> Result<(), String> {
    let _ = app;
    check_not_locked(&lock)?;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let select_sql = format!("SELECT {} FROM assets WHERE id = ?", ASSET_SELECT_COLUMNS);
    let asset = conn
        .query_row(&select_sql, [&id], asset_from_row)
        .map_err(|e| e.to_string())?;

    let affected = conn
        .execute("DELETE FROM assets WHERE id = ?", [&id])
        .map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err("Asset not found".to_string());
    }

    let _ = log_activity(
        &conn,
        "asset_deleted",
        &asset.id,
        &asset.name,
        &asset.asset_type,
        asset.entity_id,
        Some(asset.quantity),
        None,
        Some(&asset.currency),
    );

    Ok(())
}
