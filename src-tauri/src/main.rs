#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
use tauri::{ActivationPolicy, AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AppConfig {
    provider: String,
    api_key: String,
    endpoint: String,
    token_limit: u64,
    refresh_interval: u64,
    menu_bar_icon: String,
    show_percentages: bool,
    show_model: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            provider: "claude".into(),
            api_key: "YOUR_API_KEY".into(),
            endpoint: "https://api.anthropic.com".into(),
            token_limit: 200_000,
            refresh_interval: 20,
            menu_bar_icon: "brain".into(),
            show_percentages: true,
            show_model: true,
        }
    }
}

fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let Some(dir) = app.path_resolver().app_config_dir() else {
        return Err("Failed to resolve app config directory".into());
    };

    if let Err(err) = fs::create_dir_all(&dir) {
        return Err(format!("Failed to create config directory: {err}"));
    }

    Ok(dir.join("config.json"))
}

fn ensure_config(app: &AppHandle) -> Result<AppConfig, String> {
    let path = config_path(app)?;

    if path.exists() {
        let contents = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read config file: {e}"))?;
        let parsed: AppConfig =
            serde_json::from_str(&contents).map_err(|e| format!("Invalid config JSON: {e}"))?;
        Ok(parsed)
    } else {
        let default_cfg = AppConfig::default();
        let contents = serde_json::to_string_pretty(&default_cfg)
            .map_err(|e| format!("Failed to serialize default config: {e}"))?;
        fs::write(&path, contents)
            .map_err(|e| format!("Failed to write default config file: {e}"))?;
        Ok(default_cfg)
    }
}

#[tauri::command]
fn load_config(app: AppHandle) -> Result<AppConfig, String> {
    ensure_config(&app)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![load_config])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                // Run as a menu bar utility by hiding the dock icon.
                app.set_activation_policy(ActivationPolicy::Accessory);
            }

            // Ensure the configuration file exists on startup so users can edit it
            // even before the first refresh.
            let app_handle = app.handle();
            if let Err(err) = ensure_config(&app_handle) {
                app_handle
                    .log()
                    .error(&format!("Failed to initialize config: {err}"));
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

