import { useEffect, useRef } from 'react';
import type { LogEntry, LogLevel } from '../lib/types';
import { levelColors, levelLabels, categoryLabels } from '../lib/constants';
import { format, parseISO } from 'date-fns';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ui/context-menu';
import { Copy, FileText, Trash2 } from 'lucide-react';

interface LogTableProps {
  logs: LogEntry[];
  selectedLogId: string | null;
  onSelectLog: (log: LogEntry) => void;
  onCopyLog: (log: LogEntry) => void;
  onDeleteLog?: (log: LogEntry) => void;
  selectedLevel: LogLevel | 'all';
  onSelectLevel: (level: LogLevel | 'all') => void;
  levelCounts: Record<LogLevel, number>;
  levelAllCount: number;
}

function formatTimestamp(ts: string): string {
  try {
    const date = parseISO(ts);
    return format(date, 'HH:mm:ss.SSS');
  } catch {
    return ts.slice(11, 23) || ts;
  }
}

function LogRow({
  log,
  index,
  isSelected,
  onSelectLog,
  onCopyLog,
  onDeleteLog,
}: {
  log: LogEntry;
  index: number;
  isSelected: boolean;
  onSelectLog: (log: LogEntry) => void;
  onCopyLog: (log: LogEntry) => void;
  onDeleteLog?: (log: LogEntry) => void;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          onClick={() => onSelectLog(log)}
          className={`flex items-start gap-3 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer transition-colors ${
            isSelected
              ? 'bg-blue-100 dark:bg-blue-900/30'
              : index % 2 === 0
              ? 'bg-white dark:bg-zinc-900'
              : 'bg-zinc-50 dark:bg-zinc-900/50'
          } hover:bg-zinc-100 dark:hover:bg-zinc-800`}
        >
          {/* Level indicator */}
          <div
            className="w-1 min-h-[20px] self-stretch rounded-full flex-shrink-0"
            style={{ backgroundColor: levelColors[log.level] }}
          />

          {/* Timestamp */}
          <div className="w-28 flex-shrink-0 pt-0.5">
            <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
              {formatTimestamp(log.timestamp)}
            </span>
          </div>

          {/* Level */}
          <div className="w-20 flex-shrink-0 pt-0.5">
            <span className="text-xs font-medium" style={{ color: levelColors[log.level] }}>
              {levelLabels[log.level]}
            </span>
          </div>

          {/* Category */}
          <div className="w-32 flex-shrink-0 pt-0.5">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {categoryLabels[log.category]}
            </span>
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <span className="text-xs text-zinc-900 dark:text-zinc-100 break-words whitespace-pre-wrap">
              {log.message}
            </span>
          </div>

          {/* Thread */}
          <div className="w-24 flex-shrink-0 text-right pt-0.5">
            <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
              {log.thread}
            </span>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onCopyLog(log)}>
          <Copy className="size-4 mr-2" />
          Copy Log
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCopyLog(log)}>
          <FileText className="size-4 mr-2" />
          Copy as JSON
        </ContextMenuItem>
        <ContextMenuSeparator />
        {onDeleteLog && (
          <ContextMenuItem onClick={() => onDeleteLog(log)} className="text-red-600">
            <Trash2 className="size-4 mr-2" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

const levels: (LogLevel | 'all')[] = ['all', 'debug', 'info', 'warning', 'error', 'critical'];

export function LogTable({
  logs,
  selectedLogId,
  onSelectLog,
  onCopyLog,
  onDeleteLog,
  selectedLevel,
  onSelectLevel,
  levelCounts,
  levelAllCount,
}: LogTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedLogId || logs.length === 0) return;

      const currentIndex = logs.findIndex((log) => log.id === selectedLogId);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, logs.length - 1);
        onSelectLog(logs[nextIndex]);
        // Scroll the selected row into view
        const row = scrollRef.current?.children[nextIndex] as HTMLElement;
        row?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        onSelectLog(logs[prevIndex]);
        const row = scrollRef.current?.children[prevIndex] as HTMLElement;
        row?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'c' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onCopyLog(logs[currentIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLogId, logs, onSelectLog, onCopyLog]);

  return (
    <div className="flex-1 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col">
      {/* Level Filter Tabs */}
      <div className="h-8 flex items-center px-2 gap-1 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-x-auto flex-shrink-0">
        {levels.map((level) => {
          const isActive = selectedLevel === level;
          const count = level === 'all' ? levelAllCount : levelCounts[level];
          const label = level === 'all' ? 'All' : levelLabels[level];
          const color = level === 'all' ? undefined : levelColors[level];
          return (
            <button
              key={level}
              onClick={() => onSelectLevel(level)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {color && (
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              )}
              {label}
              <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[10px]">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table Header */}
      <div className="flex items-center gap-3 px-4 h-8 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
        <div className="w-1 flex-shrink-0" />
        <div className="w-28 flex-shrink-0">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Time</span>
        </div>
        <div className="w-20 flex-shrink-0">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Level</span>
        </div>
        <div className="w-32 flex-shrink-0">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Category</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Message</span>
        </div>
        <div className="w-24 flex-shrink-0 text-right">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Thread</span>
        </div>
      </div>

      {/* Log Rows */}
      {logs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No logs to display</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Open a folder containing .jsonl, .log, or .json files
            </p>
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {logs.map((log, index) => (
            <LogRow
              key={log.id}
              log={log}
              index={index}
              isSelected={log.id === selectedLogId}
              onSelectLog={onSelectLog}
              onCopyLog={onCopyLog}
              onDeleteLog={onDeleteLog}
            />
          ))}
        </div>
      )}
    </div>
  );
}
