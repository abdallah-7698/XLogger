import { useEffect, useRef } from 'react';
import { loadPrefs, savePrefs, loadFolder, startWatching } from '../lib/tauriApi';
import { useLogStore } from '../store/logStore';

export interface AppPrefs {
  lastFolder: string | null;
  theme: string;
  windowWidth: number | null;
  windowHeight: number | null;
}

export function usePreferences() {
  const { currentFolder, setCurrentFolder, setLogs, setIsLoading } = useLogStore();
  const hasRestored = useRef(false);

  // Load preferences on mount and restore last folder
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    loadPrefs()
      .then(async (prefs) => {
        if (prefs.lastFolder && !currentFolder) {
          setIsLoading(true);
          setCurrentFolder(prefs.lastFolder);
          try {
            const entries = await loadFolder(prefs.lastFolder);
            setLogs(entries);
            await startWatching(prefs.lastFolder);
          } catch {
            // Folder may no longer exist — clear it
            setCurrentFolder(null);
          } finally {
            setIsLoading(false);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Save preferences when folder changes
  useEffect(() => {
    if (currentFolder) {
      savePrefs({
        lastFolder: currentFolder,
        theme: 'system',
        windowWidth: null,
        windowHeight: null,
      }).catch(() => {});
    }
  }, [currentFolder]);

  return { currentFolder };
}
