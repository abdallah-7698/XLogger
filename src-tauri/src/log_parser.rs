use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum LogLevel {
    Debug,
    Info,
    Warning,
    Error,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum LogCategory {
    Network,
    Ui,
    Performance,
    State,
    Background,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkDetails {
    pub url: String,
    pub method: String,
    pub status_code: u16,
    pub duration: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_headers: Option<HashMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_body: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub response_body: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PerformanceDetails {
    pub start_time: f64,
    pub end_time: f64,
    pub duration: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub memory_delta: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub id: String,
    pub timestamp: String,
    pub level: LogLevel,
    pub category: LogCategory,
    pub message: String,
    pub thread: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
    #[serde(rename = "function", skip_serializing_if = "Option::is_none")]
    pub function_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub queue_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub network_details: Option<NetworkDetails>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub performance_details: Option<PerformanceDetails>,
}

/// parse_log_line tries to parse a line as JSON into LogEntry.
/// If the JSON doesn't have an id, generate one.
/// If the JSON doesn't have required fields, try to construct a basic entry.
/// Return None for completely unparseable lines.
pub fn parse_log_line(line: &str) -> Option<LogEntry> {
    let line = line.trim();
    if line.is_empty() {
        return None;
    }

    // Try full JSON parse
    if let Ok(mut entry) = serde_json::from_str::<LogEntry>(line) {
        if entry.id.is_empty() {
            entry.id = uuid::Uuid::new_v4().to_string();
        }
        return Some(entry);
    }

    // Try partial JSON - extract what we can
    if let Ok(obj) = serde_json::from_str::<serde_json::Value>(line) {
        if let Some(map) = obj.as_object() {
            let id = map
                .get("id")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let id = if id.is_empty() {
                uuid::Uuid::new_v4().to_string()
            } else {
                id
            };

            let timestamp = map
                .get("timestamp")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let timestamp = if timestamp.is_empty() {
                chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
            } else {
                timestamp
            };

            let level = map
                .get("level")
                .and_then(|v| v.as_str())
                .and_then(|s| match s.to_lowercase().as_str() {
                    "debug" => Some(LogLevel::Debug),
                    "info" => Some(LogLevel::Info),
                    "warning" | "warn" => Some(LogLevel::Warning),
                    "error" => Some(LogLevel::Error),
                    "critical" | "fatal" => Some(LogLevel::Critical),
                    _ => None,
                })
                .unwrap_or(LogLevel::Info);

            let category = map
                .get("category")
                .and_then(|v| v.as_str())
                .and_then(|s| match s.to_lowercase().as_str() {
                    "network" => Some(LogCategory::Network),
                    "ui" => Some(LogCategory::Ui),
                    "performance" => Some(LogCategory::Performance),
                    "state" => Some(LogCategory::State),
                    "background" => Some(LogCategory::Background),
                    _ => None,
                })
                .unwrap_or(LogCategory::State);

            let message = map
                .get("message")
                .and_then(|v| v.as_str())
                .unwrap_or("(no message)")
                .to_string();

            let thread = map
                .get("thread")
                .and_then(|v| v.as_str())
                .unwrap_or("main")
                .to_string();

            let metadata = map
                .get("metadata")
                .and_then(|v| v.as_object())
                .map(|m| m.iter().map(|(k, v)| (k.clone(), v.clone())).collect());

            let network_details = map
                .get("networkDetails")
                .and_then(|v| serde_json::from_value::<NetworkDetails>(v.clone()).ok());

            let performance_details = map
                .get("performanceDetails")
                .and_then(|v| serde_json::from_value::<PerformanceDetails>(v.clone()).ok());

            return Some(LogEntry {
                id,
                timestamp,
                level,
                category,
                message,
                thread,
                file: map.get("file").and_then(|v| v.as_str()).map(String::from),
                function_name: map
                    .get("function")
                    .and_then(|v| v.as_str())
                    .map(String::from),
                line: map.get("line").and_then(|v| v.as_u64()).map(|n| n as u32),
                queue_label: map
                    .get("queueLabel")
                    .and_then(|v| v.as_str())
                    .map(String::from),
                metadata,
                network_details,
                performance_details,
            });
        }
    }

    // Plain text line - wrap in basic entry
    Some(LogEntry {
        id: uuid::Uuid::new_v4().to_string(),
        timestamp: chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
        level: LogLevel::Info,
        category: LogCategory::State,
        message: line.to_string(),
        thread: "main".to_string(),
        file: None,
        function_name: None,
        line: None,
        queue_label: None,
        metadata: None,
        network_details: None,
        performance_details: None,
    })
}
