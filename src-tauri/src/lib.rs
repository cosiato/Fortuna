mod commands;
mod database;

use commands::entities::DbConnection;
use commands::settings::LockState;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            let db_path = database::get_db_path(&app.handle());
            database::init_database(&app.handle()).expect("Failed to initialize database");

            let conn = Connection::open(&db_path).expect("Failed to open database connection");
            app.manage(DbConnection(Mutex::new(conn)));
            app.manage(LockState(Mutex::new(false)));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_all_entities,
            commands::get_entity_by_id,
            commands::create_entity,
            commands::update_entity,
            commands::delete_entity,
            commands::delete_entity_cascade,
            commands::ensure_individual_entity,
            commands::get_all_assets,
            commands::get_assets_by_entity,
            commands::get_asset_by_id,
            commands::create_asset,
            commands::update_asset,
            commands::delete_asset,
            commands::get_all_accounts,
            commands::get_accounts_by_entity,
            commands::get_account_by_id,
            commands::create_account,
            commands::update_account,
            commands::delete_account,
            commands::get_all_snapshots,
            commands::get_today_snapshot,
            commands::get_latest_snapshot,
            commands::create_snapshot,
            commands::prune_old_snapshots,
            commands::set_pin,
            commands::verify_pin,
            commands::remove_pin,
            commands::is_pin_enabled,
            commands::get_activity_log,
            commands::get_activity_log_by_asset,
            commands::get_activity_log_by_entity,
            commands::get_all_cash_flows,
            commands::get_cash_flows_by_account,
            commands::get_cash_flow_by_id,
            commands::create_cash_flow,
            commands::update_cash_flow,
            commands::delete_cash_flow,
            commands::reset_all_data,
            commands::lock_app,
            commands::unlock_app,
            commands::get_currency_preference,
            commands::set_currency_preference,
            commands::get_locale_preference,
            commands::set_locale_preference,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
