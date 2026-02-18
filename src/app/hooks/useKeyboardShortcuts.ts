import { useEffect } from 'react';

interface ShortcutHandlers {
  onClearLogs: () => void;
  onExport: () => void;
  onTogglePause: () => void;
  onFocusSearch: () => void;
  onOpenFolder: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handlers.onClearLogs();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        handlers.onExport();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        handlers.onTogglePause();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        handlers.onFocusSearch();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        handlers.onOpenFolder();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
