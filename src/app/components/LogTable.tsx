import { useEffect, useRef, useState } from 'react';
import { List, useListRef } from 'react-window';
import type { LogEntry } from '../lib/types';
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
}

interface RowProps {
  logs: LogEntry[];
  selectedLogId: string | null;
  onSelectLog: (log: LogEntry) => void;
  onCopyLog: (log: LogEntry) => void;
  onDeleteLog?: (log: LogEntry) => void;
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
  index,
  style,
  logs,
  selectedLogId,
  onSelectLog,
  onCopyLog,
  onDeleteLog,
}: {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: any;
} & RowProps) {
  const log = logs[index];
  const isSelected = log.id === selectedLogId;

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          style={style}
          onClick={() => onSelectLog(log)}
          className={`flex items-center gap-3 px-4 py-0 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer transition-colors ${
            isSelected
              ? 'bg-blue-100 dark:bg-blue-900/30'
              : index % 2 === 0
              ? 'bg-white dark:bg-zinc-900'
              : 'bg-zinc-50 dark:bg-zinc-900/50'
          } hover:bg-zinc-100 dark:hover:bg-zinc-800`}
        >
          {/* Level indicator */}
          <div
            className="w-1 h-6 rounded-full flex-shrink-0"
            style={{ backgroundColor: levelColors[log.level] }}
          />

          {/* Timestamp */}
          <div className="w-28 flex-shrink-0">
            <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
              {formatTimestamp(log.timestamp)}
            </span>
          </div>

          {/* Level */}
          <div className="w-20 flex-shrink-0">
            <span className="text-xs font-medium" style={{ color: levelColors[log.level] }}>
              {levelLabels[log.level]}
            </span>
          </div>

          {/* Category */}
          <div className="w-32 flex-shrink-0">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {categoryLabels[log.category]}
            </span>
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <span className="text-xs text-zinc-900 dark:text-zinc-100 truncate block">
              {log.message}
            </span>
          </div>

          {/* Thread */}
          <div className="w-24 flex-shrink-0 text-right">
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

export function LogTable({
  logs,
  selectedLogId,
  onSelectLog,
  onCopyLog,
  onDeleteLog,
}: LogTableProps) {
  const listRef = useListRef();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Update container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedLogId || logs.length === 0) return;

      const currentIndex = logs.findIndex((log) => log.id === selectedLogId);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, logs.length - 1);
        onSelectLog(logs[nextIndex]);
        listRef.current?.scrollToRow({ index: nextIndex, align: 'smart' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        onSelectLog(logs[prevIndex]);
        listRef.current?.scrollToRow({ index: prevIndex, align: 'smart' });
      } else if (e.key === 'c' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onCopyLog(logs[currentIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLogId, logs, onSelectLog, onCopyLog, listRef]);

  if (logs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-zinc-900">
        <div className="text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No logs to display</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            Open a folder containing .jsonl, .log, or .json files
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 bg-white dark:bg-zinc-900">
      {/* Table Header */}
      <div className="flex items-center gap-3 px-4 h-8 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
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

      {/* Virtualized List */}
      <div style={{ height: containerSize.height - 32 }}>
        <List
          listRef={listRef}
          rowComponent={LogRow}
          rowCount={logs.length}
          rowHeight={36}
          rowProps={{
            logs,
            selectedLogId,
            onSelectLog,
            onCopyLog,
            onDeleteLog,
          }}
        />
      </div>
    </div>
  );
}
