use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::AppHandle;

#[cfg(target_os = "macos")]
use tauri::Manager;

pub type DbConnection = Arc<Mutex<Connection>>;

/// Opens (or creates) app.db and initialises tables.
/// macOS: ~/Library/Application Support/<bundle-id>/app.db (survives app updates)
/// Windows: next to the executable (portable, same directory as app)
pub fn init_db(app: &AppHandle) -> Result<DbConnection, String> {
  let db_path = get_db_path(app)?;

  // Ensure the directory exists before opening the database
  let db_dir = db_path.parent().ok_or("Failed to get database directory")?;
  std::fs::create_dir_all(db_dir).map_err(|e| {
    format!("Failed to create database directory {:?}: {}", db_dir, e)
  })?;

  let conn = Connection::open(&db_path)
    .map_err(|e| format!("Failed to open database {:?}: {}", db_path, e))?;

  create_tables(&conn)
    .map_err(|e| format!("Failed to create tables: {}", e))?;

  log::info!("Database initialised at {:?}", db_path);
  Ok(Arc::new(Mutex::new(conn)))
}

fn get_db_path(app: &AppHandle) -> Result<PathBuf, String> {
  // macOS: use app data directory to survive app updates
  // Windows: use executable directory for portable behavior
  #[cfg(target_os = "macos")]
  {
    let data_dir = app
      .path()
      .app_data_dir()
      .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    Ok(data_dir.join("app.db"))
  }

  #[cfg(not(target_os = "macos"))]
  {
    // app is unused on Windows, but we keep it in the signature for API consistency
    let _ = app;
    let exe = std::env::current_exe()
      .map_err(|e| format!("Failed to get exe path: {}", e))?;
    let dir = exe.parent().ok_or("Failed to get exe directory")?;
    Ok(dir.join("app.db"))
  }
}

fn create_tables(conn: &Connection) -> Result<(), rusqlite::Error> {
  conn.execute_batch(
    "
    PRAGMA journal_mode=WAL;

    CREATE TABLE IF NOT EXISTS window_state (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    ",
  )
}
