use notify::{Event, EventKind, RecursiveMode, Watcher};
use std::fs::{self, File};
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

use crate::log_parser::{parse_log_line, LogEntry};
use crate::log_store::LogStore;

pub struct FileWatcher {
    watcher: Option<notify::RecommendedWatcher>,
    watched_path: Option<PathBuf>,
    poll_running: Option<Arc<AtomicBool>>,
}

impl FileWatcher {
    pub fn new() -> Self {
        Self {
            watcher: None,
            watched_path: None,
            poll_running: None,
        }
    }

    pub fn start(
        &mut self,
        folder: PathBuf,
        store: Arc<LogStore>,
        app_handle: AppHandle,
    ) -> anyhow::Result<()> {
        self.stop();

        let store_clone = store.clone();
        let app_clone = app_handle.clone();

        // FSEvents-based watcher
        let mut watcher =
            notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
                if let Ok(event) = res {
                    let dominated = matches!(
                        event.kind,
                        EventKind::Modify(_) | EventKind::Create(_) | EventKind::Other
                    );
                    if !dominated {
                        return;
                    }
                    for path in &event.paths {
                        if is_log_file(path) {
                            if let Some(entries) = read_new_entries(path, &store_clone) {
                                if !entries.is_empty() {
                                    store_clone.append_entries(entries.clone());
                                    let _ = app_clone.emit("logs:new-entries", &entries);
                                }
                            }
                        }
                    }
                }
            })?;

        watcher.watch(&folder, RecursiveMode::Recursive)?;
        self.watcher = Some(watcher);
        self.watched_path = Some(folder.clone());

        // Polling fallback — checks every 2 seconds for changes FSEvents might miss
        let poll_flag = Arc::new(AtomicBool::new(true));
        self.poll_running = Some(poll_flag.clone());

        let poll_store = store.clone();
        let poll_app = app_handle.clone();
        let poll_folder = folder.clone();

        std::thread::spawn(move || {
            while poll_flag.load(Ordering::Relaxed) {
                std::thread::sleep(Duration::from_secs(2));
                if !poll_flag.load(Ordering::Relaxed) {
                    break;
                }
                poll_folder_for_changes(&poll_folder, &poll_store, &poll_app);
            }
        });

        Ok(())
    }

    pub fn stop(&mut self) {
        if let Some(flag) = self.poll_running.take() {
            flag.store(false, Ordering::Relaxed);
        }
        if let (Some(mut watcher), Some(path)) = (self.watcher.take(), self.watched_path.take()) {
            let _ = watcher.unwatch(&path);
        }
    }
}

fn is_log_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| matches!(ext, "jsonl" | "log" | "json"))
        .unwrap_or(false)
}

fn collect_log_files(dir: &Path) -> Vec<PathBuf> {
    let mut files = Vec::new();
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return files,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            files.extend(collect_log_files(&path));
        } else if path.is_file() && is_log_file(&path) {
            files.push(path);
        }
    }
    files
}

fn poll_folder_for_changes(folder: &Path, store: &LogStore, app: &AppHandle) {
    let log_files = collect_log_files(folder);
    for path in log_files {
        if let Some(entries) = read_new_entries(&path, store) {
            if !entries.is_empty() {
                store.append_entries(entries.clone());
                let _ = app.emit("logs:new-entries", &entries);
            }
        }
    }
}

fn read_new_entries(path: &Path, store: &LogStore) -> Option<Vec<LogEntry>> {
    let path_buf = path.to_path_buf();
    let offset = store.get_offset(&path_buf);

    let mut file = File::open(path).ok()?;
    let file_len = file.metadata().ok()?.len();

    // If the file was truncated/rewritten, reset offset to 0
    let offset = if file_len < offset { 0 } else { offset };

    if file_len <= offset {
        return None;
    }

    file.seek(SeekFrom::Start(offset)).ok()?;
    let reader = BufReader::new(&file);
    let mut entries = Vec::new();

    for line in reader.lines() {
        if let Ok(line) = line {
            if let Some(entry) = parse_log_line(&line) {
                entries.push(entry);
            }
        }
    }

    // Use the actual file length as the offset to avoid drift
    store.set_offset(path_buf, file_len);
    Some(entries)
}

/// Read all entries from a file from the start
pub fn read_file_entries(path: &Path, store: &LogStore) -> Vec<LogEntry> {
    let path_buf = path.to_path_buf();

    let file = match File::open(path) {
        Ok(f) => f,
        Err(_) => return Vec::new(),
    };

    let file_len = file.metadata().map(|m| m.len()).unwrap_or(0);

    let reader = BufReader::new(&file);
    let mut entries = Vec::new();

    for line in reader.lines() {
        if let Ok(line) = line {
            if let Some(entry) = parse_log_line(&line) {
                entries.push(entry);
            }
        }
    }

    store.set_offset(path_buf, file_len);
    entries
}
