#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{ActivationPolicy, Manager};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                // Run as a menu bar utility by hiding the dock icon.
                app.set_activation_policy(ActivationPolicy::Accessory);
            }

            // Create a basic tray icon. The dynamic icon and menu behavior
            // will be extended in later steps.
            #[cfg(target_os = "macos")]
            {
                use tauri::tray::TrayIconBuilder;

                TrayIconBuilder::new()
                    .with_id("claude-monitor-tray")
                    .with_tooltip("Claude Monitor")
                    .build(app)?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

