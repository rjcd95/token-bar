#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|_app| {
            // Further initialization (tray, menu bar behavior, etc.) will be added in later steps.
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

