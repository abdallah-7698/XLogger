# XLogger

A multiplatform IDE-style log viewer built with Tauri, React, and Rust. XLogger provides a clean, powerful interface for inspecting structured JSON log files from any application.

![macOS](https://img.shields.io/badge/macOS-supported-brightgreen) ![Windows](https://img.shields.io/badge/Windows-supported-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

## Download

Go to the [**Latest Release**](https://github.com/abdallah-7698/XLogger/releases/latest) page and download the installer for your platform:

| Platform | File | Notes |
|----------|------|-------|
| **macOS** (Apple Silicon) | `XLogger_x.x.x_aarch64.dmg` | M1, M2, M3, M4 Macs |
| **macOS** (Intel) | `XLogger_x.x.x_x64.dmg` | Older Intel Macs |
| **Windows** | `XLogger_x.x.x_x64-setup.exe` | Windows 10/11 |

### macOS installation

1. Download the `.dmg` file for your chip (Apple Silicon or Intel)
2. Open the `.dmg` and drag XLogger to **Applications**
3. Open Terminal and run:
   ```bash
   xattr -cr /Applications/XLogger.app
   ```
4. Open XLogger from Applications

### Windows installation

1. Download the `.exe` installer
2. Run the installer and follow the prompts
3. XLogger will be available in your Start menu

## Features

- **Folder-based log loading** — Select a folder and XLogger recursively scans for `.jsonl`, `.log`, and `.json` files
- **Live file watching** — Logs update in real-time as files are modified
- **Category filtering** — Filter by Network, UI, Performance, State, and Background
- **Severity levels** — Filter by Debug, Info, Warning, Error, and Critical
- **Full-text search** — Search across messages, files, functions, threads, and categories
- **Network inspector** — Split Request/Response view with headers, body, and status
- **JSON syntax highlighting** — Color-coded keys, strings, numbers, and booleans
- **Bracket selection** — Double-click any `{`, `}`, `[`, or `]` to select the entire block
- **Resizable panels** — Drag to resize the sidebar, log table, and details panel
- **Dark/Light theme** — Toggle between dark and light mode
- **Copy support** — Copy any field or full log entry to clipboard
- **Keyboard navigation** — Arrow keys to navigate, Cmd+C to copy, Cmd+F to search
- **Session persistence** — Remembers last folder and window size across restarts

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

Plain text lines are also supported — they are wrapped as `info` level `state` category logs.

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

## Building from Source

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri CLI](https://tauri.app/start/)

### Development

```bash
npm install
npx tauri dev
```

### Production Build

```bash
npx tauri build
```

The built app will be in `src-tauri/target/release/bundle/`.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS v4, Radix UI
- **Backend**: Rust, Tauri v2
- **State**: Zustand
- **File Watching**: notify crate (FSEvents on macOS) + polling fallback
