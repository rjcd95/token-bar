#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::ActivationPolicy;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                // Run as a menu bar utility by hiding the dock icon.
                app.set_activation_policy(ActivationPolicy::Accessory);
            }

            // The tray icon will be created from the JavaScript side using the
            // Tauri tray API, which simplifies cross-platform behavior.

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

