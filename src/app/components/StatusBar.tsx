interface StatusBarProps {
  currentFolder: string | null;
  totalLogs: number;
  isLoading: boolean;
}

export function StatusBar({ currentFolder, totalLogs, isLoading }: StatusBarProps) {
  return (
    <div className="h-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center px-4 text-xs text-zinc-500 dark:text-zinc-400 gap-4">
      {isLoading && (
        <span className="text-blue-500">Loading...</span>
      )}
      {currentFolder && (
        <span className="truncate" title={currentFolder}>
          {currentFolder}
        </span>
      )}
      <span className="ml-auto font-mono">
        {totalLogs.toLocaleString()} entries
      </span>
    </div>
  );
}
