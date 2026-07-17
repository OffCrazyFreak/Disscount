"use client";

import type { AuthMode } from "@/components/custom/header/forms/auth-modal";

interface AuthModeSwitchProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}

export function AuthModeSwitch({ mode, onModeChange }: AuthModeSwitchProps) {
  if (mode === "forgot") return null;

  return (
    <span>
      {mode === "login" ? "Još nemaš račun? " : "Već imaš račun? "}
      <button
        type="button"
        onClick={() => onModeChange(mode === "login" ? "signup" : "login")}
        className="cursor-pointer underline text-primary hover:text-primary/80"
      >
        {mode === "login" ? "Registriraj se" : "Prijavi se"}
      </button>
    </span>
  );
}
