# XLogger

A multiplatform IDE-style log viewer built with Tauri, React, and Rust. XLogger provides a clean, powerful interface for inspecting structured JSON log files from any application.

![macOS](https://img.shields.io/badge/macOS-supported-brightgreen) ![Windows](https://img.shields.io/badge/Windows-supported-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Folder-based log loading** — Select a folder and XLogger recursively scans for `.jsonl`, `.log`, and `.json` files
- **Live file watching** — Logs update in real-time as files are modified
- **Category filtering** — Filter by Network, UI, Performance, State, and Background
- **Severity levels** — Filter by Debug, Info, Warning, Error, and Critical
- **Full-text search** — Search across messages, files, functions, threads, and categories
- **Network inspector** — Split Request/Response view with headers, body, and status
- **JSON syntax highlighting** — Color-coded keys, strings, numbers, and booleans with proper indentation
- **Bracket selection** — Double-click any `{`, `}`, `[`, or `]` to select the entire block
- **Resizable panels** — Drag to resize the sidebar, log table, and details panel
- **Dark/Light theme** — Toggle between dark and light mode
- **Copy support** — Copy any field or full log entry to clipboard
- **Keyboard navigation** — Arrow keys to navigate, Cmd+C to copy, Cmd+F to search
- **Session persistence** — Remembers last folder and window size across restarts

## Download

### macOS

1. Go to [Releases](https://github.com/abdallah-7698/XLogger/releases)
2. Download `XLogger_x.x.x_aarch64.dmg` (Apple Silicon) or `XLogger_x.x.x_x64.dmg` (Intel)
3. Open the `.dmg` and drag XLogger to Applications
4. On first launch, right-click the app and select "Open" to bypass Gatekeeper

### Windows

1. Go to [Releases](https://github.com/abdallah-7698/XLogger/releases)
2. Download `XLogger_x.x.x_x64-setup.exe`
3. Run the installer and follow the prompts
4. XLogger will be available in your Start menu

## Log Format

XLogger reads JSON log files (`.jsonl`, `.log`, `.json`) with one JSON object per line:

```json
{
  "id": "log-001",
  "timestamp": "2026-02-18T10:00:00.000Z",
  "level": "info",
  "category": "network",
  "message": "Request completed",
  "thread": "background-1",
  "file": "NetworkService.swift",
  "function": "fetchData()",
  "line": 123,
  "metadata": {
    "userId": 42
  },
  "networkDetails": {
    "url": "https://api.example.com/v1/users",
    "method": "GET",
    "statusCode": 200,
    "duration": 340,
    "requestHeaders": { "Authorization": "Bearer ..." },
    "requestBody": { "query": "..." },
    "responseBody": { "success": true, "data": {} }
  },
  "performanceDetails": {
    "startTime": 1708243200000,
    "endTime": 1708243200340,
    "duration": 340,
    "memoryDelta": 1024
  }
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | The log message |
| `level` | string | `debug`, `info`, `warning`, `error`, or `critical` |
| `category` | string | `network`, `ui`, `performance`, `state`, or `background` |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (auto-generated if missing) |
| `timestamp` | string | ISO 8601 timestamp (auto-generated if missing) |
| `thread` | string | Thread name (defaults to `main`) |
| `file` | string | Source file path |
| `function` | string | Function name |
| `line` | number | Line number |
| `queueLabel` | string | Dispatch queue label |
| `metadata` | object | Key-value pairs for extra context |
| `networkDetails` | object | Network request/response data |
| `performanceDetails` | object | Performance timing data |

XLogger also handles plain text lines — they are wrapped as `info` level `state` category logs.

## Building from Source

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri CLI](https://tauri.app/start/)

### Development

```bash
# Install dependencies
npm install

# Run in development mode
npx tauri dev
```

### Production Build

```bash
# Build for your current platform
npx tauri build
```

The built app will be in `src-tauri/target/release/bundle/`.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + O` | Open folder |
| `Cmd/Ctrl + F` | Focus search |
| `Cmd/Ctrl + K` | Clear logs |
| `Cmd/Ctrl + E` | Export logs |
| `Cmd/Ctrl + P` | Pause/Resume |
| `Cmd/Ctrl + C` | Copy selected log |
| `Arrow Up/Down` | Navigate logs |

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS v4, Radix UI
- **Backend**: Rust, Tauri v2
- **State**: Zustand
- **File Watching**: notify crate (FSEvents on macOS) + polling fallback
