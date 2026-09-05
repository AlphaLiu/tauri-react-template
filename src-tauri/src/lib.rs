mod config;
mod window_state;

#[cfg(debug_assertions)]
use specta_typescript::Typescript;

use tauri::ipc::Channel;
use tauri::Manager;
use tauri_specta::{collect_commands, collect_events, Builder};

/// Window corner radius (Windows 11 only; older builds ignore it).
///   1 DWMWCP_DONOTROUND  square corners
///   2 DWMWCP_ROUND       rounded  <- this app
///   3 DWMWCP_ROUNDSMALL  rounded, tighter radius
#[cfg(windows)]
const CORNER_PREFERENCE: u32 = 2;

#[cfg(windows)]
fn apply_corner_preference<R: tauri::Runtime>(window: &tauri::WebviewWindow<R>) {
  use windows_sys::Win32::Graphics::Dwm::{
    DwmSetWindowAttribute, DWMWA_WINDOW_CORNER_PREFERENCE,
  };

  let Ok(hwnd) = window.hwnd() else { return };
  let preference = CORNER_PREFERENCE;
  unsafe {
    // Failure here is not worth aborting startup over: on Windows 10 this
    // returns an error and the window is simply square.
    DwmSetWindowAttribute(
      hwnd.0 as _,
      DWMWA_WINDOW_CORNER_PREFERENCE as u32,
      &preference as *const u32 as *const _,
      std::mem::size_of::<u32>() as u32,
    );
  }
}

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
    // auto_titlebar(false): we draw our own controls in HTML. The plugin's
    // only job here is the native HTMAXBUTTON overlay on the maximize
    // button, which is the part CSS and JS cannot do.
    .plugin(
      tauri_plugin_frame::FramePluginBuilder::new()
        .auto_titlebar(false)
        .snap_overlay(true)
        // These two MUST match the CSS: titlebar height (32px) and caption
        // button width (46px). The overlay is positioned by arithmetic from
        // the window's top-right corner, not by measuring the DOM, so if
        // they drift it sits off the button and the snap flyout silently
        // stops appearing.
        .titlebar_height(32)
        .button_width(46)
        .build(),
    )
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

      // Restore the main window geometry from window.json and persist it on close
      if let Some(main_window) = app.get_webview_window("main") {
        window_state::WindowStateManager::restore(app.handle(), &main_window);
      }
      window_state::register_save_on_close(app.handle());

      // Mount events using the moved builder
      builder.mount_events(app);

      // Attach the native HTMAXBUTTON overlay to the maximize button and
      // request rounded corners (Windows 11). On other platforms the overlay
      // is skipped entirely and the HTML buttons keep working via plain
      // onClick.
      #[cfg(windows)]
      {
        use tauri_plugin_frame::WebviewWindowExt;
        let window = app.get_webview_window("main").expect("no main window");
        window.create_overlay_titlebar_with_height(32)?;
        apply_corner_preference(&window);
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
