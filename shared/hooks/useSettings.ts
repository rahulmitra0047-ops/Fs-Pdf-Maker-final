
import { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../../types';
import { settingsService, db } from '../../core/storage/services';

const DEFAULT_SETTINGS: AppSettings = {
  id: 'default',
  theme: 'system', 
  soundEnabled: true,
  vibrationEnabled: true,
  railwayBaseUrl: 'https://super-duper-spoon-production-b6e8.up.railway.app',
  geminiApiKeys: []
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const saved = await settingsService.getById('default');
      if (saved) {
        // Merge defaults in case new keys were added
        setSettings({ ...DEFAULT_SETTINGS, ...saved });
      } else {
        // Initialize defaults
        await settingsService.create(DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = async (partial: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...partial };
    setSettings(newSettings);
    await settingsService.update('default', partial);
  };

  const clearAllData = async () => {
    // Clear all tables
    await (db as any).transaction('rw', db.documents, db.topics, db.subtopics, db.mcqSets, db.settings, async () => {
       await db.documents.clear();
       await db.topics.clear();
       await db.subtopics.clear();
       await db.mcqSets.clear();
       await db.settings.clear();
       
       // Re-init settings
       await db.settings.add(DEFAULT_SETTINGS);
    });
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSettings,
    clearAllData,
    isLoading,
    refreshSettings: loadSettings
  };
};
