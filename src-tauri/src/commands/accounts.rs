use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use uuid::Uuid;

use super::entities::DbConnection;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub id: String,
    pub name: String,
    pub balance: f64,
    pub currency: String,
    pub country_code: String,
    pub entity_id: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAccountInput {
    pub name: String,
    pub balance: Option<f64>,
    pub currency: Option<String>,
    pub country_code: String,
    pub entity_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAccountInput {
    pub name: Option<String>,
    pub balance: Option<f64>,
    pub currency: Option<String>,
    pub country_code: Option<String>,
    pub entity_id: Option<i64>,
}

fn validate_country_code(code: &str) -> Result<(), String> {
    if code.len() != 2 || !code.chars().all(|c| c.is_ascii_uppercase()) {
        return Err(format!(
            "Invalid country code: {}. Must be a 2-letter ISO 3166-1 alpha-2 code",
            code
        ));
    }
    Ok(())
}

#[tauri::command]
pub fn get_all_accounts(app: AppHandle, db: State<DbConnection>) -> Result<Vec<Account>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, name, balance, currency, country_code, entity_id, created_at, updated_at
             FROM accounts ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let accounts = stmt
        .query_map([], |row| {
            Ok(Account {
                id: row.get(0)?,
                name: row.get(1)?,
                balance: row.get(2)?,
                currency: row.get(3)?,
                country_code: row.get(4)?,
                entity_id: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(accounts)
}

#[tauri::command]
pub fn get_accounts_by_entity(
    app: AppHandle,
    db: State<DbConnection>,
    entity_id: i64,
) -> Result<Vec<Account>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, name, balance, currency, country_code, entity_id, created_at, updated_at
             FROM accounts WHERE entity_id = ? ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let accounts = stmt
        .query_map([entity_id], |row| {
            Ok(Account {
                id: row.get(0)?,
                name: row.get(1)?,
                balance: row.get(2)?,
                currency: row.get(3)?,
                country_code: row.get(4)?,
                entity_id: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(accounts)
}

#[tauri::command]
pub fn get_account_by_id(
    app: AppHandle,
    db: State<DbConnection>,
    id: String,
) -> Result<Option<Account>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let result = conn.query_row(
        "SELECT id, name, balance, currency, country_code, entity_id, created_at, updated_at
         FROM accounts WHERE id = ?",
        [&id],
        |row| {
            Ok(Account {
                id: row.get(0)?,
                name: row.get(1)?,
                balance: row.get(2)?,
                currency: row.get(3)?,
                country_code: row.get(4)?,
                entity_id: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        },
    );

    match result {
        Ok(account) => Ok(Some(account)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn create_account(
    app: AppHandle,
    db: State<DbConnection>,
    input: CreateAccountInput,
) -> Result<Account, String> {
    let _ = app;
    validate_country_code(&input.country_code)?;

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let balance = input.balance.unwrap_or(0.0);
    let currency = input.currency.unwrap_or_else(|| "USD".to_string());
    let entity_id = input.entity_id.unwrap_or(0);

    conn.execute(
        "INSERT INTO accounts (id, name, balance, currency, country_code, entity_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
        params![id, input.name, balance, currency, input.country_code, entity_id],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, name, balance, currency, country_code, entity_id, created_at, updated_at
         FROM accounts WHERE id = ?",
        [&id],
        |row| {
            Ok(Account {
                id: row.get(0)?,
                name: row.get(1)?,
                balance: row.get(2)?,
                currency: row.get(3)?,
                country_code: row.get(4)?,
                entity_id: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_account(
    app: AppHandle,
    db: State<DbConnection>,
    id: String,
    input: UpdateAccountInput,
) -> Result<Account, String> {
    let _ = app;
    if let Some(ref code) = input.country_code {
        validate_country_code(code)?;
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut updates = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(ref name) = input.name {
        updates.push("name = ?");
        params.push(Box::new(name.clone()));
    }

    if let Some(balance) = input.balance {
        updates.push("balance = ?");
        params.push(Box::new(balance));
    }

    if let Some(ref currency) = input.currency {
        updates.push("currency = ?");
        params.push(Box::new(currency.clone()));
    }

    if let Some(ref country_code) = input.country_code {
        updates.push("country_code = ?");
        params.push(Box::new(country_code.clone()));
    }

    if let Some(entity_id) = input.entity_id {
        updates.push("entity_id = ?");
        params.push(Box::new(entity_id));
    }

    if updates.is_empty() {
        return Err("No fields to update".to_string());
    }

    updates.push("updated_at = datetime('now')");

    let sql = format!("UPDATE accounts SET {} WHERE id = ?", updates.join(", "));

    params.push(Box::new(id.clone()));

    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let affected = conn
        .execute(&sql, params_refs.as_slice())
        .map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err("Account not found".to_string());
    }

    conn.query_row(
        "SELECT id, name, balance, currency, country_code, entity_id, created_at, updated_at
         FROM accounts WHERE id = ?",
        [&id],
        |row| {
            Ok(Account {
                id: row.get(0)?,
                name: row.get(1)?,
                balance: row.get(2)?,
                currency: row.get(3)?,
                country_code: row.get(4)?,
                entity_id: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_account(app: AppHandle, db: State<DbConnection>, id: String) -> Result<(), String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let affected = conn
        .execute("DELETE FROM accounts WHERE id = ?", [&id])
        .map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err("Account not found".to_string());
    }

    Ok(())
}
