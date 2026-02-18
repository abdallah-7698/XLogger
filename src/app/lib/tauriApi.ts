import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { LogEntry } from './types';
import type { AppPrefs } from '../hooks/usePreferences';

export async function openFolderDialog(): Promise<string | null> {
  return invoke<string | null>('open_folder_dialog');
}

export async function loadFolder(path: string): Promise<LogEntry[]> {
  return invoke<LogEntry[]>('load_folder', { path });
}

export async function clearLogsBackend(): Promise<void> {
  return invoke('clear_logs');
}

export async function exportLogs(logsJson: string): Promise<void> {
  return invoke('export_logs', { logsJson });
}

export async function startWatching(path: string): Promise<void> {
  return invoke('start_watching', { path });
}

export async function stopWatching(): Promise<void> {
  return invoke('stop_watching');
}

export async function loadPrefs(): Promise<AppPrefs> {
  return invoke<AppPrefs>('load_prefs');
}

export async function savePrefs(prefs: AppPrefs): Promise<void> {
  return invoke('save_prefs', { prefs });
}

export function onNewLogEntries(
  callback: (entries: LogEntry[]) => void
): Promise<UnlistenFn> {
  return listen<LogEntry[]>('logs:new-entries', (event) => {
    callback(event.payload);
  });
}
