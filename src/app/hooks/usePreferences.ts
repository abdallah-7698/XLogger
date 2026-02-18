import { useEffect, useRef } from 'react';
import { loadPrefs, savePrefs, loadFolder, startWatching } from '../lib/tauriApi';
import { useLogStore } from '../store/logStore';
import { getCurrentWindow } from '@tauri-apps/api/window';

export interface AppPrefs {
  lastFolder: string | null;
  theme: string;
  windowWidth: number | null;
  windowHeight: number | null;
}

export function usePreferences() {
  const { currentFolder, setCurrentFolder, setLogs, setSelectedLog, setIsLoading } = useLogStore();
  const hasRestored = useRef(false);

  // Load preferences on mount and restore last folder + window size
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    loadPrefs()
      .then(async (prefs) => {
        // Restore window size
        if (prefs.windowWidth && prefs.windowHeight) {
          const appWindow = getCurrentWindow();
          await appWindow.setSize(
            new (await import('@tauri-apps/api/dpi')).LogicalSize(prefs.windowWidth, prefs.windowHeight)
          );
        }

        if (prefs.lastFolder && !currentFolder) {
          setIsLoading(true);
          setCurrentFolder(prefs.lastFolder);
          try {
            const entries = await loadFolder(prefs.lastFolder);
            setLogs(entries);
            setSelectedLog(entries.length > 0 ? entries[0] : null);
            await startWatching(prefs.lastFolder);
          } catch {
            setCurrentFolder(null);
          } finally {
            setIsLoading(false);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Save preferences when folder changes + save window size on resize
  useEffect(() => {
    const saveCurrentPrefs = async () => {
      const appWindow = getCurrentWindow();
      const size = await appWindow.innerSize();
      const scaleFactor = await appWindow.scaleFactor();
      savePrefs({
        lastFolder: currentFolder,
        theme: 'system',
        windowWidth: Math.round(size.width / scaleFactor),
        windowHeight: Math.round(size.height / scaleFactor),
      }).catch(() => {});
    };

    if (currentFolder) {
      saveCurrentPrefs();
    }

    // Save window size on resize
    let timeout: ReturnType<typeof setTimeout>;
    const unlisten = getCurrentWindow().onResized(() => {
      clearTimeout(timeout);
      timeout = setTimeout(saveCurrentPrefs, 500);
    });

    return () => {
      clearTimeout(timeout);
      unlisten.then((fn) => fn());
    };
  }, [currentFolder]);

  return { currentFolder };
}
