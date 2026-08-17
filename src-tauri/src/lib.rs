mod config;

use specta_typescript::Typescript;

use tauri::ipc::Channel;
use tauri::Manager;
use tauri_specta::{collect_commands, collect_events, Builder};

#[tauri::command]
#[specta::specta]
fn greet(name: String) -> String {
  format!("Hello, {}!", name)
}

#[tauri::command]
#[specta::specta]
fn test_channel(on_event: Channel<String>) {
  // channel test, send events back to frontend
  // send a string back to frontend
  // useless function, just for testing
  on_event.send(format!("testing")).unwrap();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let builder = Builder::<tauri::Wry>::new()
    // Then register them (separated by a comma)
    .commands(collect_commands![
      greet,
      test_channel,
      config::get_config,
      config::set_config,
    ])
    .events(collect_events![]);

  #[cfg(debug_assertions)] // <- Only export on non-release builds
  builder
    .export(Typescript::default(), "../src/bindings.ts")
    .expect("Failed to export typescript bindings");

  tauri::Builder::default()
    .plugin(tauri_plugin_os::init())
    .invoke_handler(builder.invoke_handler())
    .setup(move |app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Initialize config and register with Tauri state
      let config_handle = config::init(app.handle())
        .expect("failed to initialize config");
      app.manage(config_handle);

      // Mount events using the moved builder
      builder.mount_events(app);

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
