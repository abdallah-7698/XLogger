import { useEffect, useCallback } from 'react';
import { useLogStore } from '../store/logStore';
import {
  openFolderDialog,
  loadFolder,
  startWatching,
  stopWatching,
  clearLogsBackend,
  exportLogs,
  onNewLogEntries,
} from '../lib/tauriApi';
import { toast } from 'sonner';
import type { LogEntry } from '../lib/types';

export function useTauriLogs() {
  const {
    setLogs,
    appendLogs,
    clearLogs,
    setCurrentFolder,
    setSelectedLog,
    setIsLoading,
    currentFolder,
  } = useLogStore();

  // Listen for real-time log entries
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    onNewLogEntries((entries: LogEntry[]) => {
      appendLogs(entries);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, [appendLogs]);

  const handleOpenFolder = useCallback(async () => {
    try {
      const folder = await openFolderDialog();
      if (!folder) return;

      setIsLoading(true);
      setCurrentFolder(folder);

      // Stop existing watcher
      await stopWatching().catch(() => {});

      // Load all existing logs
      const entries = await loadFolder(folder);
      setLogs(entries);
      setSelectedLog(entries.length > 0 ? entries[0] : null);

      // Start watching for new entries
      await startWatching(folder);

      toast.success(`Loaded ${entries.length} log entries`);
    } catch (err) {
      toast.error(`Failed to open folder: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [setLogs, setSelectedLog, setCurrentFolder, setIsLoading]);

  const handleClearLogs = useCallback(async () => {
    try {
      await clearLogsBackend();
      clearLogs();
      toast.success('All logs cleared');
    } catch (err) {
      toast.error(`Failed to clear logs: ${err}`);
    }
  }, [clearLogs]);

  const handleExport = useCallback(async (filteredLogs: LogEntry[]) => {
    try {
      const json = JSON.stringify(filteredLogs, null, 2);
      await exportLogs(json);
      toast.success(`Exported ${filteredLogs.length} logs`);
    } catch (err) {
      toast.error(`Failed to export: ${err}`);
    }
  }, []);

  const handleReloadFolder = useCallback(async () => {
    if (!currentFolder) return;
    try {
      setIsLoading(true);
      const entries = await loadFolder(currentFolder);
      setLogs(entries);
      toast.success(`Reloaded ${entries.length} log entries`);
    } catch (err) {
      toast.error(`Failed to reload: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentFolder, setLogs, setIsLoading]);

  return {
    handleOpenFolder,
    handleClearLogs,
    handleExport,
    handleReloadFolder,
  };
}
