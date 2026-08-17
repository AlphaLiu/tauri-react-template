use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewWindow};

/// Window geometry persisted to `window.json`.
#[derive(Debug, Clone, Serialize, Deserialize)]
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
  /// Validate that the dimensions and position are sane.
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

  /// Capture the current window geometry.
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

/// Returns the path to `window.json` for the running platform — the same
/// directory as `config.json`:
///
/// | Platform       | Path                                                            |
/// |----------------|-----------------------------------------------------------------|
/// | macOS          | `~/Library/Application Support/<bundle-id>/window.json`         |
/// | Windows/Linux  | Executable directory / `window.json`                            |
fn window_state_file_path(app: &AppHandle) -> Result<PathBuf, String> {
  #[cfg(target_os = "macos")]
  {
    let data_dir = app
      .path()
      .app_data_dir()
      .map_err(|e| format!("failed to resolve app data dir: {e}"))?;
    Ok(data_dir.join("window.json"))
  }

  #[cfg(not(target_os = "macos"))]
  {
    let _ = app; // unused on non-macOS
    let exe = std::env::current_exe()
      .map_err(|e| format!("failed to resolve executable path: {e}"))?;
    let dir = exe
      .parent()
      .ok_or_else(|| "executable has no parent directory".to_string())?;
    Ok(dir.join("window.json"))
  }
}

/// Saves and loads the main window geometry from `window.json`.
pub struct WindowStateManager;

impl WindowStateManager {
  fn load(app: &AppHandle) -> Option<WindowState> {
    let path = window_state_file_path(app).ok()?;
    let text = std::fs::read_to_string(path).ok()?;
    serde_json::from_str::<WindowState>(&text).ok()
  }

  /// Persist the current window geometry to `window.json`.
  pub fn save(app: &AppHandle, window: &WebviewWindow) {
    let state = match WindowState::from_window(window) {
      Ok(s) => s,
      Err(e) => {
        log::error!("window_state: failed to read window geometry: {}", e);
        return;
      }
    };

    let path = match window_state_file_path(app) {
      Ok(p) => p,
      Err(e) => {
        log::error!("window_state: failed to resolve window.json path: {}", e);
        return;
      }
    };
    if let Some(parent) = path.parent() {
      if let Err(e) = std::fs::create_dir_all(parent) {
        log::error!("window_state: failed to create directory: {}", e);
        return;
      }
    }

    match serde_json::to_string_pretty(&state)
      .map_err(|e| e.to_string())
      .and_then(|text| std::fs::write(&path, text).map_err(|e| e.to_string()))
    {
      Ok(()) => log::info!(
        "window_state: saved position ({},{}), size {}x{}, maximized={}",
        state.x,
        state.y,
        state.width,
        state.height,
        state.maximized
      ),
      Err(e) => log::error!("window_state: failed to write window.json: {}", e),
    }
  }

  /// Restore the window to its saved state; falls back to centering when
  /// nothing is saved or the state is invalid. Size is only restored when
  /// the window is resizable.
  pub fn restore(app: &AppHandle, window: &WebviewWindow) {
    let resizable = window.is_resizable().unwrap_or(false);

    match Self::load(app) {
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
  }
}

/// Register the close handler on the main window so state is saved on exit.
/// Call this inside `setup()`.
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
        WindowStateManager::save(&app_handle, &win);
      }
    }
  });
}
