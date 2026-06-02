/** React glue for Document Settings — load once, persist on change. */

import { useCallback, useState } from 'react';

import { loadSettings, saveSettings, type DocumentSettings } from './documentSettings';

export interface DocumentSettingsApi {
  settings: DocumentSettings;
  update: <K extends keyof DocumentSettings>(key: K, value: DocumentSettings[K]) => void;
}

export function useDocumentSettings(): DocumentSettingsApi {
  const [settings, setSettings] = useState<DocumentSettings>(loadSettings);

  const update = useCallback(
    <K extends keyof DocumentSettings>(key: K, value: DocumentSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        saveSettings(next);
        return next;
      });
    },
    [],
  );

  return { settings, update };
}
