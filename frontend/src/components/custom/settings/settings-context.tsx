"use client";

import { createContext, useContext } from "react";

export interface SettingsUiContextValue {
  isReady: boolean;
  saving: boolean;
  restored: boolean;
  avatarPreview: string | null;
  avatarTouched: boolean;
  updateAvatar: (preview: string | null) => void;
  save: () => void;
  resetToDefaults: () => void;
}

const SettingsUiContext = createContext<SettingsUiContextValue | null>(null);

const SettingsUiProvider = SettingsUiContext.Provider;

export function useSettingsUi(): SettingsUiContextValue {
  const context = useContext(SettingsUiContext);
  if (!context) {
    throw new Error("useSettingsUi must be used within SettingsUiProvider");
  }
  return context;
}

export default SettingsUiProvider;
