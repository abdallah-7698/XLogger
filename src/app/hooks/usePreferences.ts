import { useEffect } from 'react';
import { loadPrefs, savePrefs } from '../lib/tauriApi';
import { useLogStore } from '../store/logStore';

export interface AppPrefs {
  lastFolder: string | null;
  theme: string;
  windowWidth: number | null;
  windowHeight: number | null;
}

export function usePreferences() {
  const { currentFolder, setCurrentFolder } = useLogStore();

  // Load preferences on mount
  useEffect(() => {
    loadPrefs()
      .then((prefs) => {
        if (prefs.lastFolder && !currentFolder) {
          setCurrentFolder(prefs.lastFolder);
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
