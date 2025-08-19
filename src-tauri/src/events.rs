use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::AppHandle;
use tauri_specta::Event;

#[derive(Serialize, Deserialize, Clone, Type)]
pub struct LogEventPayload {
    pub id: String,
    pub message: String,
    pub level: String,
    pub timestamp: String,
    pub source: String,
    pub details: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Type, Event)]
pub struct LogEvent(pub LogEventPayload);

pub fn emit_log(
    app: &AppHandle,
    level: &str,
    message: &str,
    source: &str,
    details: Option<String>,
) {
    let _ = LogEvent(LogEventPayload {
        id: uuid::Uuid::new_v4().to_string(),
        message: message.to_string(),
        level: level.to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
        source: source.to_string(),
        details: details,
    })
    .emit(app);
}
