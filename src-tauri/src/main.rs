#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::{env, fs, path::PathBuf, process::Command};
use tauri::{
    include_image,
    tray::{MouseButtonState, TrayIconBuilder, TrayIconEvent},
    ActivationPolicy, Manager,
};
use tauri_plugin_positioner::{Position, WindowExt};

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

/// Opens the config file with the system default app (e.g. TextEdit on macOS).
#[tauri::command]
fn open_config_file() -> Result<(), String> {
    let path = project_root_config_path()?;
    #[cfg(target_os = "macos")]
    {
        Command::new("open").arg(&path).status().map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    {
        Err("Open config file is only supported on macOS".into())
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![load_config, open_config_file])
        .plugin(tauri_plugin_positioner::init())
        .setup(|app| {
            // Ensure the configuration file exists on startup so users can edit it
            // even before the first refresh.
            if let Err(err) = ensure_config() {
                eprintln!("Failed to initialize config: {err}");
            }

            #[cfg(target_os = "macos")]
            {
                // Run as a menu bar utility by hiding the dock icon.
                app.set_activation_policy(ActivationPolicy::Accessory);
            }

            // Create tray icon from Rust so it exists before the window loads.
            // Path is relative to CARGO_MANIFEST_DIR (src-tauri).
            let icon = include_image!("icons/32x32.png");
            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .tooltip("Token Monitor")
                .show_menu_on_left_click(false)
                .on_tray_icon_event(move |tray, event| {
                    // Required so positioner knows tray location for move_window.
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
                    // Only react on mouse release (Up) so the panel stays open; ignore mouse down (Down).
                    if matches!(event, TrayIconEvent::Click { button_state: MouseButtonState::Up, .. }) {
                        if let Some(w) = tray.app_handle().get_webview_window("main") {
                            let visible = w.is_visible().unwrap_or(false);
                            if visible {
                                let _ = w.hide();
                            } else {
                                // Position window under the tray icon like a context menu.
                                let _ = w.move_window(Position::TrayBottomCenter);
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                })
                .build(app)
                .map_err(|e| e.to_string())?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

