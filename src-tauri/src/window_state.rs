use rusqlite::params;
use tauri::{
  AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewWindow,
};

use crate::db_manager::DbConnection;

/// Window state
#[derive(Clone, Debug)]
pub struct WindowState {
  pub width: u32,
  pub height: u32,
  pub x: i32,
  pub y: i32,
  pub maximized: bool,
}

impl Default for WindowState {
  fn default() -> Self {
    Self { width: 0, height: 0, x: -101, y: -101, maximized: false }
  }
}

impl WindowState {
  /// Validate that the dimensions and position are sane
  pub fn is_valid(&self) -> bool {
    if self.width == 0
      || self.height == 0
      || self.width > 10000
      || self.height > 10000
    {
      return false;
    }
    if self.x < -100 || self.y < -100 || self.x > 5000 || self.y > 5000 {
      return false;
    }
    true
  }

  /// Capture current window geometry
  pub fn from_window(window: &WebviewWindow) -> Result<Self, tauri::Error> {
    Ok(Self {
      width: window.inner_size()?.width,
      height: window.inner_size()?.height,
      x: window.outer_position()?.x,
      y: window.outer_position()?.y,
      maximized: window.is_maximized()?,
    })
  }
}

/// Saves and loads window state from the shared SQLite database
pub struct WindowStateManager {
  db: DbConnection,
}

impl WindowStateManager {
  pub fn new(db: DbConnection) -> Self {
    Self { db }
  }

  /// Persist the current window geometry to SQLite.
  /// Size is only saved when the window is resizable.
  pub fn save(&self, window: &WebviewWindow) {
    let state = match WindowState::from_window(window) {
      Ok(s) => s,
      Err(e) => {
        log::error!("window_state: failed to read window geometry: {}", e);
        return;
      }
    };

    let resizable = window.is_resizable().unwrap_or(false);

    let conn = match self.db.lock() {
      Ok(c) => c,
      Err(e) => {
        log::error!("window_state: failed to lock db: {}", e);
        return;
      }
    };

    let upsert = |key: &str, value: &str| {
      let _ = conn.execute(
        "INSERT INTO window_state (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
      );
    };

    if resizable {
      upsert("width", &state.width.to_string());
      upsert("height", &state.height.to_string());
      upsert("maximized", if state.maximized { "true" } else { "false" });
    }
    upsert("x", &state.x.to_string());
    upsert("y", &state.y.to_string());

    log::info!(
      "window_state: saved position ({},{}){}",
      state.x,
      state.y,
      if resizable {
        format!(
          ", size {}x{}, maximized={}",
          state.width, state.height, state.maximized
        )
      } else {
        " (size skipped, not resizable)".to_string()
      }
    );
  }

  /// Load saved window state from SQLite
  pub fn load(&self) -> Option<WindowState> {
    let conn = self.db.lock().ok()?;

    let read = |key: &str| -> Option<String> {
      conn
        .query_row(
          "SELECT value FROM window_state WHERE key = ?1",
          params![key],
          |row| row.get::<_, String>(0),
        )
        .ok()
    };

    let width: u32 = read("width")?.parse().ok()?;
    let height: u32 = read("height")?.parse().ok()?;
    let x: i32 = read("x")?.parse().ok()?;
    let y: i32 = read("y")?.parse().ok()?;
    let maximized = read("maximized").map(|v| v == "true").unwrap_or(false);

    Some(WindowState { width, height, x, y, maximized })
  }

  /// Restore window to saved state; falls back to centering if nothing saved or invalid.
  /// Size is only restored when the window is resizable.
  pub fn restore(&self, window: &WebviewWindow) {
    let resizable = window.is_resizable().unwrap_or(false);

    match self.load() {
      Some(state) if resizable && state.maximized => {
        let _ = window.maximize();
      }
      Some(state) if state.is_valid() => {
        if resizable {
          let _ = window.set_size(PhysicalSize::new(state.width, state.height));
        }
        let _ = window.set_position(PhysicalPosition::new(state.x, state.y));
      }
      _ => {
        let _ = window.center();
      }
    }
    let _ = window.show();
  }
}

/// Register the close handler on the main window so state is saved on exit.
/// Call this inside `setup()` after managing `WindowStateManager`.
pub fn register_save_on_close(app: &AppHandle) {
  let window = match app.get_webview_window("main") {
    Some(w) => w,
    None => {
      log::warn!(
        "window_state: 'main' window not found, skipping close handler"
      );
      return;
    }
  };

  let app_handle = app.clone();
  window.on_window_event(move |event| {
    if let tauri::WindowEvent::CloseRequested { .. } = event {
      if let Some(win) = app_handle.get_webview_window("main") {
        let manager = app_handle.state::<WindowStateManager>();
        manager.save(&win);
      }
    }
  });
}
