use std::path::PathBuf;
use std::sync::Arc;

use parking_lot::Mutex;
use tauri::State;

use crate::file_watcher::FileWatcher;
use crate::log_store::LogStore;

#[tauri::command]
pub async fn start_watching(
    path: String,
    watcher: State<'_, Arc<Mutex<FileWatcher>>>,
    store: State<'_, Arc<LogStore>>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let folder = PathBuf::from(&path);
    watcher
        .lock()
        .start(folder, store.inner().clone(), app)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn stop_watching(watcher: State<'_, Arc<Mutex<FileWatcher>>>) -> Result<(), String> {
    watcher.lock().stop();
    Ok(())
}
