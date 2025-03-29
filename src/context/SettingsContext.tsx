// src/context/SettingsContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { MMKV } from 'react-native-mmkv';

// Create a storage instance for settings
const settingsStorage = new MMKV({ id: 'settings' });

interface ModelSettings {
  n_ctx: number;
  n_batch: number;
  n_threads: number;
  n_gpu_layers: number;
  temperature: number;
  top_p: number;
  n_predict: number;
  systemPrompt: string;
}

// Update the DEFAULT_SETTINGS
const DEFAULT_SETTINGS: ModelSettings = {
  n_ctx: 2048,
  n_batch: 512,
  n_threads: 4,
  n_gpu_layers: 0,
  temperature: 0.7,
  top_p: 0.9,
  n_predict: 1024,
  systemPrompt: "You are an AI assistant running locally on the user's device. Provide brief, helpful responses. Acknowledge limitations when uncertain. Focus on being accurate and useful."
};

// Context interface
interface SettingsContextType {
  settings: ModelSettings;
  updateSettings: (newSettings: Partial<ModelSettings>) => void;
  resetSettings: () => void;
}

// Create context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ModelSettings>(DEFAULT_SETTINGS);

  // Load settings from storage on initial load
  useEffect(() => {
    const savedSettings = settingsStorage.getString('modelSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
        // If parsing fails, reset to defaults
        settingsStorage.set('modelSettings', JSON.stringify(DEFAULT_SETTINGS));
      }
    } else {
      // If no settings exist, save defaults
      settingsStorage.set('modelSettings', JSON.stringify(DEFAULT_SETTINGS));
    }
  }, []);

  // Update settings
  const updateSettings = (newSettings: Partial<ModelSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    settingsStorage.set('modelSettings', JSON.stringify(updatedSettings));
  };

  // Reset to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    settingsStorage.set('modelSettings', JSON.stringify(DEFAULT_SETTINGS));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
  {children}
  </SettingsContext.Provider>
);
};

// Custom hook to use settings
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
