use tauri::{AppHandle, Manager, WindowEvent};

mod window_state;
use specta_typescript::Typescript;
use tauri_specta::{collect_commands, collect_events, Builder};
use window_state::{WindowState, WindowStateManager};
mod events;
use events::LogEvent;

use crate::events::emit_log;
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
#[specta::specta]
fn greet(app: AppHandle, name: &str) -> String {
    emit_log(
        &app,
        "info",
        &format!("{} has been greeted", name),
        "greet",
        None,
    );
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = Builder::<tauri::Wry>::new()
        // Then register them (separated by a comma)
        .commands(collect_commands![greet])
        .events(collect_events![LogEvent]);
    #[cfg(debug_assertions)] // <- Only export on non-release builds
    builder
        .export(Typescript::default(), "../src/bindings.ts")
        .expect("Failed to export typescript bindings");
    tauri::Builder::default()
        .invoke_handler(builder.invoke_handler())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            let window = app.get_webview_window("main").unwrap();
            let state_manager = WindowStateManager::new(app.handle().clone());

            // Mount events using the moved builder
            builder.mount_events(app);

            // Asynchronously restore window state
            tauri::async_runtime::spawn(async move {
                state_manager.restore_window(&window).await;
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            let state_manager = WindowStateManager::new(window.app_handle().clone());

            match event {
                // Save state when window is closing
                WindowEvent::CloseRequested { .. } => {
                    if let Ok(state) = WindowState::from_window(window) {
                        state_manager.save_state_sync(state);
                    }
                }
                // Real-time state saving (with debounce)
                WindowEvent::Resized(_) | WindowEvent::Moved(_) => {
                    let window = window.clone();

                    tauri::async_runtime::spawn(async move {
                        // Debounce delay
                        tokio::time::sleep(std::time::Duration::from_millis(300)).await;

                        // Ignore save errors
                        let _ = state_manager.save_state(&window).await;
                    });
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
