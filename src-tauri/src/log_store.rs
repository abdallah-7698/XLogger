use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::{AtomicUsize, Ordering};

use parking_lot::RwLock;

use crate::log_parser::LogEntry;

pub struct LogStore {
    entries: RwLock<Vec<LogEntry>>,
    offsets: RwLock<HashMap<PathBuf, u64>>,
    error_count: AtomicUsize,
}

impl LogStore {
    pub fn new() -> Self {
        Self {
            entries: RwLock::new(Vec::new()),
            offsets: RwLock::new(HashMap::new()),
            error_count: AtomicUsize::new(0),
        }
    }

    pub fn append_entries(&self, new_entries: Vec<LogEntry>) {
        for entry in &new_entries {
            if matches!(
                entry.level,
                crate::log_parser::LogLevel::Error | crate::log_parser::LogLevel::Critical
            ) {
                self.error_count.fetch_add(1, Ordering::Relaxed);
            }
        }
        self.entries.write().extend(new_entries);
    }

    pub fn get_all(&self) -> Vec<LogEntry> {
        self.entries.read().clone()
    }

    pub fn clear(&self) {
        self.entries.write().clear();
        self.error_count.store(0, Ordering::Relaxed);
    }

    pub fn get_offset(&self, path: &PathBuf) -> u64 {
        self.offsets.read().get(path).copied().unwrap_or(0)
    }

    pub fn set_offset(&self, path: PathBuf, offset: u64) {
        self.offsets.write().insert(path, offset);
    }

    pub fn clear_offsets(&self) {
        self.offsets.write().clear();
    }

    pub fn error_count(&self) -> usize {
        self.error_count.load(Ordering::Relaxed)
    }
}
