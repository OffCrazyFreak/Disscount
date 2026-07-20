"use client";

import type { AuthMode } from "@/components/custom/auth/auth-modal";

interface IAuthModeSwitchProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}

export default function AuthModeSwitch({ mode, onModeChange }: IAuthModeSwitchProps) {
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
