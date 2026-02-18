use notify::{Event, RecursiveMode, Watcher};
use std::fs::File;
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

use crate::log_parser::{parse_log_line, LogEntry};
use crate::log_store::LogStore;

pub struct FileWatcher {
    watcher: Option<notify::RecommendedWatcher>,
    watched_path: Option<PathBuf>,
}

impl FileWatcher {
    pub fn new() -> Self {
        Self {
            watcher: None,
            watched_path: None,
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

        let mut watcher =
            notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
                if let Ok(event) = res {
                    if matches!(
                        event.kind,
                        notify::EventKind::Modify(_) | notify::EventKind::Create(_)
                    ) {
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
                }
            })?;

        watcher.watch(&folder, RecursiveMode::NonRecursive)?;
        self.watcher = Some(watcher);
        self.watched_path = Some(folder);
        Ok(())
    }

    pub fn stop(&mut self) {
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

fn read_new_entries(path: &Path, store: &LogStore) -> Option<Vec<LogEntry>> {
    let path_buf = path.to_path_buf();
    let offset = store.get_offset(&path_buf);

    let mut file = File::open(path).ok()?;
    let file_len = file.metadata().ok()?.len();

    if file_len <= offset {
        return None;
    }

    file.seek(SeekFrom::Start(offset)).ok()?;
    let reader = BufReader::new(&file);
    let mut entries = Vec::new();
    let mut bytes_read = offset;

    for line in reader.lines() {
        if let Ok(line) = line {
            bytes_read += line.len() as u64 + 1; // +1 for newline
            if let Some(entry) = parse_log_line(&line) {
                entries.push(entry);
            }
        }
    }

    store.set_offset(path_buf, bytes_read);
    Some(entries)
}

/// Read all entries from a file from the start
pub fn read_file_entries(path: &Path, store: &LogStore) -> Vec<LogEntry> {
    let path_buf = path.to_path_buf();

    let file = match File::open(path) {
        Ok(f) => f,
        Err(_) => return Vec::new(),
    };

    let reader = BufReader::new(&file);
    let mut entries = Vec::new();
    let mut bytes_read: u64 = 0;

    for line in reader.lines() {
        if let Ok(line) = line {
            bytes_read += line.len() as u64 + 1;
            if let Some(entry) = parse_log_line(&line) {
                entries.push(entry);
            }
        }
    }

    store.set_offset(path_buf, bytes_read);
    entries
}
