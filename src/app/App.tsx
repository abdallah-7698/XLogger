import { useMemo, useCallback, useRef } from 'react';
import { LoggerToolbar } from './components/LoggerToolbar';
import { LoggerSidebar } from './components/LoggerSidebar';
import { LogTable } from './components/LogTable';
import { LogInspector } from './components/LogInspector';
import { ThemeProvider } from './components/ThemeProvider';
import { StatusBar } from './components/StatusBar';
import { useTauriLogs } from './hooks/useTauriLogs';
import { usePreferences } from './hooks/usePreferences';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useResizable } from './hooks/useResizable';
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

  const sidebarWidthRef = useRef(240);
  const inspectorWidthRef = useRef(480);

  const sidebarResize = useResizable({
    initialWidth: 240, minWidth: 100, maxWidth: 400, direction: 'left',
    getOtherWidth: () => inspectorWidthRef.current,
    minCenterWidth: 300,
  });
  sidebarWidthRef.current = sidebarResize.width;

  const inspectorResize = useResizable({
    initialWidth: 480, minWidth: 200, maxWidth: 900, direction: 'right',
    getOtherWidth: () => sidebarWidthRef.current,
    minCenterWidth: 300,
  });
  inspectorWidthRef.current = inspectorResize.width;

  const sidebarWidth = sidebarResize.width;
  const inspectorWidth = inspectorResize.width;

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

  // Calculate counts for sidebar (context-aware)
  // Level counts consider the active category filter
  const levelCounts = useMemo(() => {
    const counts: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };
    logs.forEach((log) => {
      if (selectedCategory !== 'all' && log.category !== selectedCategory) return;
      counts[log.level]++;
    });
    return counts;
  }, [logs, selectedCategory]);

  // Category counts always reflect all logs (not filtered by level)
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

  // Total count for "All" reflects the other active filter
  const levelAllCount = useMemo(() => {
    if (selectedCategory === 'all') return logs.length;
    return logs.filter((log) => log.category === selectedCategory).length;
  }, [logs, selectedCategory]);

  const categoryAllCount = logs.length;

  const handleSelectCategory = useCallback((category: LogCategory | 'all') => {
    setSelectedCategory(category);
    const firstMatch = logs.find((log) => {
      if (category !== 'all' && log.category !== category) return false;
      if (selectedLevel !== 'all' && log.level !== selectedLevel) return false;
      return true;
    });
    setSelectedLog(firstMatch ?? null);
  }, [logs, selectedLevel, setSelectedCategory, setSelectedLog]);

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
        currentFolder={currentFolder}
      />

      {/* Main Content - Three Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex-shrink-0 relative">
          <LoggerSidebar
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            categoryCounts={categoryCounts}
            categoryAllCount={categoryAllCount}
          />
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500/50 z-10"
            onMouseDown={sidebarResize.onMouseDown}
          />
        </div>

        {/* Center - Log Table */}
        <LogTable
          logs={filteredLogs}
          selectedLogId={selectedLog?.id ?? null}
          onSelectLog={setSelectedLog}
          onCopyLog={handleCopyLog}
          selectedLevel={selectedLevel}
          onSelectLevel={setSelectedLevel}
          levelCounts={levelCounts}
          levelAllCount={levelAllCount}
        />

        {/* Right - Inspector Panel */}
        <div style={{ width: inspectorWidth }} className="flex-shrink-0 relative">
          <div
            className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500/50 z-10"
            onMouseDown={inspectorResize.onMouseDown}
          />
          <LogInspector log={selectedLog} />
        </div>
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
