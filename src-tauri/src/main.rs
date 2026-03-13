#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::{env, fs, path::PathBuf};
use tauri::ActivationPolicy;

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

fn project_root_config_path() -> Result<PathBuf, String> {
    let cwd = env::current_dir().map_err(|e| format!("Failed to resolve current_dir: {e}"))?;
    Ok(cwd.join("config.json"))
}

fn load_project_config_template() -> Option<AppConfig> {
    let Ok(path) = project_root_config_path() else {
        return None;
    };
    if !path.exists() {
        return None;
    }
    let contents = fs::read_to_string(path).ok()?;
    serde_json::from_str(&contents).ok()
}

fn ensure_config() -> Result<AppConfig, String> {
    let path = project_root_config_path()?;

    if path.exists() {
        let contents = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read config file: {e}"))?;
        let parsed: AppConfig =
            serde_json::from_str(&contents).map_err(|e| format!("Invalid config JSON: {e}"))?;
        return Ok(parsed);
    }

    // If a project-local config.json exists (used in development),
    // use it as the initial configuration; otherwise fall back to defaults.
    let cfg = load_project_config_template().unwrap_or_else(AppConfig::default);
    let contents = serde_json::to_string_pretty(&cfg)
        .map_err(|e| format!("Failed to serialize default config: {e}"))?;
    fs::write(&path, contents).map_err(|e| format!("Failed to write config file: {e}"))?;
    Ok(cfg)
}

#[tauri::command]
fn load_config() -> Result<AppConfig, String> {
    ensure_config()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![load_config])
        .setup(|_app| {
            // Ensure the configuration file exists on startup so users can edit it
            // even before the first refresh.
            if let Err(err) = ensure_config() {
                eprintln!("Failed to initialize config: {err}");
            }

            #[cfg(target_os = "macos")]
            {
                // Run as a menu bar utility by hiding the dock icon.
                _app.set_activation_policy(ActivationPolicy::Accessory);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

