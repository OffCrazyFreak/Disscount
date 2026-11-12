"use client";

import { createContext, useContext } from "react";

export interface IAvatarSelection {
  preview: string;
  upload: Blob;
}

export interface ISettingsUiContextValue {
  isReady: boolean;
  saving: boolean;
  restored: boolean;
  avatarPreview: string | null;
  avatarTouched: boolean;
  /** Null removes the avatar; the preview is shown at once and the image uploads on save. */
  updateAvatar: (change: IAvatarSelection | null) => void;
  save: () => void;
  resetToDefaults: () => void;
}

const SettingsUiContext = createContext<ISettingsUiContextValue | null>(null);

const SettingsUiProvider = SettingsUiContext.Provider;

export function useSettingsUi(): ISettingsUiContextValue {
  const context = useContext(SettingsUiContext);
  if (!context) {
    throw new Error("useSettingsUi must be used within SettingsUiProvider");
  }
  return context;
}

export default SettingsUiProvider;
