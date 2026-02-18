use std::fs;
use std::path::PathBuf;
use std::sync::Arc;

use tauri::State;

use crate::file_watcher::{collect_log_files, read_file_entries};
use crate::log_parser::LogEntry;
use crate::log_store::LogStore;

#[tauri::command]
pub async fn open_folder_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let folder = app.dialog().file().blocking_pick_folder();

    Ok(folder.map(|p| p.to_string()))
}

#[tauri::command]
pub async fn load_folder(
    path: String,
    store: State<'_, Arc<LogStore>>,
) -> Result<Vec<LogEntry>, String> {
    let folder = PathBuf::from(&path);
    if !folder.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    store.clear();
    store.clear_offsets();

    let mut all_entries = Vec::new();

    let log_files = collect_log_files(&folder);
    for file_path in log_files {
        let file_entries = read_file_entries(&file_path, &store);
        all_entries.extend(file_entries);
    }

    // Sort by timestamp (newest first)
    all_entries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    store.append_entries(all_entries.clone());
    Ok(all_entries)
}

#[tauri::command]
pub async fn clear_logs(store: State<'_, Arc<LogStore>>) -> Result<(), String> {
    store.clear();
    Ok(())
}

#[tauri::command]
pub async fn export_logs(app: tauri::AppHandle, logs_json: String) -> Result<(), String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app
        .dialog()
        .file()
        .add_filter("JSON", &["json"])
        .set_file_name(&format!(
            "logs-export-{}.json",
            chrono::Utc::now().format("%Y%m%d-%H%M%S")
        ))
        .blocking_save_file();

    if let Some(path) = file_path {
        fs::write(path.to_string(), &logs_json).map_err(|e| e.to_string())?;
    }
    Ok(())
}
