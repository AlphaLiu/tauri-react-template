use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewWindow, Window};

/// Window state structure
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WindowState {
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    #[serde(default)]
    pub maximized: bool,
}

impl Default for WindowState {
    fn default() -> Self {
        Self {
            width: 1200,
            height: 800,
            x: 100,
            y: 100,
            maximized: false,
        }
    }
}

impl WindowState {
    /// Validate if the window state is valid
    pub fn is_valid(&self) -> bool {
        // Check if the size is reasonable
        if self.width < 400 || self.height < 300 || self.width > 4000 || self.height > 3000 {
            return false;
        }

        // Check if the position is within reasonable range (avoid window showing outside screen)
        if self.x < -100 || self.y < -100 || self.x > 2000 || self.y > 2000 {
            return false;
        }

        true
    }

    /// Get current state from WebviewWindow
    pub fn from_window(window: &Window) -> Result<Self, tauri::Error> {
        let size = window.outer_size()?;
        let position = window.outer_position()?;
        let maximized = window.is_maximized()?;

        Ok(Self {
            width: size.width,
            height: size.height,
            x: position.x,
            y: position.y,
            maximized,
        })
    }

    /// Apply state to window
    pub fn apply_to_window(&self, window: &WebviewWindow) -> Result<(), tauri::Error> {
        if self.maximized {
            window.maximize()?;
        } else if self.is_valid() {
            window.set_size(PhysicalSize::new(self.width, self.height))?;
            window.set_position(PhysicalPosition::new(self.x, self.y))?;
        } else {
            // Use default state
            let default_state = Self::default();
            window.set_size(PhysicalSize::new(default_state.width, default_state.height))?;
            window.set_position(PhysicalPosition::new(default_state.x, default_state.y))?;
        }
        Ok(())
    }
}

/// Window state manager
pub struct WindowStateManager {
    app_handle: AppHandle,
}

impl WindowStateManager {
    /// Create new window state manager
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    /// Get storage path
    fn get_store_path(&self) -> PathBuf {
        self.app_handle
            .path()
            .app_local_data_dir()
            .expect("Unable to get app local data directory")
            .join("window_state.json")
    }

    /// Save window state
    pub async fn save_state(&self, window: &Window) -> Result<(), Box<dyn std::error::Error>> {
        let state = WindowState::from_window(window)?;
        let store_path = self.get_store_path();

        // Ensure directory exists
        if let Some(parent) = store_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        // Write to JSON file
        let json = serde_json::to_string_pretty(&state)?;
        tokio::fs::write(store_path, json).await?;

        Ok(())
    }

    /// Synchronously save window state (for window closing)
    pub fn save_state_sync(&self, state: WindowState) {
        let store_path = self.get_store_path();

        tauri::async_runtime::spawn(async move {
            // Ensure directory exists
            if let Some(parent) = store_path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }

            // Write to JSON file
            if let Ok(json) = serde_json::to_string_pretty(&state) {
                let _ = tokio::fs::write(store_path, json).await;
            }
        });
    }

    /// Load window state
    pub async fn load_state(&self) -> Option<WindowState> {
        let store_path = self.get_store_path();

        if !store_path.exists() {
            return None;
        }

        let content = tokio::fs::read_to_string(store_path).await.ok()?;
        serde_json::from_str(&content).ok()
    }

    /// Restore window state
    pub async fn restore_window(&self, window: &WebviewWindow) {
        match self.load_state().await {
            Some(state) if state.maximized => {
                let _ = window.maximize();
            }
            Some(state) if state.is_valid() => {
                let _ = state.apply_to_window(window);
            }
            _ => {
                // Use default state and center
                let _ = window.center();
            }
        }
        let _ = window.show();
    }
}
