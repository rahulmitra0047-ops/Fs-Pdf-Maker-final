
import { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../../types';
import { settingsService, db } from '../../core/storage/services';
import { aiManager } from '../../core/ai/aiManager';

const DEFAULT_SETTINGS: AppSettings = {
  id: 'default',
  theme: 'system', 
  soundEnabled: true,
  vibrationEnabled: true,
  railwayBaseUrl: 'https://super-duper-spoon-production-b6e8.up.railway.app',
  geminiApiKeys: [],
  preferredModel: 'gemini-3-flash-preview' // Default model
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const saved = await settingsService.getById('default');
      if (saved) {
        // Merge defaults in case new keys were added
        const merged = { ...DEFAULT_SETTINGS, ...saved };
        setSettings(merged);
        
        // Sync AI Manager state immediately
        if (merged.geminiApiKeys) aiManager.setKeys(merged.geminiApiKeys);
        if (merged.preferredModel) aiManager.setModel(merged.preferredModel);
      } else {
        // Initialize defaults
        await settingsService.create(DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
        
        // Init AI defaults
        aiManager.setModel(DEFAULT_SETTINGS.preferredModel!);
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
    
    // Live update AI Manager
    if (partial.geminiApiKeys) aiManager.setKeys(partial.geminiApiKeys);
    if (partial.preferredModel) aiManager.setModel(partial.preferredModel);
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
    aiManager.setModel(DEFAULT_SETTINGS.preferredModel!);
  };

  return {
    settings,
    updateSettings,
    clearAllData,
    isLoading,
    refreshSettings: loadSettings
  };
};
