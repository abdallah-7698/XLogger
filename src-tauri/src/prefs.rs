use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppPrefs {
    pub last_folder: Option<String>,
    pub theme: String,
    pub window_width: Option<f64>,
    pub window_height: Option<f64>,
}

impl Default for AppPrefs {
    fn default() -> Self {
        Self {
            last_folder: None,
            theme: "system".to_string(),
            window_width: Some(1400.0),
            window_height: Some(900.0),
        }
    }
}

pub fn load_prefs_from(path: &PathBuf) -> AppPrefs {
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn save_prefs_to(path: &PathBuf, prefs: &AppPrefs) -> anyhow::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let json = serde_json::to_string_pretty(prefs)?;
    fs::write(path, json)?;
    Ok(())
}
