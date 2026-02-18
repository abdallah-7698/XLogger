import { useMemo, useCallback } from 'react';
import { LoggerToolbar } from './components/LoggerToolbar';
import { LoggerSidebar } from './components/LoggerSidebar';
import { LogTable } from './components/LogTable';
import { LogInspector } from './components/LogInspector';
import { ThemeProvider } from './components/ThemeProvider';
import { StatusBar } from './components/StatusBar';
import { useTauriLogs } from './hooks/useTauriLogs';
import { usePreferences } from './hooks/usePreferences';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLogStore } from './store/logStore';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import type { LogEntry, LogLevel, LogCategory } from './lib/types';

function LoggerApp() {
  const {
    logs,
    selectedLog,
    selectedLevel,
    selectedCategory,
    searchQuery,
    isPaused,
    currentFolder,
    isLoading,
    setSelectedLog,
    setSelectedLevel,
    setSelectedCategory,
    setSearchQuery,
    togglePaused,
  } = useLogStore();

  const { handleOpenFolder, handleClearLogs, handleExport } = useTauriLogs();
  usePreferences();

  // Filter logs based on level, category, and search query
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedLevel !== 'all' && log.level !== selectedLevel) {
        return false;
      }
      if (selectedCategory !== 'all' && log.category !== selectedCategory) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          log.message.toLowerCase().includes(query) ||
          log.level.toLowerCase().includes(query) ||
          log.category.toLowerCase().includes(query) ||
          log.thread.toLowerCase().includes(query) ||
          log.file?.toLowerCase().includes(query) ||
          log.function?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [logs, selectedLevel, selectedCategory, searchQuery]);

  // Calculate counts for sidebar
  const levelCounts = useMemo(() => {
    const counts: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };
    logs.forEach((log) => {
      counts[log.level]++;
    });
    return counts;
  }, [logs]);

  const categoryCounts = useMemo(() => {
    const counts: Record<LogCategory, number> = {
      network: 0,
      ui: 0,
      performance: 0,
      state: 0,
      background: 0,
    };
    logs.forEach((log) => {
      counts[log.category]++;
    });
    return counts;
  }, [logs]);

  const handleCopyLog = useCallback((log: LogEntry) => {
    const logText = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(logText);
    toast.success('Log copied to clipboard');
  }, []);

  const onExport = useCallback(() => {
    handleExport(filteredLogs);
  }, [handleExport, filteredLogs]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onClearLogs: handleClearLogs,
    onExport: onExport,
    onTogglePause: togglePaused,
    onFocusSearch: () => {
      const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      searchInput?.focus();
    },
    onOpenFolder: handleOpenFolder,
  });

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-100 dark:bg-zinc-950">
      {/* Toolbar */}
      <LoggerToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isPaused={isPaused}
        onTogglePause={togglePaused}
        onClearLogs={handleClearLogs}
        onExport={onExport}
        onOpenFolder={handleOpenFolder}
        totalLogs={logs.length}
        filteredLogs={filteredLogs.length}
        currentFolder={currentFolder}
      />

      {/* Main Content - Three Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LoggerSidebar
          selectedLevel={selectedLevel}
          onSelectLevel={setSelectedLevel}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          levelCounts={levelCounts}
          categoryCounts={categoryCounts}
          totalCount={logs.length}
        />

        {/* Center - Log Table */}
        <LogTable
          logs={filteredLogs}
          selectedLogId={selectedLog?.id ?? null}
          onSelectLog={setSelectedLog}
          onCopyLog={handleCopyLog}
        />

        {/* Right - Inspector Panel */}
        <LogInspector log={selectedLog} />
      </div>

      {/* Status Bar */}
      <StatusBar
        currentFolder={currentFolder}
        totalLogs={logs.length}
        isLoading={isLoading}
      />

      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="logger-console-theme">
      <LoggerApp />
    </ThemeProvider>
  );
}

export default App;
