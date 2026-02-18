use std::path::PathBuf;

use tauri::{AppHandle, Manager};

use crate::prefs::{load_prefs_from, save_prefs_to, AppPrefs};

fn get_prefs_path(app: &AppHandle) -> PathBuf {
    let app_data = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    app_data.join("prefs.json")
}

#[tauri::command]
pub async fn load_prefs(app: AppHandle) -> Result<AppPrefs, String> {
    let path = get_prefs_path(&app);
    Ok(load_prefs_from(&path))
}

#[tauri::command]
pub async fn save_prefs(app: AppHandle, prefs: AppPrefs) -> Result<(), String> {
    let path = get_prefs_path(&app);
    save_prefs_to(&path, &prefs).map_err(|e| e.to_string())
}
