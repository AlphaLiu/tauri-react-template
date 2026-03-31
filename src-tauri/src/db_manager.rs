use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

pub type DbConnection = Arc<Mutex<Connection>>;

/// Opens (or creates) app.db next to the executable and initialises the window_state table.
pub fn init_db() -> Result<DbConnection, String> {
  let db_path = get_db_path()?;
  let conn = Connection::open(&db_path)
    .map_err(|e| format!("Failed to open database {:?}: {}", db_path, e))?;

  create_tables(&conn)
    .map_err(|e| format!("Failed to create tables: {}", e))?;

  log::info!("Database initialised at {:?}", db_path);
  Ok(Arc::new(Mutex::new(conn)))
}

fn get_db_path() -> Result<PathBuf, String> {
  let exe = std::env::current_exe()
    .map_err(|e| format!("Failed to get exe path: {}", e))?;
  let dir = exe.parent().ok_or("Failed to get exe directory")?;
  Ok(dir.join("app.db"))
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
