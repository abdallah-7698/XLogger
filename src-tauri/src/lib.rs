mod commands;
mod file_watcher;
mod log_parser;
mod log_store;
mod prefs;

use std::sync::Arc;

use parking_lot::Mutex;

use commands::{fs_commands, prefs_commands, watcher_commands};
use file_watcher::FileWatcher;
use log_store::LogStore;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let log_store = Arc::new(LogStore::new());
    let file_watcher = Arc::new(Mutex::new(FileWatcher::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(log_store)
        .manage(file_watcher)
        .invoke_handler(tauri::generate_handler![
            fs_commands::open_folder_dialog,
            fs_commands::load_folder,
            fs_commands::clear_logs,
            fs_commands::export_logs,
            watcher_commands::start_watching,
            watcher_commands::stop_watching,
            prefs_commands::load_prefs,
            prefs_commands::save_prefs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
