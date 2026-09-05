use std::{
    fs,
    path::PathBuf,
    sync::{Arc, Mutex},
};

use serde::{Deserialize, Serialize};
use specta::Type;
#[cfg(target_os = "macos")]
use tauri::Manager;

// ─── Data model ─────────────────────────────────────────────────────────────

/// Application configuration persisted to disk as JSON.
///
/// Currently only `theme` is stored (`"light"` | `"dark"` | `"system"`).
/// Additional fields can be added later without breaking existing config files
/// because `serde` will use the `Default` values for missing fields.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(default)]
pub struct AppConfig {
    pub theme: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
        }
    }
}

// ─── Shared state ────────────────────────────────────────────────────────────

/// Thread-safe handle to the in-memory config.
pub type ConfigHandle = Arc<Mutex<AppConfig>>;

// ─── Path resolution ─────────────────────────────────────────────────────────

/// Returns the path to `config.json` for the running platform.
///
/// | Platform       | Path                                                              |
/// |----------------|-------------------------------------------------------------------|
/// | macOS          | `~/Library/Application Support/<bundle-id>/config.json`          |
/// | Windows/Linux  | Executable directory / `config.json`                             |
fn config_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    #[cfg(target_os = "macos")]
    {
        let data_dir = app
            .path()
            .app_data_dir()
            .map_err(|e| format!("failed to resolve app data dir: {e}"))?;
        Ok(data_dir.join("config.json"))
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = app; // unused on non-macOS
        let exe = std::env::current_exe()
            .map_err(|e| format!("failed to resolve executable path: {e}"))?;
        let dir = exe
            .parent()
            .ok_or_else(|| "executable has no parent directory".to_string())?;
        Ok(dir.join("config.json"))
    }
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

fn load_or_default(path: &PathBuf) -> AppConfig {
    if let Ok(text) = fs::read_to_string(path) {
        serde_json::from_str::<AppConfig>(&text).unwrap_or_default()
    } else {
        AppConfig::default()
    }
}

fn persist(config: &AppConfig, path: &PathBuf) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("failed to create config directory: {e}"))?;
    }
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("failed to serialize config: {e}"))?;
    fs::write(path, json).map_err(|e| format!("failed to write config file: {e}"))
}

// ─── Initialization ───────────────────────────────────────────────────────────

/// Call once during `setup`. Returns a `ConfigHandle` that must be
/// registered with `app.manage(handle)` so Tauri can inject it into commands.
pub fn init(app: &AppHandle) -> Result<ConfigHandle, String> {
    let path = config_file_path(app)?;
    let config = load_or_default(&path);
    Ok(Arc::new(Mutex::new(config)))
}

// ─── Tauri commands ───────────────────────────────────────────────────────────

/// Read the current config.
#[tauri::command]
#[specta::specta]
pub fn get_config(handle: tauri::State<ConfigHandle>) -> Result<AppConfig, String> {
    let cfg = handle
        .lock()
        .map_err(|e| format!("lock poisoned: {e}"))?
        .clone();
    Ok(cfg)
}

/// Persist an updated config to disk and update the in-memory copy.
#[tauri::command]
#[specta::specta]
pub fn set_config(
    app: AppHandle,
    handle: tauri::State<ConfigHandle>,
    config: AppConfig,
) -> Result<(), String> {
    let path = config_file_path(&app)?;
    persist(&config, &path)?;
    let mut guard = handle
        .lock()
        .map_err(|e| format!("lock poisoned: {e}"))?;
    *guard = config;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_path(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("tauri-app-config-{name}")).join("config.json")
    }

    #[test]
    fn persist_and_load_roundtrip() {
        let path = temp_path("roundtrip");
        let cfg = AppConfig { theme: "dark".to_string() };
        persist(&cfg, &path).expect("persist should succeed");
        let loaded = load_or_default(&path);
        assert_eq!(loaded.theme, "dark");
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn missing_file_returns_default() {
        let path = temp_path("missing");
        let loaded = load_or_default(&path);
        assert_eq!(loaded.theme, "system");
    }

    #[test]
    fn corrupt_file_returns_default() {
        let path = temp_path("corrupt");
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(&path, "{not valid json").unwrap();
        let loaded = load_or_default(&path);
        assert_eq!(loaded.theme, "system");
        let _ = std::fs::remove_file(&path);
    }
}
