use tauri::{Manager, WindowEvent};

mod window_state;
use window_state::{WindowState, WindowStateManager};
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            let state_manager = WindowStateManager::new(app.handle().clone());

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
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
