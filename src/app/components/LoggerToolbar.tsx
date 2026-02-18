import { Search, Trash2, Play, Pause, Download, FolderOpen, Sun, Moon } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useTheme } from './ThemeProvider';

interface LoggerToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onClearLogs: () => void;
  onExport: () => void;
  onOpenFolder: () => void;
  totalLogs: number;
  filteredLogs: number;
  currentFolder: string | null;
}

export function LoggerToolbar({
  searchQuery,
  onSearchChange,
  isPaused,
  onTogglePause,
  onClearLogs,
  onExport,
  onOpenFolder,
  totalLogs,
  filteredLogs,
  currentFolder,
}: LoggerToolbarProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center pl-20 pr-4 gap-3" data-tauri-drag-region>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenFolder}
          className="h-7 px-2 text-xs"
          title="Open folder (⌘O)"
        >
          <FolderOpen className="size-3.5 mr-1.5" />
          Open
        </Button>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onTogglePause}
          className="h-7 px-2 text-xs"
          title={isPaused ? 'Resume logging (⌘P)' : 'Pause logging (⌘P)'}
        >
          {isPaused ? (
            <>
              <Play className="size-3.5 mr-1.5" />
              Resume
            </>
          ) : (
            <>
              <Pause className="size-3.5 mr-1.5" />
              Pause
            </>
          )}
        </Button>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearLogs}
          className="h-7 px-2 text-xs"
          title="Clear all logs (⌘K)"
        >
          <Trash2 className="size-3.5 mr-1.5" />
          Clear
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          className="h-7 px-2 text-xs"
          title="Export logs (⌘E)"
        >
          <Download className="size-3.5 mr-1.5" />
          Export
        </Button>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-7 w-7 p-0"
          title={`Theme: ${theme}`}
        >
          {theme === 'dark' ? (
            <Moon className="size-3.5" />
          ) : (
            <Sun className="size-3.5" />
          )}
        </Button>
      </div>

      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search logs (⌘F)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-7 pl-8 pr-3 text-xs bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto text-xs text-zinc-500">
        {currentFolder && (
          <span className="text-zinc-400 truncate max-w-48" title={currentFolder}>
            {currentFolder.split('/').pop()}
          </span>
        )}
        <span className="font-mono">
          {filteredLogs.toLocaleString()} / {totalLogs.toLocaleString()} logs
        </span>
        {isPaused && (
          <Badge variant="outline" className="h-5 px-1.5 text-xs border-amber-500 text-amber-600 dark:text-amber-500">
            Paused
          </Badge>
        )}
      </div>
    </div>
  );
}
