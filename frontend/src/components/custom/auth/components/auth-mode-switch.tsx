"use client";

import { useTranslations } from "next-intl";

import type { AuthMode } from "@/components/custom/auth/auth-modal";

interface IAuthModeSwitchProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}

export default function AuthModeSwitch({
  mode,
  onModeChange,
}: IAuthModeSwitchProps) {
  const t = useTranslations("auth");

  if (mode === "forgot") return null;

  return (
    <span>
      {mode === "login"
        ? t("modeSwitch.noAccount")
        : t("modeSwitch.hasAccount")}{" "}
      <button
        type="button"
        onClick={() => onModeChange(mode === "login" ? "signup" : "login")}
        className="cursor-pointer underline text-primary hover:text-primary/80"
      >
        {mode === "login" ? t("actions.signUp") : t("actions.logIn")}
      </button>
    </span>
  );
}
