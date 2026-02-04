use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use uuid::Uuid;

use super::entities::DbConnection;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CashFlow {
    pub id: String,
    pub account_id: String,
    pub name: String,
    pub amount: f64,
    pub flow_type: String,
    pub frequency: String,
    pub category: String,
    pub start_date: String,
    pub end_date: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCashFlowInput {
    pub account_id: String,
    pub name: String,
    pub amount: f64,
    pub flow_type: String,
    pub frequency: String,
    pub category: String,
    pub start_date: String,
    pub end_date: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCashFlowInput {
    pub name: Option<String>,
    pub amount: Option<f64>,
    pub flow_type: Option<String>,
    pub frequency: Option<String>,
    pub category: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<Option<String>>,
    pub is_active: Option<bool>,
}

const VALID_FLOW_TYPES: &[&str] = &["inflow", "outflow"];
const VALID_FREQUENCIES: &[&str] = &["daily", "weekly", "monthly", "yearly"];
const VALID_CATEGORIES: &[&str] = &[
    "salary",
    "freelance",
    "investment_income",
    "rental_income",
    "other_income",
    "rent",
    "mortgage",
    "subscription",
    "utilities",
    "insurance",
    "groceries",
    "transport",
    "entertainment",
    "savings_transfer",
    "other_expense",
];

fn validate_flow_type(flow_type: &str) -> Result<(), String> {
    if !VALID_FLOW_TYPES.contains(&flow_type) {
        return Err(format!(
            "Invalid flow_type: {}. Must be one of: {}",
            flow_type,
            VALID_FLOW_TYPES.join(", ")
        ));
    }
    Ok(())
}

fn validate_frequency(frequency: &str) -> Result<(), String> {
    if !VALID_FREQUENCIES.contains(&frequency) {
        return Err(format!(
            "Invalid frequency: {}. Must be one of: {}",
            frequency,
            VALID_FREQUENCIES.join(", ")
        ));
    }
    Ok(())
}

fn validate_category(category: &str) -> Result<(), String> {
    if !VALID_CATEGORIES.contains(&category) {
        return Err(format!(
            "Invalid category: {}. Must be one of: {}",
            category,
            VALID_CATEGORIES.join(", ")
        ));
    }
    Ok(())
}

fn validate_amount(amount: f64) -> Result<(), String> {
    if amount <= 0.0 {
        return Err("Amount must be greater than 0".to_string());
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

fn validate_dates(start_date: &str, end_date: &Option<String>) -> Result<(), String> {
    if start_date.len() != 10
        || !start_date
            .chars()
            .all(|c| c.is_ascii_digit() || c == '-')
    {
        return Err("Invalid start_date format. Use YYYY-MM-DD".to_string());
    }

    if let Some(end) = end_date {
        if end.len() != 10 || !end.chars().all(|c| c.is_ascii_digit() || c == '-') {
            return Err("Invalid end_date format. Use YYYY-MM-DD".to_string());
        }
        if end.as_str() < start_date {
            return Err("end_date must be after start_date".to_string());
        }
    }

    Ok(())
}

fn row_to_cash_flow(row: &rusqlite::Row) -> rusqlite::Result<CashFlow> {
    let is_active_int: i32 = row.get(9)?;
    Ok(CashFlow {
        id: row.get(0)?,
        account_id: row.get(1)?,
        name: row.get(2)?,
        amount: row.get(3)?,
        flow_type: row.get(4)?,
        frequency: row.get(5)?,
        category: row.get(6)?,
        start_date: row.get(7)?,
        end_date: row.get(8)?,
        is_active: is_active_int != 0,
        created_at: row.get(10)?,
        updated_at: row.get(11)?,
    })
}

const SELECT_COLUMNS: &str =
    "id, account_id, name, amount, flow_type, frequency, category, start_date, end_date, is_active, created_at, updated_at";

#[tauri::command]
pub fn get_all_cash_flows(
    app: AppHandle,
    db: State<DbConnection>,
) -> Result<Vec<CashFlow>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(&format!(
            "SELECT {} FROM cash_flows ORDER BY created_at DESC",
            SELECT_COLUMNS
        ))
        .map_err(|e| e.to_string())?;

    let cash_flows = stmt
        .query_map([], |row| row_to_cash_flow(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(cash_flows)
}

#[tauri::command]
pub fn get_cash_flows_by_account(
    app: AppHandle,
    db: State<DbConnection>,
    account_id: String,
) -> Result<Vec<CashFlow>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(&format!(
            "SELECT {} FROM cash_flows WHERE account_id = ? ORDER BY created_at DESC",
            SELECT_COLUMNS
        ))
        .map_err(|e| e.to_string())?;

    let cash_flows = stmt
        .query_map([&account_id], |row| row_to_cash_flow(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(cash_flows)
}

#[tauri::command]
pub fn get_cash_flow_by_id(
    app: AppHandle,
    db: State<DbConnection>,
    id: String,
) -> Result<Option<CashFlow>, String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let result = conn.query_row(
        &format!(
            "SELECT {} FROM cash_flows WHERE id = ?",
            SELECT_COLUMNS
        ),
        [&id],
        |row| row_to_cash_flow(row),
    );

    match result {
        Ok(cash_flow) => Ok(Some(cash_flow)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn create_cash_flow(
    app: AppHandle,
    db: State<DbConnection>,
    input: CreateCashFlowInput,
) -> Result<CashFlow, String> {
    let _ = app;
    validate_name(&input.name)?;
    validate_amount(input.amount)?;
    validate_flow_type(&input.flow_type)?;
    validate_frequency(&input.frequency)?;
    validate_category(&input.category)?;
    validate_dates(&input.start_date, &input.end_date)?;

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let is_active: i32 = if input.is_active.unwrap_or(true) { 1 } else { 0 };

    conn.execute(
        "INSERT INTO cash_flows (id, account_id, name, amount, flow_type, frequency, category, start_date, end_date, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
        params![
            id,
            input.account_id,
            input.name,
            input.amount,
            input.flow_type,
            input.frequency,
            input.category,
            input.start_date,
            input.end_date,
            is_active
        ],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        &format!(
            "SELECT {} FROM cash_flows WHERE id = ?",
            SELECT_COLUMNS
        ),
        [&id],
        |row| row_to_cash_flow(row),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_cash_flow(
    app: AppHandle,
    db: State<DbConnection>,
    id: String,
    input: UpdateCashFlowInput,
) -> Result<CashFlow, String> {
    let _ = app;

    if let Some(ref name) = input.name {
        validate_name(name)?;
    }
    if let Some(amount) = input.amount {
        validate_amount(amount)?;
    }
    if let Some(ref flow_type) = input.flow_type {
        validate_flow_type(flow_type)?;
    }
    if let Some(ref frequency) = input.frequency {
        validate_frequency(frequency)?;
    }
    if let Some(ref category) = input.category {
        validate_category(category)?;
    }
    if let Some(ref start_date) = input.start_date {
        validate_dates(start_date, &input.end_date.clone().flatten())?;
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut updates = Vec::new();
    let mut params_list: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(ref name) = input.name {
        updates.push("name = ?");
        params_list.push(Box::new(name.clone()));
    }

    if let Some(amount) = input.amount {
        updates.push("amount = ?");
        params_list.push(Box::new(amount));
    }

    if let Some(ref flow_type) = input.flow_type {
        updates.push("flow_type = ?");
        params_list.push(Box::new(flow_type.clone()));
    }

    if let Some(ref frequency) = input.frequency {
        updates.push("frequency = ?");
        params_list.push(Box::new(frequency.clone()));
    }

    if let Some(ref category) = input.category {
        updates.push("category = ?");
        params_list.push(Box::new(category.clone()));
    }

    if let Some(ref start_date) = input.start_date {
        updates.push("start_date = ?");
        params_list.push(Box::new(start_date.clone()));
    }

    if let Some(ref end_date) = input.end_date {
        updates.push("end_date = ?");
        params_list.push(Box::new(end_date.clone()));
    }

    if let Some(is_active) = input.is_active {
        updates.push("is_active = ?");
        let val: i32 = if is_active { 1 } else { 0 };
        params_list.push(Box::new(val));
    }

    if updates.is_empty() {
        return Err("No fields to update".to_string());
    }

    updates.push("updated_at = datetime('now')");

    let sql = format!("UPDATE cash_flows SET {} WHERE id = ?", updates.join(", "));
    params_list.push(Box::new(id.clone()));

    let params_refs: Vec<&dyn rusqlite::ToSql> =
        params_list.iter().map(|p| p.as_ref()).collect();

    let affected = conn
        .execute(&sql, params_refs.as_slice())
        .map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err("Cash flow not found".to_string());
    }

    conn.query_row(
        &format!(
            "SELECT {} FROM cash_flows WHERE id = ?",
            SELECT_COLUMNS
        ),
        [&id],
        |row| row_to_cash_flow(row),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_cash_flow(
    app: AppHandle,
    db: State<DbConnection>,
    id: String,
) -> Result<(), String> {
    let _ = app;
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let affected = conn
        .execute("DELETE FROM cash_flows WHERE id = ?", [&id])
        .map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err("Cash flow not found".to_string());
    }

    Ok(())
}
